from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        # Supprimer l'ancien admin si existant
        old_admin = db.query(User).filter(User.email == "admin@ccfbts.fr").first()
        if old_admin:
            db.delete(old_admin)
            db.commit()
            print("Ancien admin supprimé")

        # Check if admin exists
        admin = db.query(User).filter(User.email == "jacques.giraudeau@gmail.com").first()
        if admin:
            # Mettre à jour le rôle si nécessaire
            admin.role = "admin"
            admin.is_active = True
            admin.hashed_password = get_password_hash("chfcarantec2025$")
            db.commit()
            print("Admin mis à jour : jacques.giraudeau@gmail.com")
            return

        # Create Admin
        new_admin = User(
            name="Jacques Giraudeau",
            email="jacques.giraudeau@gmail.com",
            hashed_password=get_password_hash("chfcarantec2025$"),
            role="admin",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print("Admin créé : jacques.giraudeau@gmail.com")
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
