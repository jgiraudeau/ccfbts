from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel
import json

from ..database import get_db
from ..models import User
from ..models_tracking import StoredEvaluation
from ..auth import get_current_user

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


class EvaluationSync(BaseModel):
    """Format d'une évaluation envoyée par le frontend"""
    id: str  # frontend_id (Date.now() converti en string)
    studentId: int
    domainId: Optional[str] = None
    date: str
    ratings: Dict[str, str]  # {"1": "S", "2": "TS", ...}
    comment: Optional[str] = None
    type: Optional[str] = None  # 'E4' ou 'E6' pour les finals
    globalComment: Optional[str] = None


class EvaluationResponse(BaseModel):
    id: str
    studentId: int
    domainId: Optional[str] = None
    date: str
    ratings: Dict[str, str]
    comment: Optional[str] = None


@router.post("/sync")
def sync_evaluations(
    evaluations: List[EvaluationSync],
    eval_type: str = "formative",  # "formative" ou "ccf"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Synchroniser les évaluations du prof vers la BDD.
    Appelé quand le prof sauvegarde une évaluation.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent enregistrer des évaluations")

    saved = 0
    updated = 0

    for ev in evaluations:
        frontend_id = str(ev.id)

        # Chercher si cette évaluation existe déjà
        existing = db.query(StoredEvaluation).filter(
            StoredEvaluation.frontend_id == frontend_id,
            StoredEvaluation.teacher_id == current_user.id
        ).first()

        ratings_json = json.dumps(ev.ratings)

        if existing:
            existing.ratings = ratings_json
            existing.comment = ev.comment or ev.globalComment
            existing.eval_date = ev.date
            existing.domain_id = ev.domainId
            existing.exam_type = ev.type
            # On ne change pas l'eval_type d'une évaluation existante ici pour garder la cohérence
            updated += 1
        else:
            new_eval = StoredEvaluation(
                frontend_id=frontend_id,
                student_id=ev.studentId,
                teacher_id=current_user.id,
                domain_id=ev.domainId,
                eval_type=eval_type,
                eval_date=ev.date,
                ratings=ratings_json,
                comment=ev.comment or ev.globalComment,
                exam_type=ev.type
            )
            db.add(new_eval)
            saved += 1

    db.commit()
    return {"status": "synced", "saved": saved, "updated": updated}


@router.delete("/sync")
def delete_evaluation(
    frontend_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une évaluation"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Non autorisé")

    deleted = db.query(StoredEvaluation).filter(
        StoredEvaluation.frontend_id == frontend_id,
        StoredEvaluation.teacher_id == current_user.id
    ).delete()

    db.commit()
    return {"status": "deleted", "count": deleted}


@router.get("/my", response_model=List[EvaluationResponse])
def get_my_evaluations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint élève : récupérer MES évaluations FORMATIVES uniquement.
    Les CCF ne sont PAS visibles par l'élève.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Endpoint réservé aux élèves")

    # On récupère les évaluations formatives (inclut aussi les anciennes 'continuous' pour la compatibilité)
    evals = db.query(StoredEvaluation).filter(
        StoredEvaluation.student_id == current_user.id,
        StoredEvaluation.eval_type.in_(["formative", "continuous"])  # Compatibilité ascendante
    ).order_by(StoredEvaluation.eval_date.desc()).all()

    result = []
    for ev in evals:
        try:
            ratings = json.loads(ev.ratings) if ev.ratings else {}
        except json.JSONDecodeError:
            ratings = {}

        result.append(EvaluationResponse(
            id=ev.frontend_id,
            studentId=ev.student_id,
            domainId=ev.domain_id,
            date=ev.eval_date or "",
            ratings=ratings,
            comment=ev.comment
        ))

    return result
