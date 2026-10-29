from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # 'aicte_admin', 'institution_admin', 'verifier'
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("Institution", back_populates="users")


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False)
    type = Column(String(100), default="Engineering & Technology")
    approved_intake = Column(Integer, default=0)
    status = Column(String(50), default="Active")  # 'Active', 'Flagged', 'Under Review'
    risk_score = Column(Float, default=0.0)  # 0 to 100
    risk_level = Column(String(50), default="Low")  # 'Low', 'Medium', 'High'
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="institution", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="institution", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="institution", cascade="all, delete-orphan")
    validation_flags = relationship("ValidationFlag", back_populates="institution", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(100), nullable=False)  # e.g., 'B.Tech', 'M.Tech', 'MCA'
    branch_name = Column(String(150), nullable=False)  # e.g., 'Computer Science and Engineering'
    approved_intake = Column(Integer, default=60, nullable=False)
    duration_years = Column(Integer, default=4)

    institution = relationship("Institution", back_populates="courses")
    students = relationship("Student", back_populates="course_rel")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    
    apaar_id = Column(String(12), index=True, nullable=False)
    student_id = Column(String(100), nullable=False)  # institutional roll/registration
    name = Column(String(255), nullable=False)
    dob = Column(String(20), nullable=False)  # YYYY-MM-DD
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    
    course = Column(String(100), nullable=False)
    branch = Column(String(150), nullable=False)
    year_of_study = Column(Integer, default=1)
    admission_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    
    category = Column(String(50), default="General")  # General, OBC, SC, ST, EWS
    quota = Column(String(50), default="Regular")  # Regular, Supernumerary, NRI
    oci_status = Column(Boolean, default=False)
    foreign_national = Column(Boolean, default=False)
    nationality = Column(String(100), default="Indian")
    
    consent_flag = Column(Boolean, default=True)  # Student data disclosure consent
    verification_status = Column(String(50), default="Verified")  # Verified, Pending, Flagged
    validation_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="students")
    course_rel = relationship("Course", back_populates="students")
    validation_flags = relationship("ValidationFlag", back_populates="student", cascade="all, delete-orphan")


class ValidationFlag(Base):
    __tablename__ = "validation_flags"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    apaar_id = Column(String(12), nullable=False, index=True)
    
    rule_name = Column(String(100), nullable=False)  # DUPLICATE_APAAR_INTERNAL, DUPLICATE_APAAR_CROSS, EXCESS_INTAKE, etc.
    severity = Column(String(20), default="ERROR")  # CRITICAL, ERROR, WARNING
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED, ACKNOWLEDGED
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="validation_flags")
    institution = relationship("Institution", back_populates="validation_flags")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)
    institution_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)
