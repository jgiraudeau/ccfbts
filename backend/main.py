from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app import models, init_db
from app.models import User, Evaluation, EvaluationScore, SituationType, EvaluationType
import uvicorn
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import date, datetime

# Init DB models (importer tous les modèles avant create_all)
from app import models_tracking  # noqa - nécessaire pour que les tables tracking soient créées
Base.metadata.create_all(bind=engine)

from app.routers import generate, export, submissions, auth, scenario_export
from app.routers import classes, deadlines, tracking_submissions, admin, students
from app.auth import get_current_user_optional

app = FastAPI(title="ProfVirtuel V2 - E6 & CCF")

app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(submissions.router, prefix="/api", tags=["Submissions"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(scenario_export.router, prefix="/api", tags=["Scenario Export"])

# Tracking system routers
app.include_router(classes.router, tags=["Classes"])
app.include_router(deadlines.router, tags=["Deadlines"])
app.include_router(tracking_submissions.router, tags=["Tracking Submissions"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(students.router, tags=["Students"])

# --- Schemas Pydantic (Entrée/Sortie API) ---

class StudentCreate(BaseModel):
    name: str
    class_name: Optional[str] = None

class StudentRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role: str
    class_name: Optional[str] = None

    class Config:
        orm_mode = True

class EvaluationCreate(BaseModel):
    studentId: int
    date: str
    ratings: Dict[str, str] # "skill_id": "TI/I/S/TS"
    comment: Optional[str] = None
    globalComment: Optional[str] = None
    type: str # 'continuous' or 'final'
    domainId: Optional[str] = None # 'E6_DISTRIBUTION', etc.

# --- Configuration CORS ---
import os
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ccfbts.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Endpoint de téléchargement de fichiers depuis la BDD ---
from fastapi.responses import Response as FastAPIResponse
from app.models_tracking import UploadedFile

@app.get("/api/files/{file_id}")
def download_file(file_id: int, db: Session = Depends(get_db)):
    """Télécharger un fichier stocké en base de données"""
    from urllib.parse import quote

    uploaded = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not uploaded:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # PostgreSQL renvoie memoryview pour LargeBinary, convertir en bytes
    file_data = bytes(uploaded.data) if uploaded.data else b""

    # Encoder le nom de fichier pour les headers HTTP (RFC 5987)
    safe_name = uploaded.original_name.encode('ascii', 'ignore').decode('ascii') or "download"
    utf8_name = quote(uploaded.original_name)

    return FastAPIResponse(
        content=file_data,
        media_type=uploaded.content_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{safe_name}\"; filename*=UTF-8''{utf8_name}"
        }
    )

# --- Startup Event ---
@app.on_event("startup")
def on_startup():
    # Safety Migration: Add class_name column BEFORE anything else
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            # Try Postgres style first
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS class_name TEXT"))
                print("✅ Migration: Column class_name added or already exists (Postgres)")
            except Exception:
                # Fallback for SQLite or standard SQL
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN class_name TEXT"))
                    print("✅ Migration: Column class_name added (Standard)")
                except Exception:
                    # Column likely already exists
                    pass
            
            # Migration for deadlines table
            try:
                conn.execute(text("ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS teacher_id INTEGER"))
                print("✅ Migration: Column teacher_id added or already exists (Postgres)")
            except Exception:
                try:
                    conn.execute(text("ALTER TABLE deadlines ADD COLUMN teacher_id INTEGER"))
                    print("✅ Migration: Column teacher_id added (Standard)")
                except Exception:
                    pass

    except Exception as e:
        print(f"❌ Migration failed: {e}")

            # Migration RGPD: consent_given_at column
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP"))
                print("✅ Migration: Column consent_given_at added or already exists")
            except Exception:
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN consent_given_at TIMESTAMP"))
                except Exception:
                    pass

    except Exception as e:
        print(f"❌ Migration failed: {e}")

    # RGPD: Migration auto des mots de passe en clair vers bcrypt
    # EXCLUT les comptes de test (prof "teusteuria" et ses élèves)
    try:
        from app.auth import get_password_hash
        db = next(get_db())
        students_to_migrate = db.query(User).filter(
            User.role == "student",
            User.student_password != None,
            User.student_password != ""
        ).all()

        migrated = 0
        for student in students_to_migrate:
            # Exclure les comptes de test : chercher si le prof est "teusteuria"
            if student.teacher_id:
                teacher = db.query(User).filter(User.id == student.teacher_id).first()
                if teacher and "teusteuria" in (teacher.name or "").lower():
                    print(f"⏭️  Skip test account: {student.username}")
                    continue
            # Aussi exclure si le nom de l'élève contient "test"
            if student.name and "test" in student.name.lower():
                print(f"⏭️  Skip test account: {student.username}")
                continue

            student.hashed_password = get_password_hash(student.student_password)
            student.student_password = None
            migrated += 1

        if migrated > 0:
            db.commit()
            print(f"🔒 RGPD: {migrated} mot(s) de passe élève(s) migré(s) vers bcrypt")
        db.close()
    except Exception as e:
        print(f"❌ Password migration failed: {e}")

    # Standard init
    try:
        db = next(get_db())
        init_db.init_db(db)
    except Exception as e:
        print(f"❌ Error during init_db: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "version": "v2.0-core", "service": "ProfVirtuel V2"}

# --- Routes Étudiants ---

@app.get("/students", response_model=List[StudentRead])
def get_students(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "student").all()

@app.post("/students", response_model=StudentRead)
def create_student(
    student: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    # Simple creation sans mot de passe pour le MVP
    email_gen = f"{student.name.lower().replace(' ', '.')}@student.com"
    
    # Vérifier l'existence
    existing = db.query(User).filter(User.email == email_gen).first()
    
    # Déterminer le prof (current_user si prof, sinon premier trouvé)
    teacher_id = None
    if current_user and current_user.role in ["teacher", "admin"]:
        teacher_id = current_user.id
    else:
        default_teacher = db.query(User).filter(User.role == "teacher").first()
        teacher_id = default_teacher.id if default_teacher else 1

    if existing:
        # MISE À JOUR : Si l'élève existe, on met à jour sa classe quand même
        if student.class_name:
            existing.class_name = student.class_name
        
        # Ré-assigner au prof actuel si c'était orphelin ou si changement
        if teacher_id and (existing.teacher_id is None):
            existing.teacher_id = teacher_id
            
        db.commit()
        db.refresh(existing)
        return existing
        
    from app.auth import get_password_hash as _hash_pw
    new_user = User(
        name=student.name,
        email=email_gen,
        role="student",
        class_name=student.class_name,
        teacher_id=teacher_id,
        hashed_password=_hash_pw("0000"),
        student_password=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Supprimer d'abord les évaluations liées ? Ou cascade ?
    # Pour l'instant on supprime juste le user, SQLAlchemy gérera ou on aura une erreur de clé étrangère
    # Idéalement on supprime les évals d'abord
    db.query(Evaluation).filter(Evaluation.student_id == student_id).delete()
    db.delete(user)
    db.commit()
    return {"status": "deleted"}

# --- Routes Évaluations ---

@app.get("/evaluations")
def get_all_evaluations(db: Session = Depends(get_db)):
    # Pour le MVP on renvoie tout et le front filtrera, ou on peut filtrer par etudiant
    # On va mapper le format DB vers le format attendu par le front React
    evals = db.query(Evaluation).all()
    
    result = []
    # Mapper vers le format JSON du front : { id, studentId, domainId, date, ratings, comment }
    # Note: Notre modèle DB est relationnel (Evaluation -> Scores -> Criteria), le front envoie un JSON plat.
    # Pour l'instant, on va stocker le JSON brut dans 'global_comment' ou 'comment' pour aller vite, 
    # OU faire le mapping propre. Faisons le mapping propre plus tard.
    # Pour l'instant, SIMULATION avec une fausse DB en mémoire si besoin ou stockage JSON
    return [] 

# NOTE: Pour aller très vite et coller au code React existant qui attend un gros JSON,
# Je vais créer un endpoint tampon qui sauvegarde le JSON tel quel dans une structure simple
# En attendant de faire le mapping complet relationnel.

@app.post("/sync/evaluations")
def sync_evaluations(data: List[Dict[str, Any]] = Body(...)):
    """
    Endpoint temporaire pour sauvegarder le dump JSON du front
    afin de persister les données sans refaire tout le backend relationnel immédiatement.
    """
    # Dans une vraie V2, on mapperait chaque éval.
    # Ici on peut juste logger pour dire qu'on a reçu.
    return {"status": "synced", "count": len(data)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
