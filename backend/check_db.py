from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Class, ClassStudent
import os

DATABASE_URL = "sqlite:///./profvirtuel.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- USERS ---")
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id} | Name: {u.name} | Role: {u.role} | TeacherID: {u.teacher_id} | ClassName: {u.class_name}")

print("\n--- CLASSES ---")
classes = db.query(Class).all()
for c in classes:
    print(f"ID: {c.id} | Name: {c.name} | TeacherID: {c.teacher_id}")

print("\n--- CLASS_STUDENTS (Links) ---")
links = db.query(ClassStudent).all()
for l in links:
    print(f"ClassID: {l.class_id} | StudentID: {l.student_id}")

db.close()
