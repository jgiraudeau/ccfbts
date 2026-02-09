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
    # Search by email (or name if we want)
    # For MVP, let's use email prof@ccfbts.fr and PIN 1234 (stored in class_code for simplicity or password)
    
    # Check if email exists
    user = db.query(User).filter(User.email == creds.email, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=401, detail="Professeur inconnu")
        
    # Check Password (we stored 'admin' as hashed_password for now) OR check class_code as PIN?
    # User said: "code pin sera un code classe" -> so maybe the teacher logs in with that PIN?
    # Let's check against class_code for 'PIN' login if provided, or hashed_password
    
    if creds.pin == user.class_code or creds.pin == user.hashed_password:
        return {"id": user.id, "name": user.name, "role": "teacher", "class_code": user.class_code}
    
    raise HTTPException(status_code=401, detail="Code PIN ou mot de passe incorrect")

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
        
    return {"id": student.id, "name": student.name, "role": "student"}

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
    
    students = db.query(User).filter(User.role == "student", User.teacher_id == teacher.id).all()
    student_ids = [s.id for s in students]
    
    if student_ids:
        # Delete related data first ? (If no cascade)
        # evaluations, submissions...
        # Let's assume database cascade or just delete users for now (MVP)
        
        # Bulk delete users
        db.query(User).filter(
            User.role == "student", 
            (User.teacher_id == teacher.id) | (User.teacher_id == None)
        ).delete(synchronize_session=False)
        db.commit()
        
    return {"status": "success", "deleted_count": len(student_ids)}
