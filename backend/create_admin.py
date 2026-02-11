from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@ccfbts.fr").first()
        if admin:
            print("Admin already exists")
            return

        # Create Admin
        new_admin = User(
            name="Administrateur",
            email="admin@ccfbts.fr", 
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print("Admin created successfully: admin@ccfbts.fr / admin123")
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
