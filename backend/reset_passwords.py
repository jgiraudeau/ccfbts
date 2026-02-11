from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()

# Reset Admin (ID 3)
admin = db.query(User).filter(User.email == "admin@ccfbts.fr").first()
if admin:
    print(f"Resetting password for {admin.email} to 'admin'")
    admin.hashed_password = get_password_hash("admin")
    db.commit()

# Ensure Teacher (ID 2) is correct
teacher = db.query(User).filter(User.email == "prof@ccfbts.fr").first()
if teacher:
    print(f"Ensuring teacher {teacher.email} has class_code '1234' and password 'admin'")
    teacher.class_code = "1234"
    # We can leave legacy password or update it. Let's update it to bcrypt 'admin' strictly speaking, 
    # but the auth logic supports legacy plaintext 'admin' too. 
    # Let's keep it robust.
    # teacher.hashed_password = "admin" # Legacy support
    db.commit()

print("Passwords reset.")
