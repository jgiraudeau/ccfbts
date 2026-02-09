from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentSubmission, User
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

class SubmissionCreate(BaseModel):
    student_id: int
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    submission_type: str = "AUTRE" # E4_SITUATION, E6_CR, AUTRE
    date: str # YYYY-MM-DD

class SubmissionRead(BaseModel):
    id: int
    student_id: int
    title: str
    content: Optional[str]
    file_url: Optional[str]
    submission_type: str
    date: date

    class Config:
        orm_mode = True

@router.post("/submissions", response_model=SubmissionRead)
def create_submission(submission: SubmissionCreate, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(User).filter(User.id == submission.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    new_submission = StudentSubmission(
        student_id=submission.student_id,
        title=submission.title,
        content=submission.content,
        file_url=submission.file_url,
        submission_type=submission.submission_type,
        date=date.fromisoformat(submission.date)
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    return new_submission

@router.get("/submissions/{student_id}", response_model=List[SubmissionRead])
def get_student_submissions(student_id: int, type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(StudentSubmission).filter(StudentSubmission.student_id == student_id)
    if type:
        query = query.filter(StudentSubmission.submission_type == type)
    return query.all()

@router.delete("/submissions/{submission_id}")
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    db.delete(sub)
    db.commit()
    return {"status": "deleted"}
