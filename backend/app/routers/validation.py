from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ValidationFlag, Institution, Student, User
from ..schemas import ValidationReportResponse, ValidationFlagOut
from ..services.auth import get_current_user, require_roles
from ..services.validation_service import validation_service
from ..services.anomaly_service import anomaly_service
from ..services.audit_service import log_audit

router = APIRouter(prefix="/validation", tags=["Validation"])

@router.get("/report", response_model=ValidationReportResponse)
def get_validation_report(
    institution_id: Optional[int] = Query(None),
    rule_name: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id if current_user.role == "institution_admin" else institution_id

    query = db.query(ValidationFlag)
    if inst_id:
        query = query.filter(ValidationFlag.institution_id == inst_id)
    if rule_name:
        query = query.filter(ValidationFlag.rule_name == rule_name)
    if severity:
        query = query.filter(ValidationFlag.severity == severity)

    flags = query.order_by(ValidationFlag.id.desc()).all()

    # Preload institution and student names
    inst_map = {i.id: i.name for i in db.query(Institution).all()}
    student_map = {s.id: s.name for s in db.query(Student).filter(Student.id.in_([f.student_id for f in flags if f.student_id])).all()}

    critical_count = sum(1 for f in flags if f.severity == "CRITICAL")
    error_count = sum(1 for f in flags if f.severity == "ERROR")
    warning_count = sum(1 for f in flags if f.severity == "WARNING")

    dup_internal = sum(1 for f in flags if f.rule_name == "DUPLICATE_APAAR_INTERNAL")
    dup_cross = sum(1 for f in flags if f.rule_name == "DUPLICATE_APAAR_CROSS")
    excess_intake = sum(1 for f in flags if f.rule_name == "EXCESS_INTAKE")
    format_err = sum(1 for f in flags if f.rule_name == "INVALID_APAAR_FORMAT")
    inconsistency = sum(1 for f in flags if f.rule_name in ["CITIZENSHIP_MISMATCH", "DOB_SANITY_ERROR", "MISSING_MANDATORY_FIELD"])

    flag_outs = [
        ValidationFlagOut(
            id=f.id,
            student_id=f.student_id,
            student_name=student_map.get(f.student_id),
            institution_id=f.institution_id,
            institution_name=inst_map.get(f.institution_id, "Unknown"),
            apaar_id=f.apaar_id,
            rule_name=f.rule_name,
            severity=f.severity,
            message=f.message,
            details=f.details,
            status=f.status,
            created_at=f.created_at
        )
        for f in flags
    ]

    return ValidationReportResponse(
        total_flags=len(flags),
        critical_count=critical_count,
        error_count=error_count,
        warning_count=warning_count,
        duplicate_internal_count=dup_internal,
        duplicate_cross_count=dup_cross,
        excess_intake_count=excess_intake,
        format_error_count=format_err,
        inconsistency_count=inconsistency,
        flags=flag_outs
    )

@router.post("/run-audit")
def trigger_validation_audit(
    institution_id: Optional[int] = Query(None),
    current_user: User = Depends(require_roles(["aicte_admin", "institution_admin"])),
    db: Session = Depends(get_db)
):
    inst_id = current_user.institution_id if current_user.role == "institution_admin" else institution_id

    result = validation_service.run_full_validation_audit(db, institution_id=inst_id)
    anomaly_service.calculate_anomalies(db)

    log_audit(
        db=db,
        action="RUN_VALIDATION_AUDIT",
        entity="Validation",
        entity_id=str(inst_id) if inst_id else "ALL_INSTITUTIONS",
        details=f"Triggered manual validation re-audit. Generated {result['total_flags']} flags across {result['flagged_students_count']} flagged students",
        user=current_user,
        institution_id=inst_id
    )

    return {
        "status": "success",
        "message": "Full validation audit executed successfully",
        "total_flags": result["total_flags"],
        "flagged_students_count": result["flagged_students_count"]
    }

@router.put("/flags/{flag_id}/status")
def update_flag_status(
    flag_id: int,
    payload: dict,
    current_user: User = Depends(require_roles(["aicte_admin", "institution_admin"])),
    db: Session = Depends(get_db)
):
    flag = db.query(ValidationFlag).filter(ValidationFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Validation flag not found")

    new_status = payload.get("status", "RESOLVED")
    flag.status = new_status
    db.commit()

    log_audit(
        db=db,
        action="UPDATE_FLAG_STATUS",
        entity="ValidationFlag",
        entity_id=str(flag.id),
        details=f"Updated flag #{flag.id} ({flag.rule_name}) status to '{new_status}'",
        user=current_user,
        institution_id=flag.institution_id
    )

    return {"status": "success", "flag_id": flag.id, "new_status": flag.status}
