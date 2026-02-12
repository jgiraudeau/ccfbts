from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Class, ClassStudent
import os

DATABASE_URL = "sqlite:///./profvirtuel-v2.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_db():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("--- USERS ---")
        for u in users:
            print(f"ID: {u.id} | Name: {u.name} | Role: {u.role} | TeacherID: {u.teacher_id} | Email: {u.email}")
            
        print("\n--- DEADLINES ---")
        from app.models_tracking import Deadline
        deadlines = db.query(Deadline).all()
        for d in deadlines:
            print(f"ID: {d.id} | Title: {d.title} | TeacherID: {d.teacher_id}")

        print("\n--- SUBMISSIONS ---")
        from app.models_tracking import Submission
        subs = db.query(Submission).all()
        for s in subs:
            print(f"ID: {s.id} | StudentID: {s.student_id} | DeadlineID: {s.deadline_id}")

    finally:
        db.close()

if __name__ == "__main__":
    check_db()
