import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Institution, Student, ValidationFlag, Course, User
from ..services.auth import get_current_user, require_roles
from ..services.pdf_service import pdf_service
from ..services.audit_service import log_audit

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{report_type}")
def export_report(
    report_type: str,
    format: str = Query("csv", pattern="^(csv|pdf)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_types = ["enrolment-summary", "excess-intake", "duplicates", "accreditation"]
    if report_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid report type '{report_type}'. Allowed: {', '.join(valid_types)}")

    headers = []
    rows = []
    title = ""

    if report_type == "enrolment-summary":
        title = "National Institutional Enrolment & Capacity Utilization Summary"
        headers = ["AICTE Code", "Institution Name", "State", "Approved Intake", "Actual Enrolment", "Supernumerary", "Capacity Utilization %", "Status"]
        institutions = db.query(Institution).all()
        for i in institutions:
            students = db.query(Student).filter(Student.institution_id == i.id).all()
            super_count = sum(1 for s in students if s.quota == "Supernumerary")
            reg_count = sum(1 for s in students if s.quota == "Regular")
            util = round((reg_count / max(i.approved_intake, 1)) * 100, 1)
            rows.append([
                i.aicte_code,
                i.name,
                i.state,
                str(i.approved_intake),
                str(len(students)),
                str(super_count),
                f"{util}%",
                i.status
            ])

    elif report_type == "excess-intake":
        title = "Excess Enrolment & Statutory Quota Violations Audit"
        headers = ["AICTE Code", "Institution Name", "State", "Approved Intake", "Regular Enrolment", "Excess Intake", "Risk Score", "Risk Level"]
        institutions = db.query(Institution).all()
        for i in institutions:
            reg_count = db.query(Student).filter(Student.institution_id == i.id, Student.quota == "Regular").count()
            if reg_count > i.approved_intake or i.risk_score >= 50:
                excess = max(0, reg_count - i.approved_intake)
                rows.append([
                    i.aicte_code,
                    i.name,
                    i.state,
                    str(i.approved_intake),
                    str(reg_count),
                    f"+{excess}",
                    str(i.risk_score),
                    i.risk_level
                ])

    elif report_type == "duplicates":
        title = "National Duplicate APAAR ID Detection & Conflict Audit"
        headers = ["Flag ID", "Severity", "Rule Name", "Institution", "APAAR ID", "Conflict Description", "Status"]
        dup_flags = db.query(ValidationFlag).filter(
            ValidationFlag.rule_name.in_(["DUPLICATE_APAAR_INTERNAL", "DUPLICATE_APAAR_CROSS"])
        ).all()
        inst_map = {i.id: i.name for i in db.query(Institution).all()}
        for f in dup_flags:
            rows.append([
                str(f.id),
                f.severity,
                f.rule_name,
                inst_map.get(f.institution_id, "Unknown"),
                f.apaar_id,
                f.message,
                f.status
            ])

    elif report_type == "accreditation":
        title = "Comprehensive Academic Accreditation & Compliance Dossier"
        headers = ["Institution Name", "Approved Intake", "Enrolled", "Flags Total", "Risk Level", "NRI / Foreign", "Consent Compliance %"]
        institutions = db.query(Institution).all()
        for i in institutions:
            students = db.query(Student).filter(Student.institution_id == i.id).all()
            flags_c = db.query(ValidationFlag).filter(ValidationFlag.institution_id == i.id).count()
            nri_c = sum(1 for s in students if s.quota == "NRI" or s.foreign_national)
            consent_c = sum(1 for s in students if s.consent_flag)
            consent_pct = round((consent_c / max(len(students), 1)) * 100, 1)
            rows.append([
                i.name,
                str(i.approved_intake),
                str(len(students)),
                str(flags_c),
                i.risk_level,
                str(nri_c),
                f"{consent_pct}%"
            ])

    log_audit(
        db=db,
        action="EXPORT_REPORT",
        entity="Report",
        entity_id=report_type,
        details=f"Exported report '{report_type}' in format '{format.upper()}' with {len(rows)} records",
        user=current_user
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Report_{report_type}.csv"}
        )
    else:
        pdf_buffer = pdf_service.generate_administrative_report_pdf(title, headers, rows)
        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=AICTE_Report_{report_type}.pdf"}
        )
