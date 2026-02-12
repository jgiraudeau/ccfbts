from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models import User
from ..models_tracking import Deadline, Submission
from ..models_classes import Class, ClassStudent
from ..schemas_tracking import DeadlineCreate, DeadlineUpdate, DeadlineResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/deadlines", tags=["deadlines"])

@router.post("", response_model=DeadlineResponse, status_code=status.HTTP_201_CREATED)
def create_deadline(
    deadline_data: DeadlineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle échéance (professeur uniquement)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent créer des échéances")
    
    new_deadline = Deadline(
        title=deadline_data.title,
        description=deadline_data.description,
        document_type=deadline_data.document_type,
        due_date=deadline_data.due_date,
        exam_type=deadline_data.exam_type,
        is_mandatory=deadline_data.is_mandatory,
        teacher_id=current_user.id
    )
    
    db.add(new_deadline)
    db.commit()
    db.refresh(new_deadline)
    
    # Compter les soumissions
    submissions_count = db.query(Submission).filter(Submission.deadline_id == new_deadline.id).count()
    
    response = DeadlineResponse.from_orm(new_deadline)
    response.submissions_count = submissions_count
    return response


@router.get("", response_model=List[DeadlineResponse])
def list_deadlines(
    exam_type: Optional[str] = None,
    upcoming_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister les échéances"""
    query = db.query(Deadline)
    
    # Pour les professeurs, filtrer par leur propre ID
    if current_user.role == "teacher":
        query = query.filter(Deadline.teacher_id == current_user.id)
    
    # Filtrer par type d'examen
    if exam_type:
        query = query.filter(or_(Deadline.exam_type == exam_type, Deadline.exam_type == "ALL"))
    
    # Filtrer les échéances à venir
    if upcoming_only:
        query = query.filter(Deadline.due_date >= date.today())
    
    # Pour les élèves
    if current_user.role == "student":
        if current_user.teacher_id:
             query = query.filter(Deadline.teacher_id == current_user.teacher_id)
        else:
            # Si pas de teacher_id : voir les deadlines "orphelines" ou voir TOUT en attendant
            # Pour faciliter la synchro, on montre TOUTES les échéances actives
            pass
    
    deadlines = query.order_by(Deadline.due_date.asc()).all()
    
    result = []
    for deadline in deadlines:
        submissions_count = db.query(Submission).filter(Submission.deadline_id == deadline.id).count()
        deadline_response = DeadlineResponse.from_orm(deadline)
        deadline_response.submissions_count = submissions_count
        result.append(deadline_response)
    
    return result


@router.get("/{deadline_id}", response_model=DeadlineResponse)
def get_deadline(
    deadline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une échéance par ID"""
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    
    if not deadline:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")
    
    submissions_count = db.query(Submission).filter(Submission.deadline_id == deadline.id).count()
    deadline_response = DeadlineResponse.from_orm(deadline)
    deadline_response.submissions_count = submissions_count
    
    return deadline_response


@router.put("/{deadline_id}", response_model=DeadlineResponse)
def update_deadline(
    deadline_id: int,
    deadline_data: DeadlineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier une échéance (professeur uniquement)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent modifier des échéances")
    
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    
    if not deadline:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")
    
    # Mettre à jour les champs
    if deadline_data.title is not None:
        deadline.title = deadline_data.title
    if deadline_data.description is not None:
        deadline.description = deadline_data.description
    if deadline_data.document_type is not None:
        deadline.document_type = deadline_data.document_type
    if deadline_data.due_date is not None:
        deadline.due_date = deadline_data.due_date
    if deadline_data.exam_type is not None:
        deadline.exam_type = deadline_data.exam_type
    if deadline_data.is_mandatory is not None:
        deadline.is_mandatory = deadline_data.is_mandatory
    
    db.commit()
    db.refresh(deadline)
    
    submissions_count = db.query(Submission).filter(Submission.deadline_id == deadline.id).count()
    deadline_response = DeadlineResponse.from_orm(deadline)
    deadline_response.submissions_count = submissions_count
    
    return deadline_response


@router.delete("/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deadline(
    deadline_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une échéance (professeur uniquement)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent supprimer des échéances")
    
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    
    if not deadline:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")
    
    db.delete(deadline)
    db.commit()
    
    return None


@router.get("/calendar/{year}/{month}", response_model=List[DeadlineResponse])
def get_calendar_deadlines(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer les échéances d'un mois donné (vue calendrier)"""
    from datetime import datetime
    from calendar import monthrange
    
    # Premier et dernier jour du mois
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])
    
    query = db.query(Deadline).filter(
        and_(
            Deadline.due_date >= first_day,
            Deadline.due_date <= last_day
        )
    )

    # Filtrage par professeur
    if current_user.role == "teacher":
        query = query.filter(Deadline.teacher_id == current_user.id)
    elif current_user.role == "student" and current_user.teacher_id:
        query = query.filter(Deadline.teacher_id == current_user.teacher_id)
        
    deadlines = query.order_by(Deadline.due_date.asc()).all()
    
    result = []
    for deadline in deadlines:
        submissions_count = db.query(Submission).filter(Submission.deadline_id == deadline.id).count()
        deadline_response = DeadlineResponse.from_orm(deadline)
        deadline_response.submissions_count = submissions_count
        result.append(deadline_response)
    
    return result
