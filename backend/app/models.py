from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, Enum, Date, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

# === Énumérations pour typage fort ===
class EvaluationType(enum.Enum):
    FORMATIVE = "formative"
    CERTIFICATIVE = "certificative"

class ExamBlock(enum.Enum):
    E4 = "E4"
    E5 = "E5"
    E6 = "E6"

class SituationType(enum.Enum):
    SITUATION_A = "situation_a"
    SITUATION_B = "situation_b"
    ORAL_E6 = "oral_e6"
    OTHER = "other"

# === Modèles Utilisateurs & Académique ===
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    # Correction: Ajout du champ 'name' pour simplicité d'affichage
    name = Column(String, index=True, nullable=True) 
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="student") # admin, teacher, student
    is_active = Column(Boolean, default=True)  # Pour activer/désactiver les comptes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Auth fields
    class_code = Column(String, nullable=True) # For teachers (PIN shared with students)
    class_name = Column(String, nullable=True) # For students (direct display)
    student_password = Column(String, default="0000") # For students
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Link student to teacher

    # Stage tracking fields (for students)
    stage_start_date = Column(Date, nullable=True)
    stage_end_date = Column(Date, nullable=True)
    stage_company = Column(String(200), nullable=True)
    stage_tutor = Column(String(100), nullable=True)

    # Relations
    teacher = relationship("User", remote_side=[id], back_populates="students")
    students = relationship("User", remote_side=[teacher_id], back_populates="teacher")
    
    evaluations_received = relationship("Evaluation", back_populates="student", foreign_keys="Evaluation.student_id")
    evaluations_given = relationship("Evaluation", back_populates="evaluator", foreign_keys="Evaluation.evaluator_id")
    submissions = relationship("StudentSubmission", back_populates="student")
    tracking_submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_id")
    
    # Class management (for teachers)
    classes = relationship("Class", back_populates="teacher")
    # Class enrollment (for students)
    enrolled_classes = relationship("Class", secondary="class_students", back_populates="students")

class StudentSubmission(Base):
    """Soumissions des étudiants (Fiches E4, Dossiers E6, Preuves)"""
    __tablename__ = "student_submissions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(Text) # Contenu texte (ex: copié-collé fiche situation)
    file_url = Column(String, nullable=True) # Lien fichier (si upload)
    submission_type = Column(String) # 'E4_SITUATION', 'E6_CR', 'AUTRE'
    date = Column(Date)

    student = relationship("User", back_populates="submissions")

class Competency(Base):
    __tablename__ = "competencies"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True)
    description = Column(String)
    block = Column(Enum(ExamBlock))

    # Relations
    criteria = relationship("AssessmentCriterion", back_populates="competency")

class AssessmentCriterion(Base):
    """Critères d'évaluation granulaires liés à une compétence"""
    __tablename__ = "assessment_criteria"
    id = Column(Integer, primary_key=True, index=True)
    competency_id = Column(Integer, ForeignKey("competencies.id"))
    description = Column(String)
    weight = Column(Float, default=1.0)

    competency = relationship("Competency", back_populates="criteria")

# === Cœur du Suivi (Le "Fond") ===
class EvaluationSession(Base):
    """Une session d'examen globale (ex: CCF 2026)"""
    __tablename__ = "evaluation_sessions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)

class Evaluation(Base):
    """
    L'acte d'évaluer, qui peut être formatif ou certificatif.
    """
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, index=True)
    
    student_id = Column(Integer, ForeignKey("users.id"))
    evaluator_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("evaluation_sessions.id"), nullable=True)
    
    date = Column(Date)
    type = Column(Enum(EvaluationType), default=EvaluationType.FORMATIVE)
    situation = Column(Enum(SituationType))
    
    global_comment = Column(Text)
    
    # Relations
    student = relationship("User", foreign_keys=[student_id], back_populates="evaluations_received")
    evaluator = relationship("User", foreign_keys=[evaluator_id], back_populates="evaluations_given")
    scores = relationship("EvaluationScore", back_populates="evaluation")
    attachments = relationship("EvaluationAttachment", back_populates="evaluation")

class EvaluationScore(Base):
    """Le score précis pour un critère donné lors d'une évaluation"""
    __tablename__ = "evaluation_scores"
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    criterion_id = Column(Integer, ForeignKey("assessment_criteria.id"))
    
    score = Column(Float)
    comment = Column(String, nullable=True)

    evaluation = relationship("Evaluation", back_populates="scores")
    criterion = relationship("AssessmentCriterion")

class EvaluationAttachment(Base):
    """Preuves (documents, vidéos) liées à une évaluation"""
    __tablename__ = "evaluation_attachments"
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    file_url = Column(String)
    file_type = Column(String)
    description = Column(String)

    evaluation = relationship("Evaluation", back_populates="attachments")

# Import tracking models (deadlines, submissions)
from .models_tracking import Deadline, Submission
# Import class models
from .models_classes import Class, ClassStudent
