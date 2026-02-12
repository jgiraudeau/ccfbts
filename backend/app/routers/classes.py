from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User
from ..models_classes import Class, ClassStudent
from ..schemas_tracking import ClassCreate, ClassUpdate, ClassResponse, AddStudentsToClass
from ..auth import get_current_user

router = APIRouter(prefix="/api/classes", tags=["classes"])

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer une nouvelle classe (professeur ou admin)"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # L'enseignant est l'utilisateur connecté (ou l'admin)
    teacher_id = current_user.id
    
    # Récupérer le premier professeur trouvé pour l'assignation par défaut
    # first_teacher = db.query(User).filter(User.role == "teacher").first()
    
    # if not first_teacher:
    #      # Fallback : vérifier si l'utilisateur avec ID 1 existe, sinon erreur 400
    #     fallback_admin = db.query(User).filter(User.id == 1).first()
    #     if fallback_admin:
    #         teacher_id = 1
    #     else:
    #          # Si aucun prof et pas d'admin ID 1, on ne peut pas créer de classe avec FK
    #         raise HTTPException(
    #             status_code=400, 
    #             detail="Aucun professeur trouvé pour assigner la classe. Veuillez créer un compte professeur d'abord."
    #         )
    # else:
    #     teacher_id = first_teacher.id

    new_class = Class(
        name=class_data.name,
        description=class_data.description,
        academic_year=class_data.academic_year,
        teacher_id=teacher_id
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    # Compter les élèves
    student_count = db.query(ClassStudent).filter(ClassStudent.class_id == new_class.id).count()
    
    response = ClassResponse.from_orm(new_class)
    response.student_count = student_count
    return response


@router.get("", response_model=List[ClassResponse])
def list_my_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister toutes mes classes (professeur) ou toutes (admin)"""
    if current_user.role == "admin":
        classes = db.query(Class).all()
    elif current_user.role == "teacher":
        classes = db.query(Class).filter(Class.teacher_id == current_user.id).all()
    else:
        # Les étudiants ne listent pas les classes comme ça pour l'instant
        raise HTTPException(status_code=403, detail="Non autorisé")
    
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
    
    # Vérifier que c'est bien la classe du prof ou que c'est un admin
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
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
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(get_current_user)
):
    """Modifier une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
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
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(get_current_user)
):
    """Supprimer une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres classes")
    
    db.delete(cls)
    db.commit()
    
    return None


@router.post("/{class_id}/students", status_code=status.HTTP_201_CREATED)
def add_students_to_class(
    class_id: int,
    data: AddStudentsToClass,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(get_current_user)
):
    """Ajouter des élèves à une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres classes")
    
    added_count = 0
    for student_id in data.student_ids:
        # Vérifier que l'élève existe et appartient au prof
        student = db.query(User).filter(
            User.id == student_id,
            User.role == "student",
            # User.teacher_id == current_user.id
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
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(get_current_user)
):
    """Retirer un élève d'une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
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
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(get_current_user)
):
    """Lister les élèves d'une classe"""
    cls = db.query(Class).filter(Class.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    
    if current_user.role != "admin" and cls.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Récupérer les élèves via la table d'association
    students = db.query(User).join(ClassStudent, User.id == ClassStudent.student_id).filter(
        ClassStudent.class_id == class_id
    ).all()
    
    return [{"id": s.id, "name": s.name, "email": s.email} for s in students]


@router.post("/sync")
def sync_classes_from_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Synchronise les classes à partir des noms de classe renseignés sur les étudiants.
    Utile après un import massif d'élèves.
    """
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Non autorisé")

    # 1. Trouver tous les noms de classe uniques parmi les élèves du prof (ou orphelins)
    student_classes = db.query(User.class_name).filter(
        User.role == "student",
        (User.teacher_id == current_user.id) | (User.teacher_id == None),
        User.class_name != None,
        User.class_name != ""
    ).distinct().all()

    class_names = [r[0] for r in student_classes]
    
    classes_created = 0
    students_linked = 0

    for name in class_names:
        # 2. Vérifier si la classe existe déjà pour ce prof
        cls = db.query(Class).filter(
            Class.name == name,
            Class.teacher_id == current_user.id
        ).first()

        if not cls:
            cls = Class(
                name=name,
                teacher_id=current_user.id,
                academic_year="2024-2025", # Valeur par défaut
                description=f"Classe synchronisée depuis l'import des élèves"
            )
            db.add(cls)
            db.commit()
            db.refresh(cls)
            classes_created += 1

        # 3. Lier les élèves qui ont ce class_name mais ne sont pas encore dans ClassStudent
        students_with_name = db.query(User).filter(
            User.role == "student",
            (User.teacher_id == current_user.id) | (User.teacher_id == None),
            User.class_name == name
        ).all()

        for student in students_with_name:
            # Assigner le prof si non assigné
            if student.teacher_id is None:
                student.teacher_id = current_user.id
                db.add(student)
            # Vérifier si déjà lié
            link = db.query(ClassStudent).filter(
                ClassStudent.class_id == cls.id,
                ClassStudent.student_id == student.id
            ).first()

            if not link:
                new_link = ClassStudent(class_id=cls.id, student_id=student.id)
                db.add(new_link)
                students_linked += 1
    
    db.commit()

    return {
        "status": "success",
        "classes_created": classes_created,
        "students_linked": students_linked,
        "message": f"{classes_created} classes créées et {students_linked} élèves liés."
    }
