from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None
    institution_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    otp: Optional[str] = None
    captcha: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# Student Schemas
class StudentBase(BaseModel):
    apaar_id: str = Field(..., min_length=12, max_length=12, description="12-digit APAAR ID")
    student_id: str = Field(..., description="Institutional Roll/Registration Number")
    name: str
    dob: str
    gender: str
    course: str
    branch: str
    year_of_study: int = 1
    admission_date: str
    category: str = "General"
    quota: str = "Regular"
    oci_status: bool = False
    foreign_national: bool = False
    nationality: str = "Indian"
    consent_flag: bool = True

class StudentCreate(StudentBase):
    institution_id: Optional[int] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    year_of_study: Optional[int] = None
    admission_date: Optional[str] = None
    category: Optional[str] = None
    quota: Optional[str] = None
    oci_status: Optional[bool] = None
    foreign_national: Optional[bool] = None
    nationality: Optional[str] = None
    consent_flag: Optional[bool] = None
    verification_status: Optional[str] = None

class StudentOut(StudentBase):
    id: int
    institution_id: int
    institution_name: Optional[str] = None
    verification_status: str
    validation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentBulkRowPreview(BaseModel):
    row_number: int
    data: Dict[str, Any]
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []

class StudentBulkPreviewResponse(BaseModel):
    total_rows: int
    valid_rows_count: int
    invalid_rows_count: int
    preview_rows: List[StudentBulkRowPreview]

class StudentBulkSubmitResponse(BaseModel):
    total_processed: int
    inserted_count: int
    flagged_count: int
    errors_count: int
    inserted_ids: List[int] = []
    flags_generated: int


# Institution Schemas
class CourseOut(BaseModel):
    id: int
    course_name: str
    branch_name: str
    approved_intake: int
    duration_years: int
    actual_enrolment: Optional[int] = 0

    class Config:
        from_attributes = True

class InstitutionOut(BaseModel):
    id: int
    aicte_code: str
    name: str
    state: str
    city: str
    type: str
    approved_intake: int
    actual_enrolment: Optional[int] = 0
    supernumerary_count: Optional[int] = 0
    status: str
    risk_score: float
    risk_level: str
    created_at: datetime
    courses: Optional[List[CourseOut]] = []

    class Config:
        from_attributes = True


# Validation Schemas
class ValidationFlagOut(BaseModel):
    id: int
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    institution_id: int
    institution_name: Optional[str] = None
    apaar_id: str
    rule_name: str
    severity: str
    message: str
    details: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ValidationReportResponse(BaseModel):
    total_flags: int
    critical_count: int
    error_count: int
    warning_count: int
    duplicate_internal_count: int
    duplicate_cross_count: int
    excess_intake_count: int
    format_error_count: int
    inconsistency_count: int
    flags: List[ValidationFlagOut]


# Dashboard Schemas
class CourseIntakeStat(BaseModel):
    course_id: Optional[int] = None
    course: str
    branch: str
    approved_intake: int
    actual_enrolment: int
    regular_count: int
    supernumerary_count: int
    nri_count: int
    excess_count: int

class InstitutionDashboardStats(BaseModel):
    institution_id: int
    institution_name: str
    aicte_code: str
    total_approved_intake: int
    total_actual_enrolment: int
    regular_enrolment: int
    supernumerary_seats: int
    nri_count: int
    oci_count: int
    foreign_national_count: int
    flags_count: int
    critical_alerts: int
    course_breakdown: List[CourseIntakeStat]
    category_distribution: Dict[str, int]
    gender_distribution: Dict[str, int]
    recent_flags: List[ValidationFlagOut]

class StateStat(BaseModel):
    state: str
    institutions_count: int
    approved_intake: int
    actual_enrolment: int
    excess_count: int
    flagged_institutions: int

class AicteDashboardStats(BaseModel):
    total_institutions: int
    total_approved_intake: int
    total_actual_enrolment: int
    total_supernumerary: int
    total_nri_fn: int
    total_flags: int
    excess_enrolment_institutions_count: int
    high_risk_institutions_count: int
    state_breakdown: List[StateStat]
    top_excess_institutions: List[InstitutionOut]
    recent_flags: List[ValidationFlagOut]
    enrolment_trends: List[Dict[str, Any]]


# Anomaly Schemas
class AnomalyItem(BaseModel):
    institution_id: int
    institution_name: str
    state: str
    approved_intake: int
    actual_enrolment: int
    utilization_rate: float
    z_score: float
    risk_score: float
    risk_level: str  # Low, Medium, High
    flags_count: int
    reasons: List[str]

class AnomalyReportResponse(BaseModel):
    mean_utilization: float
    std_dev_utilization: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    anomalies: List[AnomalyItem]


# Audit Log Schemas
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: str
    user_role: str
    institution_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Verification Schemas (Consent-gated)
class VerificationResult(BaseModel):
    is_valid: bool
    apaar_id: str
    student_id_masked: Optional[str] = None
    name_masked: Optional[str] = None
    dob_masked: Optional[str] = None
    gender: Optional[str] = None
    institution_name: Optional[str] = None
    aicte_code: Optional[str] = None
    course: Optional[str] = None
    branch: Optional[str] = None
    year_of_study: Optional[int] = None
    admission_date: Optional[str] = None
    verification_status: str
    consent_granted: bool
    consent_notice: str
    verification_timestamp: str
    qr_payload: Optional[str] = None

# Update Token reference
Token.model_rebuild()
