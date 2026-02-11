from sqlalchemy import create_engine, text
import os
import sys

# Charger l'URL depuis l'environnement car l'import app.database peut échouer si le schéma est cassé
DATABASE_URL = os.getenv("DATABASE_URL")

def force_migrate():
    if not DATABASE_URL or "sqlite" in DATABASE_URL:
        print(">>> Migration : SQLite ou pas de URL, on saute.")
        return

    print(f">>> Migration : Début de la mise à jour du schéma PostgreSQL...")
    
    # Correction Railway : remplacer postgres:// par postgresql://
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

    with engine.begin() as conn: # Utilise begin() pour auto-commit
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                print(f"✅ Colonne ajoutée : {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
                    print(f"ℹ️ {col_name} existe déjà.")
                else:
                    print(f"⚠️ Erreur {col_name} : {e}")
    
    print(">>> Migration terminée avec succès.")
    sys.stdout.flush()

if __name__ == "__main__":
    force_migrate()
