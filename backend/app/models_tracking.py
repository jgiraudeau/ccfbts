from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, DECIMAL, ForeignKey, UniqueConstraint, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Deadline(Base):
    """Échéances de remise de documents"""
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    document_type = Column(String(50), nullable=False)  # 'diaporama', 'compte_rendu_hebdo', etc.
    due_date = Column(Date, nullable=False)
    exam_type = Column(String(10))  # 'E4', 'E6', 'ALL'
    is_mandatory = Column(Boolean, default=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Temporairement nullable pour ne pas casser l'existant
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    submissions = relationship("Submission", back_populates="deadline", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Deadline(id={self.id}, title='{self.title}', due_date={self.due_date}, teacher_id={self.teacher_id})>"


class Submission(Base):
    """Soumissions de documents par les élèves"""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deadline_id = Column(Integer, ForeignKey("deadlines.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500))  # URL du fichier uploadé
    file_name = Column(String(200))
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default='pending')  # 'pending', 'reviewed', 'approved', 'rejected'
    grade = Column(DECIMAL(4, 2))  # Note sur 20
    feedback = Column(Text)  # Commentaires du prof
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    student = relationship("User", back_populates="tracking_submissions", foreign_keys=[student_id])
    deadline = relationship("Deadline", back_populates="submissions")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    # Unique constraint: un élève ne peut soumettre qu'une fois par échéance
    __table_args__ = (
        UniqueConstraint('student_id', 'deadline_id', name='uix_student_deadline'),
    )

    def __repr__(self):
        return f"<Submission(id={self.id}, student_id={self.student_id}, deadline_id={self.deadline_id}, status='{self.status}')>"


class StoredEvaluation(Base):
    """Évaluations préparatoires/CCF stockées (format JSON du frontend)"""
    __tablename__ = "stored_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    frontend_id = Column(String(50), nullable=False)  # ID généré par le frontend (Date.now())
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain_id = Column(String(50))  # 'E6_DISTRIBUTION', 'E4_NEGOCIER', etc.
    eval_type = Column(String(20), nullable=False)  # 'continuous' ou 'final'
    eval_date = Column(String(50))  # Date ISO de l'évaluation
    ratings = Column(Text)  # JSON des notes {"1": "S", "2": "TS", ...}
    comment = Column(Text, nullable=True)
    exam_type = Column(String(10), nullable=True)  # 'E4' ou 'E6' (pour les finals)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])

    __table_args__ = (
        UniqueConstraint('frontend_id', 'teacher_id', name='uix_frontend_id_teacher'),
    )


class UploadedFile(Base):
    """Fichiers uploadés stockés en base de données"""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    original_name = Column(String(300), nullable=False)
    content_type = Column(String(100), nullable=False)
    data = Column(LargeBinary, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
