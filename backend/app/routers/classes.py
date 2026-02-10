from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User
from ..models_classes import Class, ClassStudent
from ..schemas_tracking import ClassCreate, ClassUpdate, ClassResponse, AddStudentsToClass
from ..auth import get_current_user

router = APIRouter(prefix="/api/classes", tags=["classes"])

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle classe (professeur uniquement)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent créer des classes")
    
    new_class = Class(
        name=class_data.name,
        description=class_data.description,
        academic_year=class_data.academic_year,
        teacher_id=current_user.id
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    # Compter les élèves
    student_count = db.query(ClassStudent).filter(ClassStudent.class_id == new_class.id).count()
    
    response = ClassResponse.from_orm(new_class)
    response.student_count = student_count
    return response


@router.get("/", response_model=List[ClassResponse])
def list_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister toutes mes classes (professeur)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent voir leurs classes")
    
    classes = db.query(Class).filter(Class.teacher_id == current_user.id).all()
    
    result = []
    for cls in classes:
        student_count = db.query(ClassStudent).filter(ClassStudent.class_id == cls.id).count()
        class_response = ClassResponse.from_orm(cls)
        class_response.student_count = student_count
        result.append(class_response)
    
    return result


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer une classe par ID"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    # Vérifier que c'est bien la classe du prof
    if cls.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    student_count = db.query(ClassStudent).filter(ClassStudent.class_id == cls.id).count()
    class_response = ClassResponse.from_orm(cls)
    class_response.student_count = student_count
    
    return class_response


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres classes")
    
    # Mettre à jour les champs
    if class_data.name is not None:
        cls.name = class_data.name
    if class_data.description is not None:
        cls.description = class_data.description
    if class_data.academic_year is not None:
        cls.academic_year = class_data.academic_year
    
    db.commit()
    db.refresh(cls)
    
    student_count = db.query(ClassStudent).filter(ClassStudent.class_id == cls.id).count()
    class_response = ClassResponse.from_orm(cls)
    class_response.student_count = student_count
    
    return class_response


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres classes")
    
    db.delete(cls)
    db.commit()
    
    return None


@router.post("/{class_id}/students", status_code=status.HTTP_201_CREATED)
def add_students_to_class(
    class_id: int,
    data: AddStudentsToClass,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajouter des élèves à une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres classes")
    
    added_count = 0
    for student_id in data.student_ids:
        # Vérifier que l'élève existe et appartient au prof
        student = db.query(User).filter(
            User.id == student_id,
            User.role == "student",
            User.teacher_id == current_user.id
        ).first()
        
        if not student:
            continue
        
        # Vérifier si déjà dans la classe
        existing = db.query(ClassStudent).filter(
            ClassStudent.class_id == class_id,
            ClassStudent.student_id == student_id
        ).first()
        
        if not existing:
            class_student = ClassStudent(class_id=class_id, student_id=student_id)
            db.add(class_student)
            added_count += 1
    
    db.commit()
    
    return {"message": f"{added_count} élève(s) ajouté(s) à la classe", "added_count": added_count}


@router.delete("/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_from_class(
    class_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retirer un élève d'une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres classes")
    
    class_student = db.query(ClassStudent).filter(
        ClassStudent.class_id == class_id,
        ClassStudent.student_id == student_id
    ).first()
    
    if not class_student:
        raise HTTPException(status_code=404, detail="Élève non trouvé dans cette classe")
    
    db.delete(class_student)
    db.commit()
    
    return None


@router.get("/{class_id}/students", response_model=List[dict])
def list_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister les élèves d'une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if cls.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer les élèves via la table d'association
    students = db.query(User).join(ClassStudent, User.id == ClassStudent.student_id).filter(
        ClassStudent.class_id == class_id
    ).all()
    
    return [{"id": s.id, "name": s.name, "email": s.email} for s in students]
