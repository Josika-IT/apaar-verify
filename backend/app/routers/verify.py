from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, Institution, User
from ..schemas import VerificationResult
from ..services.pdf_service import pdf_service
from ..services.audit_service import log_audit
from ..services.auth import get_current_user

router = APIRouter(tags=["Public & Authorized Verification"])

def mask_name(name: str) -> str:
    parts = name.strip().split()
    masked = []
    for p in parts:
        if len(p) <= 2:
            masked.append(p[0] + "*")
        else:
            masked.append(p[0] + "*" * (len(p) - 2) + p[-1])
    return " ".join(masked)

def mask_student_id(s_id: str) -> str:
    if len(s_id) <= 4:
        return "****"
    return s_id[:3] + "-***-" + s_id[-3:]

def mask_dob(dob: str) -> str:
    # "2004-05-12" -> "****-**-12"
    if len(dob) >= 10:
        return "****-**-" + dob[-2:]
    return "****"

@router.get("/verify/{apaar_id}", response_model=VerificationResult)
def verify_apaar_record(
    apaar_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    clean_id = apaar_id.strip()
    student = db.query(Student).filter(Student.apaar_id == clean_id).first()

    client_ip = request.client.host if request.client else "127.0.0.1"

    if not student:
        log_audit(
            db=db,
            action="VERIFICATION_LOOKUP_FAILED",
            entity="Student",
            entity_id=clean_id,
            details=f"Verification attempted for non-existent APAAR ID {clean_id}",
            ip_address=client_ip
        )
        return VerificationResult(
            is_valid=False,
            apaar_id=clean_id,
            verification_status="Not Found",
            consent_granted=False,
            consent_notice="No record matching this APAAR ID was found in the AICTE Central Student Registry.",
            verification_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()

    log_audit(
        db=db,
        action="RECORD_VERIFIED",
        entity="Student",
        entity_id=str(student.id),
        details=f"Verified academic record for APAAR {clean_id} ({student.verification_status})",
        ip_address=client_ip,
        institution_id=student.institution_id
    )

    if student.consent_flag:
        return VerificationResult(
            is_valid=True,
            apaar_id=student.apaar_id,
            student_id_masked=mask_student_id(student.student_id),
            name_masked=mask_name(student.name),
            dob_masked=mask_dob(student.dob),
            gender=student.gender,
            institution_name=inst.name if inst else "AICTE Approved Institution",
            aicte_code=inst.aicte_code if inst else "N/A",
            course=student.course,
            branch=student.branch,
            year_of_study=student.year_of_study,
            admission_date=student.admission_date,
            verification_status=student.verification_status,
            consent_granted=True,
            consent_notice="Student has granted authenticated consent for public credential verification under Section 43A of IT Act.",
            verification_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            qr_payload=f"AICTE:APAAR:{student.apaar_id}:{student.verification_status}"
        )
    else:
        # Consent restricted: mask further
        return VerificationResult(
            is_valid=True,
            apaar_id=student.apaar_id,
            student_id_masked="[RESTRICTED BY STUDENT CONSENT]",
            name_masked="[RESTRICTED BY STUDENT CONSENT]",
            dob_masked="[RESTRICTED]",
            gender="[RESTRICTED]",
            institution_name=inst.name if inst else "AICTE Approved Institution",
            aicte_code=inst.aicte_code if inst else "N/A",
            course=student.course,
            branch=student.branch,
            year_of_study=student.year_of_study,
            admission_date=student.admission_date,
            verification_status=student.verification_status,
            consent_granted=False,
            consent_notice="Student has opted out of public identity disclosure. Core enrollment status and institutional affiliation are verified.",
            verification_timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            qr_payload=f"AICTE:APAAR:{student.apaar_id}:{student.verification_status}"
        )

@router.get("/records/{apaar_id}/pdf")
def download_verifiable_record_pdf(
    apaar_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    clean_id = apaar_id.strip()
    student = db.query(Student).filter(Student.apaar_id == clean_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found for this APAAR ID")

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Associated institution not found")

    base_url = str(request.base_url).rstrip("/")
    pdf_buffer = pdf_service.generate_student_verification_pdf(student, inst, base_url=base_url)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit(
        db=db,
        action="DOWNLOAD_VERIFIABLE_RECORD_PDF",
        entity="Student",
        entity_id=str(student.id),
        details=f"Downloaded tamper-proof PDF record with QR code for APAAR {clean_id}",
        ip_address=client_ip,
        institution_id=student.institution_id
    )

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=APAAR_Record_{clean_id}.pdf"}
    )
