from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import unicodedata
import re
from ..database import get_db
from ..models import User
from ..models_classes import Class, ClassStudent
from ..schemas_tracking import StudentResponse, StudentCreate, StudentUpdate
from ..auth import get_current_user, get_password_hash


def generate_username(name: str, db: Session) -> str:
    """Génère un username prenom-nom à partir du nom complet."""
    # Supprimer les accents
    normalized = unicodedata.normalize('NFD', name)
    ascii_name = normalized.encode('ascii', 'ignore').decode('ascii')
    # Séparer les parties du nom (NOM Prénom → prénom-nom)
    parts = ascii_name.strip().split()
    if len(parts) >= 2:
        # Convention: MOREAU Camille → camille-moreau
        surname = parts[0].lower()
        firstname = "-".join(p.lower() for p in parts[1:])
        base = f"{firstname}-{surname}"
    else:
        base = parts[0].lower() if parts else "eleve"
    # Nettoyer les caractères spéciaux
    base = re.sub(r'[^a-z0-9-]', '', base)
    base = re.sub(r'-+', '-', base).strip('-')
    # Vérifier unicité
    username = base
    counter = 2
    while db.query(User).filter(User.username == username).first():
        username = f"{base}-{counter}"
        counter += 1
    return username

router = APIRouter(prefix="/api/students", tags=["students"])

@router.get("", response_model=List[StudentResponse])
def list_my_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lister les élèves du professeur connecté"""
    if current_user.role == "teacher":
        students = db.query(User).filter(
            User.role == "student",
            User.teacher_id == current_user.id
        ).all()
    elif current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Admin: utilisez /api/admin/teachers")
    else:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    return [StudentResponse.from_orm(s) for s in students]


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Créer un nouvel élève (professeur uniquement)"""
    if current_user.role != "teacher" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seuls les professeurs peuvent créer des élèves")

    # ID du prof qui crée l'élève
    teacher_id = current_user.id if current_user.role == "teacher" else student_data.teacher_id

    # Générer username
    username = generate_username(student_data.name, db)

    # Email auto-généré si non fourni
    email = student_data.email or f"{username}@profvirtuel.local"

    # Vérifier si l'email existe déjà
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    # Hasher le mot de passe (RGPD : ne plus stocker en clair)
    raw_password = student_data.student_password or "0000"
    new_student = User(
        name=student_data.name,
        username=username,
        email=email,
        hashed_password=get_password_hash(raw_password),
        student_password=None,  # Ne plus stocker en clair
        role="student",
        teacher_id=teacher_id,
        is_active=True
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # Auto-assigner à la classe si class_name fourni
    if student_data.class_name:
        existing_class = db.query(Class).filter(
            Class.name == student_data.class_name,
            Class.teacher_id == teacher_id
        ).first()
        if not existing_class:
            # Créer la classe automatiquement
            import random
            while True:
                code = str(random.randint(100000, 999999))
                if not db.query(Class).filter(Class.class_code == code).first():
                    break
            existing_class = Class(name=student_data.class_name, teacher_id=teacher_id, class_code=code)
            db.add(existing_class)
            db.commit()
            db.refresh(existing_class)
        # Vérifier si pas déjà associé
        already = db.query(ClassStudent).filter(
            ClassStudent.class_id == existing_class.id,
            ClassStudent.student_id == new_student.id
        ).first()
        if not already:
            db.add(ClassStudent(class_id=existing_class.id, student_id=new_student.id))
            db.commit()

    return StudentResponse.from_orm(new_student)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer un élève par ID"""
    student = db.query(User).filter(
        User.id == student_id,
        User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Élève non trouvé")

    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    return StudentResponse.from_orm(student)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mettre à jour les informations d'un élève"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    student = db.query(User).filter(
        User.id == student_id,
        User.role == "student",
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Élève non trouvé")

    # Un prof ne peut modifier que ses propres élèves
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cet élève ne vous appartient pas")

    # Mettre à jour les champs
    if student_data.name is not None:
        student.name = student_data.name
    if student_data.email is not None:
        student.email = student_data.email
    if student_data.stage_start_date is not None:
        student.stage_start_date = student_data.stage_start_date
    if student_data.stage_end_date is not None:
        student.stage_end_date = student_data.stage_end_date
    if student_data.stage_company is not None:
        student.stage_company = student_data.stage_company
    if student_data.stage_tutor is not None:
        student.stage_tutor = student_data.stage_tutor

    db.commit()
    db.refresh(student)

    return StudentResponse.from_orm(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un élève"""
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    student = db.query(User).filter(
        User.id == student_id,
        User.role == "student",
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Élève non trouvé")

    # Un prof ne peut supprimer que ses propres élèves
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cet élève ne vous appartient pas")

    db.delete(student)
    db.commit()

    return None
