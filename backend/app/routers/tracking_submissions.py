from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import User
from ..models_tracking import Deadline, Submission
from ..schemas_tracking import SubmissionCreate, SubmissionReview, SubmissionResponse
from ..auth import get_current_user
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/tracking/submissions", tags=["tracking_submissions"])

# Configuration pour l'upload de fichiers
UPLOAD_DIR = Path("uploads/submissions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(
    submission_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soumettre un document (élève uniquement)"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Seuls les élèves peuvent soumettre des documents")
    
    student_id = current_user.id
    
    # Vérifier que l'échéance existe
    deadline = db.query(Deadline).filter(Deadline.id == submission_data.deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")
    
    # Vérifier si l'élève a déjà soumis pour cette échéance
    existing = db.query(Submission).filter(
        and_(
            Submission.student_id == student_id,
            Submission.deadline_id == submission_data.deadline_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà soumis un document pour cette échéance")
    
    new_submission = Submission(
        student_id=student_id,
        deadline_id=submission_data.deadline_id,
        file_url=submission_data.file_url,
        file_name=submission_data.file_name,
        status='pending'
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    deadline = db.query(Deadline).filter(Deadline.id == submission_data.deadline_id).first()
    
    response = SubmissionResponse.from_orm(new_submission)
    response.student_name = current_user.name
    response.deadline_title = deadline.title if deadline else None
    return response


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload un fichier et retourner l'URL"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Seuls les élèves peuvent uploader des fichiers")
    
    # Générer un nom de fichier unique
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{current_user.id}_{timestamp}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Sauvegarder le fichier
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Retourner l'URL relative
    file_url = f"/uploads/submissions/{unique_filename}"
    
    return {
        "file_url": file_url,
        "file_name": file.filename,
        "message": "Fichier uploadé avec succès"
    }


@router.get("", response_model=List[SubmissionResponse])
def list_submissions(
    deadline_id: Optional[int] = None,
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister les soumissions"""
    query = db.query(Submission)
    
    # Pour les élèves, ne voir que leurs propres soumissions
    if current_user.role == "student":
        query = query.filter(Submission.student_id == current_user.id)
    
    # Pour les profs, ne voir que les soumissions de leurs élèves
    elif current_user.role == "teacher":
        # Récupérer les IDs des élèves du prof
        student_ids = db.query(User.id).filter(User.teacher_id == current_user.id).all()
        student_ids = [s[0] for s in student_ids]
        query = query.filter(Submission.student_id.in_(student_ids))
    
    # Filtres optionnels
    if deadline_id:
        query = query.filter(Submission.deadline_id == deadline_id)
    
    if student_id and current_user.role in ["teacher", "admin"]:
        query = query.filter(Submission.student_id == student_id)
    
    if status_filter:
        query = query.filter(Submission.status == status_filter)
    
    submissions = query.order_by(Submission.submitted_at.desc()).all()
    
    # Enrichir avec les noms
    result = []
    for submission in submissions:
        student = db.query(User).filter(User.id == submission.student_id).first()
        deadline = db.query(Deadline).filter(Deadline.id == submission.deadline_id).first()
        
        submission_response = SubmissionResponse.from_orm(submission)
        submission_response.student_name = student.name if student else None
        submission_response.deadline_title = deadline.title if deadline else None
        result.append(submission_response)
    
    return result


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une soumission par ID"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Soumission non trouvée")
    
    # Vérifier les permissions
    if current_user.role == "student" and submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if current_user.role == "teacher":
        student = db.query(User).filter(User.id == submission.student_id).first()
        if student and student.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    student = db.query(User).filter(User.id == submission.student_id).first()
    deadline = db.query(Deadline).filter(Deadline.id == submission.deadline_id).first()
    
    submission_response = SubmissionResponse.from_orm(submission)
    submission_response.student_name = student.name if student else None
    submission_response.deadline_title = deadline.title if deadline else None
    
    return submission_response


@router.put("/{submission_id}/review", response_model=SubmissionResponse)
def review_submission(
    submission_id: int,
    review_data: SubmissionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Noter et commenter une soumission (professeur uniquement)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent noter les soumissions")
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Soumission non trouvée")
    
    # Vérifier que l'élève appartient au prof (sauf admin)
    if current_user.role == "teacher":
        student = db.query(User).filter(User.id == submission.student_id).first()
        if student and student.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez noter que vos propres élèves")
    
    # Mettre à jour la soumission
    submission.status = review_data.status
    submission.grade = review_data.grade
    submission.feedback = review_data.feedback
    submission.reviewed_at = datetime.now()
    submission.reviewed_by = current_user.id
    
    db.commit()
    db.refresh(submission)
    
    deadline = db.query(Deadline).filter(Deadline.id == submission.deadline_id).first()
    
    submission_response = SubmissionResponse.from_orm(submission)
    submission_response.student_name = student.name
    submission_response.deadline_title = deadline.title if deadline else None
    
    return submission_response


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une soumission"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Soumission non trouvée")
    
    # Seul l'élève peut supprimer sa propre soumission (avant notation)
    if current_user.role == "student":
        if submission.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        if submission.status != 'pending':
            raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer une soumission déjà notée")
    
    # Le prof peut toujours supprimer (ainsi que les admins)
    elif current_user.role == "teacher":
        student = db.query(User).filter(User.id == submission.student_id).first()
        if student and student.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Supprimer le fichier si existe
    if submission.file_url:
        file_path = Path(".") / submission.file_url.lstrip("/")
        if file_path.exists():
            file_path.unlink()
    
    db.delete(submission)
    db.commit()
    
    return None
