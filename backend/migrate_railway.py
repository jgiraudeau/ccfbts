from sqlalchemy import create_engine, text
import os
import sys

# Charger l'URL depuis l'environnement
DATABASE_URL = os.getenv("DATABASE_URL")

def force_migrate():
    if not DATABASE_URL or "sqlite" in DATABASE_URL:
        print(">>> Migration : SQLite ou pas de URL, on saute.")
        return

    print(f">>> Migration : Début de la mise à jour du schéma PostgreSQL...")
    
    url = DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    engine = create_engine(url)
    
    columns = [
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("class_code", "VARCHAR"),
        ("student_password", "VARCHAR DEFAULT '0000'"),
        ("teacher_id", "INTEGER"),
        ("name", "VARCHAR"),
        ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
        ("stage_start_date", "DATE"),
        ("stage_end_date", "DATE"),
        ("stage_company", "VARCHAR(200)"),
        ("stage_tutor", "VARCHAR(100)")
    ]

    # On utilise une connexion directe sans transaction globale (autocommit)
    # pour que chaque ALTER TABLE soit indépendant.
    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                # Chaque exécution est sa propre transaction en mode par défaut
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ Colonne ajoutée : {col_name}")
            except Exception as e:
                # Important : on rollback la transaction échouée pour libérer le verrou
                conn.rollback()
                if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
                    print(f"ℹ️ {col_name} existe déjà.")
                else:
                    print(f"⚠️ Erreur {col_name} : {e}")
    
    print(">>> Migration terminée.")
    sys.stdout.flush()

if __name__ == "__main__":
    force_migrate()
