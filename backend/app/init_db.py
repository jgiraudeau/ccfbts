from sqlalchemy.orm import Session
from .models import Competency, AssessmentCriterion, ExamBlock
import json
import os

def load_ref(db: Session, filename: str, block_enum: ExamBlock):
    json_path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
        for domain in data:
            for i, skill in enumerate(domain['children']):
                # Vérifier si existe déjà
                existing = db.query(Competency).filter(Competency.description == skill['description']).first()
                if not existing:
                    try:
                        comp = Competency(
                            code=f"{domain['code']}_{i+1}", 
                            description=skill['description'],
                            block=block_enum
                        )
                        db.add(comp)
                        db.commit() # Pour avoir l'ID
                        
                        # Ajouter les critères
                        for criteria_desc in skill['criteria']:
                            crit = AssessmentCriterion(
                                competency_id=comp.id,
                                description=criteria_desc
                            )
                            db.add(crit)
                    except Exception as e:
                        print(f"Error adding competency {skill['description']}: {e}")
                        db.rollback()
    
    db.commit()

def init_db(db: Session):
    load_ref(db, "referentiel_e6.json", ExamBlock.E6)
    load_ref(db, "referentiel_e4.json", ExamBlock.E4)

    # Création Professeur par défaut
    from .models import User
    prof = db.query(User).filter(User.email == "prof@ccfbts.fr").first()
    if not prof:
        prof = User(
            name="Professeur Principal",
            email="prof@ccfbts.fr", 
            hashed_password="admin", # Pour login simple
            role="teacher",
            class_code="1234" # Code par défaut
        )
        db.add(prof)
        db.commit()
        print("Default Teacher Created: Code 1234")
