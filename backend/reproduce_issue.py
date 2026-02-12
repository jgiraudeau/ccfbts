from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.models_tracking import Deadline, Submission
from app.database import Base
from datetime import date
from sqlalchemy import or_

# Setup memory DB for testing logic
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
# Important: ensure models are loaded
import app.models
import app.models_tracking

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# This creates all tables in memory
Base.metadata.create_all(bind=engine)

def test_visibility():
    db = SessionLocal()
    
    # 1. Create Teacher
    teacher = User(name="Teacher", email="t@t.com", role="teacher", is_active=True)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    
    # 2. Create Orphan Student
    student = User(name="Orphan", email="s@s.com", role="student", teacher_id=None, is_active=True)
    db.add(student)
    db.commit()
    db.refresh(student)
    
    # 3. Create Deadline - fixed with document_type
    deadline = Deadline(
        title="Test DL", 
        due_date=date.today(), 
        teacher_id=teacher.id,
        document_type="pdf",
        is_mandatory=True
    )
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    
    print(f"Teacher ID: {teacher.id}")
    print(f"Deadline TeacherID: {deadline.teacher_id}")
    
    # 4. Test Student Seeing Deadline
    # Logic from deadlines.py
    visible_deadlines = []
    
    # Simulate DB query
    query = db.query(Deadline)
    
    if student.role == "student":
        if student.teacher_id:
            query = query.filter(Deadline.teacher_id == student.teacher_id)
        else:
            # Si l'élève n'a pas encore de prof assigné, on lui montre tout
            pass
            
    # Also check if other filters kill it (upcoming only usually applies)
    visible_deadlines = query.all()
    print(f"Student sees {len(visible_deadlines)} deadlines")
    
    if len(visible_deadlines) == 0:
        print("FAIL: Orphan student sees NO deadlines")
    else:
        print("PASS: Orphan student sees deadlines")

    # 5. Create Submission
    sub = Submission(
        student_id=student.id,
        deadline_id=deadline.id,
        file_url="test.pdf",
        file_name="test.pdf",
        status="pending"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    
    # 6. Test Teacher Seeing Submission
    # Logic from tracking_submissions.py
    
    # Simulate the query logic inside the router
    query = db.query(Submission)
    
    # Pour les profs, ne voir que les soumissions de leurs élèves
    if teacher.role == "teacher":
        
        # Voir les soumissions de mes élèves OU pour mes échéances
        teacher_deadlines = db.query(Deadline.id).filter(Deadline.teacher_id == teacher.id).all()
        deadline_ids = [d[0] for d in teacher_deadlines]
        
        student_ids_res = db.query(User.id).filter(User.teacher_id == teacher.id).all()
        student_ids = [s[0] for s in student_ids_res]
        
        print(f"Teacher Deadlines IDs: {deadline_ids}")
        print(f"Teacher Students IDs: {student_ids}")
        
        # Replicate the OR condition
        criterion = or_(
            Submission.student_id.in_(student_ids),
            Submission.deadline_id.in_(deadline_ids)
        )
        query = query.filter(criterion)
        
    visible_submissions = query.all()
    print(f"Teacher sees {len(visible_submissions)} submissions")
    
    if len(visible_submissions) == 0:
        print("FAIL: Teacher sees NO submissions from orphan")
    else:
        print("PASS: Teacher sees submission from orphan")

    db.close()

if __name__ == "__main__":
    test_visibility()
