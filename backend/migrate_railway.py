from sqlalchemy import create_engine, text
import os
from app.database import DATABASE_URL

def force_migrate():
    if not DATABASE_URL or "sqlite" in DATABASE_URL:
        print("Mise à jour auto ignorée (SQLite ou pas de DB_URL)")
        return

    print(f"Connexion à la base pour migration forcée...")
    engine = create_engine(DATABASE_URL)
    
    # Liste des colonnes à ajouter si elles manquent
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

    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                # Syntaxe ALTER TABLE pour PostgreSQL
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ Colonne ajoutée : {col_name}")
            except Exception as e:
                # Si la colonne existe déjà, on l'ignore
                if "already exists" in str(e).lower() or "existe déjà" in str(e).lower():
                    print(f"ℹ️ Colonne déjà présente : {col_name}")
                else:
                    print(f"⚠️ Erreur sur {col_name} : {e}")

if __name__ == "__main__":
    force_migrate()
