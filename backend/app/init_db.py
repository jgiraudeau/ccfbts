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

def create_default_admin(db: Session):
    from .models import User
    from .auth import get_password_hash
    
    admin_email = "jacques.giraudeau@gmail.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        try:
            new_admin = User(
                name="Jacques Giraudeau",
                email=admin_email,
                hashed_password=get_password_hash("chfcarantec2025$"),
                role="admin",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print(f"✅ Admin par défaut créé : {admin_email}")
        except Exception as e:
            print(f"❌ Erreur lors de la création de l'admin : {e}")
            db.rollback()
    else:
        # Reset password to known value if already exists to solve login issues
        admin.role = "admin"
        admin.is_active = True
        admin.hashed_password = get_password_hash("chfcarantec2025$")
        db.commit()
        print(f"✅ Compte {admin_email} mis à jour et mot de passe réinitialisé.")

def init_db(db: Session):
    load_ref(db, "referentiel_e6.json", ExamBlock.E6)
    load_ref(db, "referentiel_e4.json", ExamBlock.E4)
    create_default_admin(db)
