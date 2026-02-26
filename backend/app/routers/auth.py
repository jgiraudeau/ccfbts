from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Evaluation, StudentSubmission, EvaluationScore, EvaluationAttachment
from app.auth import verify_password, create_access_token
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
    class_code: str
    student_id: int
    password: str

@router.post("/auth/student")
def login_student(creds: StudentLoginRequest, db: Session = Depends(get_db)):
    # 1. Check Class Code (Teacher)
    teacher = db.query(User).filter(User.class_code == creds.class_code, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Code classe invalide")
    
    # 2. Check Student belongs to this teacher
    student = db.query(User).filter(User.id == creds.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Élève introuvable")
        
    if student.teacher_id != teacher.id:
         # Fallback for MVP if teacher_id not set on legacy data
         if student.teacher_id is None:
             pass 
         else:
            raise HTTPException(status_code=403, detail="Cet élève n'appartient pas à cette classe")

    # 3. Check Password
    if student.student_password != creds.password:
        raise HTTPException(status_code=401, detail="Code personnel incorrect")
    
    # Générer un token JWT
    access_token = create_access_token(data={"sub": student.email, "role": "student"})
        
    return {
        "id": student.id, 
        "name": student.name, 
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
        
    if student.student_password != req.old_password:
        raise HTTPException(status_code=401, detail="Ancien code incorrect")
        
    student.student_password = req.new_password
    db.commit()
    return {"status": "success"}

@router.get("/auth/students/{class_code}")
def get_students_by_class_code(class_code: str, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.class_code == class_code, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Code classe introuvable")
        
    # Get students for this teacher only
    students = db.query(User).filter(
        User.role == "student",
        User.teacher_id == teacher.id
    ).all()
    
    return [{"id": s.id, "name": s.name, "class_name": s.class_name} for s in students]

@router.delete("/auth/students/{class_code}")
def purge_class_students(class_code: str, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.class_code == class_code, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Code classe introuvable")
    
    students = db.query(User).filter(
        User.role == "student", 
        (User.teacher_id == teacher.id) | (User.teacher_id == None)
    ).all()
    student_ids = [s.id for s in students]
    
    if student_ids:
        from app.models import StudentSubmission
        
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
def nuclear_cleanup(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == "student").all()
    student_ids = [s.id for s in students]
    
    if not student_ids:
        return {"status": "empty", "message": "Aucun étudiant trouvé"}

    from app.models import StudentSubmission
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
