from app.models import User, Deadline
from app.database import SessionLocal
from datetime import date

db = SessionLocal()
try:
    # Get a teacher
    teacher = db.query(User).filter(User.role == "teacher").first()
    if not teacher:
        print("No teacher found to assign the deadline.")
    else:
        new_d = Deadline(
            title="Test Deadline",
            document_type="diaporama",
            due_date=date.today(),
            teacher_id=teacher.id
        )
        db.add(new_d)
        db.commit()
        print(f"Successfully created deadline for teacher {teacher.name}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
