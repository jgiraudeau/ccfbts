from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models import User
from ..models_classes import Class, ClassStudent
from ..schemas_tracking import TeacherCreate, TeacherResponse, ActivateTeacher, DashboardStats
from ..auth import get_current_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])

def require_admin(current_user: User = Depends(get_current_user)):
    """Vérifier que l'utilisateur est admin"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user

@router.get("/teachers", response_model=List[TeacherResponse])
def list_all_teachers(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Lister tous les professeurs (admin uniquement)"""
    teachers = db.query(User).filter(User.role == "teacher").all()
    
    result = []
    for teacher in teachers:
        # Compter les classes
        class_count = db.query(Class).filter(Class.teacher_id == teacher.id).count()
        
        # Compter les élèves
        student_count = db.query(User).filter(
            User.role == "student",
            User.teacher_id == teacher.id
        ).count()
        
        teacher_response = TeacherResponse.from_orm(teacher)
        teacher_response.class_count = class_count
        teacher_response.student_count = student_count
        result.append(teacher_response)
    
    return result


@router.post("/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    teacher_data: TeacherCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Créer un compte professeur manuellement (admin uniquement)"""
    # Vérifier si l'email existe déjà
    existing = db.query(User).filter(User.email == teacher_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    new_teacher = User(
        name=teacher_data.name,
        email=teacher_data.email,
        hashed_password=get_password_hash(teacher_data.password),
        role="teacher",
        is_active=True
    )
    
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    teacher_response = TeacherResponse.from_orm(new_teacher)
    teacher_response.class_count = 0
    teacher_response.student_count = 0
    
    return teacher_response


@router.put("/teachers/{teacher_id}/activate", response_model=TeacherResponse)
def activate_deactivate_teacher(
    teacher_id: int,
    activation_data: ActivateTeacher,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Activer ou désactiver un compte professeur (admin uniquement)"""
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.role == "teacher"
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    
    teacher.is_active = activation_data.is_active
    
    db.commit()
    db.refresh(teacher)
    
    # Compter les classes et élèves
    class_count = db.query(Class).filter(Class.teacher_id == teacher.id).count()
    student_count = db.query(User).filter(
        User.role == "student",
        User.teacher_id == teacher.id
    ).count()
    
    teacher_response = TeacherResponse.from_orm(teacher)
    teacher_response.class_count = class_count
    teacher_response.student_count = student_count
    
    return teacher_response


@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Supprimer un compte professeur (admin uniquement)"""
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.role == "teacher"
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    
    db.delete(teacher)
    db.commit()
    
    return None


@router.get("/stats", response_model=DashboardStats)
def get_global_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Récupérer les statistiques globales de l'application (admin uniquement)"""
    from ..models_tracking import Deadline, Submission
    
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_classes = db.query(Class).count()
    total_deadlines = db.query(Deadline).count()
    total_submissions = db.query(Submission).count()
    pending_reviews = db.query(Submission).filter(Submission.status == "pending").count()
    
    # Moyenne des notes
    avg_grade = db.query(func.avg(Submission.grade)).filter(Submission.grade.isnot(None)).scalar()
    
    # Soumissions en retard (TODO: nécessite de comparer avec deadline.due_date)
    late_submissions = 0
    
    return DashboardStats(
        total_students=total_students,
        total_deadlines=total_deadlines,
        total_submissions=total_submissions,
        pending_reviews=pending_reviews,
        average_grade=float(avg_grade) if avg_grade else None,
        late_submissions=late_submissions
    )
