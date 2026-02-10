from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ============================================
# SCHEMAS POUR LES CLASSES
# ============================================

class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    academic_year: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    academic_year: Optional[str] = None

class ClassResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    academic_year: Optional[str]
    teacher_id: int
    created_at: datetime
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AddStudentsToClass(BaseModel):
    student_ids: List[int]

# ============================================
# SCHEMAS POUR LES ÉCHÉANCES
# ============================================

class DeadlineCreate(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: str  # 'diaporama', 'compte_rendu_hebdo', etc.
    due_date: date
    exam_type: Optional[str] = None  # 'E4', 'E6', 'ALL'
    is_mandatory: bool = True
    class_ids: Optional[List[int]] = None  # Si None, pour toutes les classes du prof

class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[str] = None
    due_date: Optional[date] = None
    exam_type: Optional[str] = None
    is_mandatory: Optional[bool] = None

class DeadlineResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    document_type: str
    due_date: date
    exam_type: Optional[str]
    is_mandatory: bool
    created_at: datetime
    submissions_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ============================================
# SCHEMAS POUR LES SOUMISSIONS
# ============================================

class SubmissionCreate(BaseModel):
    deadline_id: int
    file_url: Optional[str] = None
    file_name: Optional[str] = None

class SubmissionReview(BaseModel):
    status: str  # 'reviewed', 'approved', 'rejected'
    grade: Optional[float] = None
    feedback: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    deadline_id: int
    file_url: Optional[str]
    file_name: Optional[str]
    submitted_at: datetime
    status: str
    grade: Optional[float]
    feedback: Optional[str]
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]
    
    # Relations
    student_name: Optional[str] = None
    deadline_title: Optional[str] = None

    class Config:
        from_attributes = True

# ============================================
# SCHEMAS POUR L'ADMINISTRATION
# ============================================

class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class TeacherResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime
    class_count: Optional[int] = 0
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ActivateTeacher(BaseModel):
    is_active: bool

# ============================================
# SCHEMAS POUR LES ÉLÈVES
# ============================================

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    student_password: str = "0000"
    stage_start_date: Optional[date] = None
    stage_end_date: Optional[date] = None
    stage_company: Optional[str] = None
    stage_tutor: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    student_password: Optional[str] = None
    stage_start_date: Optional[date] = None
    stage_end_date: Optional[date] = None
    stage_company: Optional[str] = None
    stage_tutor: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    stage_start_date: Optional[date]
    stage_end_date: Optional[date]
    stage_company: Optional[str]
    stage_tutor: Optional[str]
    submissions_count: Optional[int] = 0
    average_grade: Optional[float] = None

    class Config:
        from_attributes = True

# ============================================
# SCHEMAS POUR LE TABLEAU DE BORD
# ============================================

class DashboardStats(BaseModel):
    total_students: int
    total_deadlines: int
    total_submissions: int
    pending_reviews: int
    average_grade: Optional[float] = None
    late_submissions: int

class StudentDashboard(BaseModel):
    student: StudentResponse
    upcoming_deadlines: List[DeadlineResponse]
    recent_submissions: List[SubmissionResponse]
    stats: dict
