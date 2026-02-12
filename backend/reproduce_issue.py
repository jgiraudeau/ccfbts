from sqlalchemy import create_engine, Column, Integer, String, Boolean, Date, ForeignKey, or_
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import date, timedelta

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    class_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Deadline(Base):
    __tablename__ = "deadlines"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    due_date = Column(Date)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    document_type = Column(String)
    exam_type = Column(String)
    is_mandatory = Column(Boolean)

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    deadline_id = Column(Integer, ForeignKey("deadlines.id"))
    file_url = Column(String)
    file_name = Column(String)
    status = Column(String)
    submitted_at = Column(Date)
    grade = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)

# Setup memory DB for testing logic
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_visibility():
    db = SessionLocal()
    
    print("--- SCENARIO START ---")
    
    # 1. Create Teacher
    teacher = User(name="Professeur X", email="prof@test.com", role="teacher", is_active=True)
    db.add(teacher)
    db.commit()
    
    # 2. Create Orphan Student (No teacher_id yet)
    student = User(name="Élève Orphelin", email="student@test.com", role="student", teacher_id=None, is_active=True)
    db.add(student)
    db.commit()
    
    # 3. Create PAST Deadline (Title: Devoir datant d'hier)
    yesterday = date.today() - timedelta(days=1)
    deadline = Deadline(
        title="Devoir Hier", 
        due_date=yesterday, 
        teacher_id=teacher.id,
        document_type="pdf",
        exam_type="E4",
        is_mandatory=True
    )
    db.add(deadline)
    db.commit()
    
    print(f"Teacher ID: {teacher.id}")
    print(f"Student ID: {student.id} (TeacherID: {student.teacher_id})")
    print(f"Deadline ID: {deadline.id} (TeacherID: {deadline.teacher_id}, Date: {deadline.due_date})")
    
    # --- TEST 1: Student View (Fetching Deadlines) ---
    print("\n--- TEST 1: Student Visibility ---")
    # Logic from deadlines.py
    query = db.query(Deadline)
    
    # SIMULATING: upcoming_only=False (since we removed it from frontend default)
    # Filter logic:
    if student.role == "student":
        if student.teacher_id:
             query = query.filter(Deadline.teacher_id == student.teacher_id)
        else:
            # Si pas de teacher_id : voir TOUT
            pass
            
    visible_deadlines = query.all()
    print(f"Student sees {len(visible_deadlines)} deadlines.")
    for d in visible_deadlines:
        print(f" - Found: {d.title} (Due: {d.due_date})")
        
    if len(visible_deadlines) > 0 and visible_deadlines[0].id == deadline.id:
        print("✅ SUCCESS: Orphan student sees the past deadline.")
    else:
        print("❌ FAILURE: Student cannot see the deadline.")

    # --- TEST 2: Submission & Teacher View ---
    print("\n--- TEST 2: Submission & Teacher Visibility ---")
    
    # Student submits
    sub = Submission(
        student_id=student.id,
        deadline_id=deadline.id,
        file_url="test.pdf",
        file_name="test.pdf",
        status="pending",
        submitted_at=date.today()
    )
    db.add(sub)
    db.commit()
    print("Student submitted document.")
    
    # Update student teacher_id (The backend does this on submission creation, but let's assume it happens or NOT for worst case)
    # Ideally tracking_submissions.py does: 
    # if current_user.teacher_id is None and deadline.teacher_id: current_user.teacher_id = deadline.teacher_id
    # Let's verify visibility IF the student is STILL orphan (worst case scenario) or if link failed.
    
    # Teacher connects and fetches submissions
    # Logic from tracking_submissions.py
    query = db.query(Submission)
    
    # User is teacher
    current_user = teacher
    
    if current_user.role == "teacher":
        # Voir les soumissions de mes élèves OU pour mes échéances
        teacher_deadlines = db.query(Deadline.id).filter(Deadline.teacher_id == current_user.id).all()
        deadline_ids = [d[0] for d in teacher_deadlines]
        
        student_ids_res = db.query(User.id).filter(User.teacher_id == current_user.id).all()
        student_ids = [s[0] for s in student_ids_res]
        
        # LOGIC from router
        if deadline_ids or student_ids:
             query = query.filter(or_(
                Submission.student_id.in_(student_ids),
                Submission.deadline_id.in_(deadline_ids)
            ))
        else:
             query = query.filter(Submission.id == -1)

    visible_submissions = query.all()
    print(f"Teacher sees {len(visible_submissions)} submissions.")
    
    if len(visible_submissions) > 0:
        print("✅ SUCCESS: Teacher sees the submission even if student is orphan (via deadline ownership).")
    else:
        print("❌ FAILURE: Teacher cannot see submission.")
    
    db.close()

if __name__ == "__main__":
    test_visibility()
