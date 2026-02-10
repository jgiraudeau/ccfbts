"""
Script pour appliquer la migration du système de suivi
"""
from app.database import engine, Base
from app.models import User, Evaluation, StudentSubmission
from app.models_tracking import Deadline, Submission
from app.models_classes import Class, ClassStudent

def create_tracking_tables():
    """Crée les tables de suivi (deadlines, submissions, classes)"""
    print("Création des tables de suivi...")
    
    # Créer toutes les tables définies dans Base.metadata
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tables créées avec succès!")
    print("  - deadlines")
    print("  - submissions")
    print("  - classes")
    print("  - class_students")
    print("  - Colonnes ajoutées à users (stage_start_date, stage_end_date, etc.)")

if __name__ == "__main__":
    create_tracking_tables()
