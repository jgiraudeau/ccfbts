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
    
    # Colonnes à ajouter sur la table users
    user_columns = [
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("class_code", "VARCHAR"),
        ("student_password", "VARCHAR DEFAULT '0000'"),
        ("teacher_id", "INTEGER"),
        ("name", "VARCHAR"),
        ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
        ("stage_start_date", "DATE"),
        ("stage_end_date", "DATE"),
        ("stage_company", "VARCHAR(200)"),
        ("stage_tutor", "VARCHAR(100)"),
        ("username", "VARCHAR"),
    ]

    # Colonnes à ajouter sur la table classes
    class_columns = [
        ("class_code", "VARCHAR(6)"),
    ]

    with engine.connect() as conn:
        for col_name, col_type in user_columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ users.{col_name} ajoutée")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
                    print(f"ℹ️ users.{col_name} existe déjà.")
                else:
                    print(f"⚠️ Erreur users.{col_name} : {e}")

        # Créer la table classes si elle n'existe pas (SQLAlchemy le fait mais au cas où)
        for col_name, col_type in class_columns:
            try:
                conn.execute(text(f"ALTER TABLE classes ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ classes.{col_name} ajoutée")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
                    print(f"ℹ️ classes.{col_name} existe déjà.")
                else:
                    print(f"⚠️ Erreur classes.{col_name} : {e}")
    
    print(">>> Migration terminée.")
    sys.stdout.flush()

if __name__ == "__main__":
    force_migrate()
