from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentSubmission, User
from pydantic import BaseModel
from datetime import date

router = APIRouter()

class SubmissionCreate(BaseModel):
    student_id: int
    title: str
    content: str
    submission_type: str
    date: str

@router.post("/submissions")
def create_submission(submission: SubmissionCreate, db: Session = Depends(get_db)):
    """Créer une nouvelle soumission (fiche E4/E6)"""
    # Vérifier que l'étudiant existe
    student = db.query(User).filter(User.id == submission.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    
    new_submission = StudentSubmission(
        student_id=submission.student_id,
        title=submission.title,
        content=submission.content,
        submission_type=submission.submission_type,
        date=submission.date
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return {
        "id": new_submission.id,
        "student_id": new_submission.student_id,
        "title": new_submission.title,
        "content": new_submission.content,
        "submission_type": new_submission.submission_type,
        "date": str(new_submission.date)
    }

@router.get("/submissions/{student_id}")
def get_student_submissions(student_id: int, db: Session = Depends(get_db)):
    """Récupérer toutes les soumissions d'un étudiant"""
    submissions = db.query(StudentSubmission).filter(
        StudentSubmission.student_id == student_id
    ).all()
    
    return [{
        "id": s.id,
        "student_id": s.student_id,
        "title": s.title,
        "content": s.content,
        "submission_type": s.submission_type,
        "date": str(s.date)
    } for s in submissions]

@router.get("/submissions")
def get_all_submissions(db: Session = Depends(get_db)):
    """Récupérer toutes les soumissions (pour le prof)"""
    submissions = db.query(StudentSubmission).all()
    
    return [{
        "id": s.id,
        "student_id": s.student_id,
        "title": s.title,
        "content": s.content,
        "submission_type": s.submission_type,
        "date": str(s.date)
    } for s in submissions]

@router.delete("/submissions/{submission_id}")
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    """Supprimer une soumission"""
    submission = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Soumission introuvable")
    
    db.delete(submission)
    db.commit()
    
    return {"status": "success", "message": "Soumission supprimée"}
