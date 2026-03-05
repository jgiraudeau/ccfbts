from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, Evaluation, StudentSubmission, EvaluationScore, EvaluationAttachment
from app.models_tracking import Submission, UploadedFile
from app.auth import verify_password, create_access_token, get_password_hash, get_current_user, get_current_admin_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AdminLogin(BaseModel):
    email: str
    password: str

@router.post("/auth/admin")
def login_admin(creds: AdminLogin, db: Session = Depends(get_db)):
    """Connexion administrateur — route dédiée"""
    user = db.query(User).filter(User.email == creds.email, User.role == "admin").first()

    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    # Vérification bcrypt uniquement
    if not user.hashed_password or not (user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")):
        raise HTTPException(status_code=401, detail="Mot de passe non configuré")

    if not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    access_token = create_access_token(data={"sub": user.email, "role": "admin"})

    return {
        "id": user.id,
        "name": user.name,
        "role": "admin",
        "access_token": access_token,
        "token_type": "bearer"
    }

class TeacherLogin(BaseModel):
    email: str
    pin: str

@router.post("/auth/teacher")
def login_teacher(creds: TeacherLogin, db: Session = Depends(get_db)):
    """Connexion professeur uniquement"""
    user = db.query(User).filter(User.email == creds.email, User.role == "teacher").first()

    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    # Vérification bcrypt
    if user.hashed_password and (user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")):
        if not verify_password(creds.pin, user.hashed_password):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    # Fallback class_code pour les anciens comptes
    elif user.class_code and user.class_code == creds.pin:
        pass
    else:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    access_token = create_access_token(data={"sub": user.email, "role": "teacher"})

    return {
        "id": user.id,
        "name": user.name,
        "role": "teacher",
        "class_code": user.class_code,
        "access_token": access_token,
        "token_type": "bearer"
    }

class StudentLoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/student")
def login_student(creds: StudentLoginRequest, db: Session = Depends(get_db)):
    """Connexion élève : identifiant (prenom-nom) + mot de passe (bcrypt ou legacy)"""
    student = db.query(User).filter(
        User.username == creds.username.lower().strip(),
        User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=401, detail="Identifiant inconnu")

    authenticated = False

    # 1. Essayer bcrypt (hashed_password) en priorité
    if student.hashed_password and (student.hashed_password.startswith("$2b$") or student.hashed_password.startswith("$2a$")):
        if verify_password(creds.password, student.hashed_password):
            authenticated = True

    # 2. Fallback : mot de passe en clair (legacy) — migration automatique vers bcrypt
    if not authenticated and student.student_password:
        if student.student_password == creds.password:
            authenticated = True
            # Migration auto : hasher et effacer le mot de passe en clair
            student.hashed_password = get_password_hash(creds.password)
            student.student_password = None
            db.commit()
            print(f"🔒 Migration auto: mot de passe hashé pour {student.username}")

    if not authenticated:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")

    # Enregistrer le consentement RGPD au premier login
    if student.consent_given_at is None:
        student.consent_given_at = datetime.utcnow()
        db.commit()

    access_token = create_access_token(data={"sub": student.email, "role": "student"})

    return {
        "id": student.id,
        "name": student.name,
        "username": student.username,
        "role": "student",
        "access_token": access_token,
        "token_type": "bearer"
    }

class ChangePasswordRequest(BaseModel):
    student_id: int
    old_password: str
    new_password: str

@router.post("/auth/student/password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Élève introuvable")

    # Vérifier ancien mot de passe (bcrypt ou legacy)
    old_ok = False
    if student.hashed_password and (student.hashed_password.startswith("$2b$") or student.hashed_password.startswith("$2a$")):
        old_ok = verify_password(req.old_password, student.hashed_password)
    if not old_ok and student.student_password:
        old_ok = (student.student_password == req.old_password)

    if not old_ok:
        raise HTTPException(status_code=401, detail="Ancien code incorrect")

    # Stocker le nouveau mot de passe hashé, effacer le legacy
    student.hashed_password = get_password_hash(req.new_password)
    student.student_password = None
    db.commit()
    return {"status": "success"}


# --- Droit à l'effacement RGPD ---

@router.delete("/auth/my-account")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer son propre compte et toutes ses données (RGPD art. 17)"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Seuls les élèves peuvent supprimer leur compte ici")

    student_id = current_user.id

    # Supprimer les fichiers uploadés
    db.query(UploadedFile).filter(UploadedFile.uploaded_by == student_id).delete(synchronize_session=False)

    # Supprimer les soumissions tracking
    db.query(Submission).filter(Submission.student_id == student_id).delete(synchronize_session=False)

    # Supprimer les soumissions legacy
    db.query(StudentSubmission).filter(StudentSubmission.student_id == student_id).delete(synchronize_session=False)

    # Supprimer les évaluations
    student_evals = db.query(Evaluation).filter(Evaluation.student_id == student_id).all()
    eval_ids = [e.id for e in student_evals]
    if eval_ids:
        db.query(EvaluationScore).filter(EvaluationScore.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(EvaluationAttachment).filter(EvaluationAttachment.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(Evaluation).filter(Evaluation.id.in_(eval_ids)).delete(synchronize_session=False)

    # Supprimer le compte
    db.delete(current_user)
    db.commit()

    return {"status": "success", "message": "Votre compte et toutes vos données ont été supprimés"}


# --- Endpoints admin protégés ---

@router.delete("/auth/students/{class_code}")
def purge_class_students(
    class_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer tous les élèves d'une classe (prof/admin uniquement)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    teacher = db.query(User).filter(User.class_code == class_code, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Code classe introuvable")

    students = db.query(User).filter(
        User.role == "student",
        (User.teacher_id == teacher.id) | (User.teacher_id == None)
    ).all()
    student_ids = [s.id for s in students]

    if student_ids:
        # 1. Delete associated Submissions
        db.query(StudentSubmission).filter(StudentSubmission.student_id.in_(student_ids)).delete(synchronize_session=False)

        # 2. Delete Evaluations
        student_evals = db.query(Evaluation).filter(Evaluation.student_id.in_(student_ids)).all()
        eval_ids = [e.id for e in student_evals]

        if eval_ids:
            db.query(EvaluationScore).filter(EvaluationScore.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
            db.query(EvaluationAttachment).filter(EvaluationAttachment.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
            db.query(Evaluation).filter(Evaluation.id.in_(eval_ids)).delete(synchronize_session=False)

        # 3. Finally delete the Users
        db.query(User).filter(
            User.role == "student",
            (User.teacher_id == teacher.id) | (User.teacher_id == None)
        ).delete(synchronize_session=False)

        db.commit()

    return {"status": "success", "deleted_count": len(student_ids)}

@router.delete("/auth/nuclear-cleanup")
def nuclear_cleanup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Supprimer TOUS les étudiants (admin uniquement)"""
    students = db.query(User).filter(User.role == "student").all()
    student_ids = [s.id for s in students]

    if not student_ids:
        return {"status": "empty", "message": "Aucun étudiant trouvé"}

    db.query(StudentSubmission).filter(StudentSubmission.student_id.in_(student_ids)).delete(synchronize_session=False)

    student_evals = db.query(Evaluation).filter(Evaluation.student_id.in_(student_ids)).all()
    if student_evals:
        eval_ids = [e.id for e in student_evals]
        db.query(EvaluationScore).filter(EvaluationScore.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(EvaluationAttachment).filter(EvaluationAttachment.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(Evaluation).filter(Evaluation.id.in_(eval_ids)).delete(synchronize_session=False)

    db.query(User).filter(User.role == "student").delete(synchronize_session=False)
    db.commit()

    return {"status": "success", "deleted_count": len(student_ids), "message": "TOUS les étudiants ont été supprimés"}
