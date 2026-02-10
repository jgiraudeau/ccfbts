from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Class(Base):
    """Classes créées par les professeurs"""
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Ex: "BTS NDRC 1A", "BTS NDRC 2A"
    description = Column(Text)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(20))  # Ex: "2024-2025"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    teacher = relationship("User", back_populates="classes")
    students = relationship("User", secondary="class_students", back_populates="enrolled_classes")

    def __repr__(self):
        return f"<Class(id={self.id}, name='{self.name}', teacher_id={self.teacher_id})>"


class ClassStudent(Base):
    """Table d'association entre classes et étudiants (many-to-many)"""
    __tablename__ = "class_students"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ClassStudent(class_id={self.class_id}, student_id={self.student_id})>"
