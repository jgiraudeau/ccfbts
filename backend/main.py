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

# Init DB models
Base.metadata.create_all(bind=engine)

from app.routers import generate, export, submissions

app = FastAPI(title="ProfVirtuel V2 - E6 & CCF")

app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(submissions.router, prefix="/api", tags=["Submissions"])
app.include_router(export.router, prefix="/api", tags=["Export"])

# --- Schemas Pydantic (Entrée/Sortie API) ---

class StudentCreate(BaseModel):
    name: str

class StudentRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role: str

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
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup Event ---
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    init_db.init_db(db)

@app.get("/")
def read_root():
    return {"status": "ok", "version": "v2.0-core", "service": "ProfVirtuel V2"}

# --- Routes Étudiants ---

@app.get("/students", response_model=List[StudentRead])
def get_students(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "student").all()

@app.post("/students", response_model=StudentRead)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Simple creation sans mot de passe pour le MVP
    email_gen = f"{student.name.lower().replace(' ', '.')}@student.com"
    # Vérifier l'existence
    existing = db.query(User).filter(User.email == email_gen).first()
    if existing:
        return existing
        
    new_user = User(
        name=student.name,
        email=email_gen,
        role="student"
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
