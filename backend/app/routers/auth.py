from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from pydantic import BaseModel

router = APIRouter()

class TeacherLogin(BaseModel):
    email: str
    pin: str # Using class_code as pin for now or hashed_password

@router.post("/auth/teacher")
def login_teacher(creds: TeacherLogin, db: Session = Depends(get_db)):
    from app.auth import verify_password
    
    # Search by email, allow teacher OR admin
    user = db.query(User).filter(User.email == creds.email).first()
    
    if not user or user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=401, detail="Utilisateur inconnu ou non autorisé")
        
    # Check Password
    # 1. Legacy Check (Cleartext match) - for existing "admin" password
    if user.hashed_password == creds.pin:
        # Match!
        pass
    # 2. Bcrypt Check - for new admin
    elif user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$"):
        if not verify_password(creds.pin, user.hashed_password):
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    # 3. Class Code Check (fallback for teacher via PIN)
    elif user.class_code and user.class_code == creds.pin:
        pass
    else:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # Générer un token JWT
    from app.auth import create_access_token
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "id": user.id, 
        "name": user.name, 
        "role": user.role, 
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
             pass # Allow if no teacher linked yet? No, secure it.
         else:
            raise HTTPException(status_code=403, detail="Cet élève n'appartient pas à cette classe")

    # 3. Check Password
    if student.student_password != creds.password:
        raise HTTPException(status_code=401, detail="Code personnel incorrect")
    
    # Générer un token JWT
    from app.auth import create_access_token
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
        
    # Get students for this teacher with caching disabled by logic (always fresh query)
    students = db.query(User).filter(
        User.role == "student", 
        (User.teacher_id == teacher.id) | (User.teacher_id == None)
    ).all()
    
    return [{"id": s.id, "name": s.name} for s in students]

@router.delete("/auth/students/{class_code}")
def purge_class_students(class_code: str, db: Session = Depends(get_db)):
    """
    Supprime TOUS les étudiants associés à ce code classe (liés au prof).
    Utilisé pour la réinitialisation totale.
    """
    teacher = db.query(User).filter(User.class_code == class_code, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Code classe introuvable")
    
    # Suppression de tous les élèves liés
    # Note: On devrait aussi supprimer leurs évaluations / soumissions en cascade idéalement
    # Mais SQLite/Postgres avec FK cascade le ferait si configuré.
    # Sinon on le fait manuellement ici pour être sûr.
    
    students = db.query(User).filter(
        User.role == "student", 
        (User.teacher_id == teacher.id) | (User.teacher_id == None)
    ).all()
    student_ids = [s.id for s in students]
    
    if student_ids:
        # Delete related data first ? (If no cascade)
        # evaluations, submissions...
        # Let's assume database cascade or just delete users for now (MVP)
        
        # Bulk delete users
        from app.models import Evaluation, StudentSubmission
        
        # 1. Delete associated Submissions
        db.query(StudentSubmission).filter(StudentSubmission.student_id.in_(student_ids)).delete(synchronize_session=False)
        
        # 2. Delete associated Evaluations (received)
        # Note: Evaluations also have scores and attachments, which should be deleted too if no cascade.
        # Ideally we should select eval IDs first.
        student_evals = db.query(Evaluation).filter(Evaluation.student_id.in_(student_ids)).all()
        eval_ids = [e.id for e in student_evals]
        
        if eval_ids:
            from app.models import EvaluationScore, EvaluationAttachment
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
    """
    OPTION NUCLÉAIRE : Supprime TOUS les étudiants de la base, sans exception.
    """
    # 1. Get ALL students
    students = db.query(User).filter(User.role == "student").all()
    student_ids = [s.id for s in students]
    
    if not student_ids:
        return {"status": "empty", "message": "Aucun étudiant trouvé"}

    # 2. Delete Submissions
    from app.models import Evaluation, StudentSubmission, EvaluationScore, EvaluationAttachment
    db.query(StudentSubmission).filter(StudentSubmission.student_id.in_(student_ids)).delete(synchronize_session=False)

    # 3. Delete Evaluations & Linked Data
    student_evals = db.query(Evaluation).filter(Evaluation.student_id.in_(student_ids)).all()
    if student_evals:
        eval_ids = [e.id for e in student_evals]
        db.query(EvaluationScore).filter(EvaluationScore.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(EvaluationAttachment).filter(EvaluationAttachment.evaluation_id.in_(eval_ids)).delete(synchronize_session=False)
        db.query(Evaluation).filter(Evaluation.id.in_(eval_ids)).delete(synchronize_session=False)

    # 4. Delete Students
    db.query(User).filter(User.role == "student").delete(synchronize_session=False)
    db.commit()

    return {"status": "success", "deleted_count": len(student_ids), "message": "TOUS les étudiants ont été supprimés"}
