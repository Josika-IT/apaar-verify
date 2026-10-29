import io
import csv
import openpyxl
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, Institution, Course, ValidationFlag, User
from ..schemas import (
    StudentCreate,
    StudentUpdate,
    StudentOut,
    StudentBulkRowPreview,
    StudentBulkPreviewResponse,
    StudentBulkSubmitResponse
)
from ..services.auth import get_current_user, require_roles
from ..services.validation_service import validation_service
from ..services.anomaly_service import anomaly_service
from ..services.audit_service import log_audit

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/template")
def download_student_csv_template():
    """Generates and downloads a standardized CSV template for student data upload."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "apaar_id", "student_id", "name", "dob", "gender", "course",
        "branch", "year_of_study", "admission_date", "category",
        "quota", "oci_status", "foreign_national", "nationality", "consent_flag"
    ]
    writer.writerow(headers)
    
    sample_rows = [
        ["100000000101", "IITD-CS-24001", "Rahul Sharma", "2004-05-12", "Male", "B.Tech", "Computer Science and Engineering", "1", "2024-08-01", "General", "Regular", "FALSE", "FALSE", "Indian", "TRUE"],
        ["100000000102", "IITD-CS-24002", "Priya Nair", "2004-08-23", "Female", "B.Tech", "Computer Science and Engineering", "1", "2024-08-01", "OBC", "Regular", "FALSE", "FALSE", "Indian", "TRUE"],
        ["100000000103", "IITD-CS-24003", "David Miller", "2003-12-19", "Male", "B.Tech", "Computer Science and Engineering", "1", "2024-08-02", "General", "NRI", "FALSE", "TRUE", "American", "TRUE"]
    ]
    for row in sample_rows:
        writer.writerow(row)
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apaar_student_upload_template.csv"}
    )

@router.post("", response_model=StudentOut)
def create_student(
    student_in: StudentCreate,
    current_user: User = Depends(require_roles(["aicte_admin", "institution_admin"])),
    db: Session = Depends(get_db)
):
    inst_id = student_in.institution_id or current_user.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID is required")

    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    # Match Course
    course_obj = db.query(Course).filter(
        Course.institution_id == inst_id,
        Course.course_name.ilike(student_in.course),
        Course.branch_name.ilike(student_in.branch)
    ).first()

    # Pre-validation
    row_dict = student_in.model_dump()
    is_valid, errors, warnings = validation_service.validate_row_dict(row_dict)

    student = Student(
        institution_id=inst_id,
        course_id=course_obj.id if course_obj else None,
        apaar_id=student_in.apaar_id.strip(),
        student_id=student_in.student_id.strip(),
        name=student_in.name.strip(),
        dob=student_in.dob.strip(),
        gender=student_in.gender.strip(),
        course=student_in.course.strip(),
        branch=student_in.branch.strip(),
        year_of_study=student_in.year_of_study,
        admission_date=student_in.admission_date.strip(),
        category=student_in.category.strip(),
        quota=student_in.quota.strip(),
        oci_status=student_in.oci_status,
        foreign_national=student_in.foreign_national,
        nationality=student_in.nationality.strip(),
        consent_flag=student_in.consent_flag,
        verification_status="Pending" if not is_valid else "Verified",
        validation_notes="; ".join(errors + warnings) if (errors or warnings) else None
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    # Re-run system audit for duplicate/intake checks
    validation_service.run_full_validation_audit(db, institution_id=inst_id)
    anomaly_service.calculate_anomalies(db)

    log_audit(
        db=db,
        action="STUDENT_CREATE",
        entity="Student",
        entity_id=str(student.id),
        details=f"Created student record {student.name} with APAAR {student.apaar_id}",
        user=current_user,
        institution_id=inst_id
    )

    db.refresh(student)
    return StudentOut(
        id=student.id,
        institution_id=student.institution_id,
        institution_name=inst.name,
        apaar_id=student.apaar_id,
        student_id=student.student_id,
        name=student.name,
        dob=student.dob,
        gender=student.gender,
        course=student.course,
        branch=student.branch,
        year_of_study=student.year_of_study,
        admission_date=student.admission_date,
        category=student.category,
        quota=student.quota,
        oci_status=student.oci_status,
        foreign_national=student.foreign_national,
        nationality=student.nationality,
        consent_flag=student.consent_flag,
        verification_status=student.verification_status,
        validation_notes=student.validation_notes,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.post("/bulk")
async def bulk_upload_students(
    file: UploadFile = File(...),
    preview_only: bool = Query(False, description="If true, return validation preview without saving"),
    institution_id: Optional[int] = Query(None),
    current_user: User = Depends(require_roles(["aicte_admin", "institution_admin"])),
    db: Session = Depends(get_db)
):
    inst_id = institution_id or current_user.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required")

    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    contents = await file.read()
    filename = file.filename.lower()

    rows = []
    if filename.endswith(".csv"):
        text_stream = io.StringIO(contents.decode("utf-8-sig", errors="replace"))
        reader = csv.DictReader(text_stream)
        for r in reader:
            rows.append(r)
    elif filename.endswith(".xlsx") or filename.endswith(".xls"):
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = wb.active
        headers = [str(cell.value).strip().lower() if cell.value is not None else "" for cell in sheet[1]]
        for row_cells in sheet.iter_rows(min_row=2, values_only=True):
            if not any(row_cells):
                continue
            r_dict = {}
            for h, val in zip(headers, row_cells):
                if h:
                    r_dict[h] = str(val).strip() if val is not None else ""
            rows.append(r_dict)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv or .xlsx")

    if not rows:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows")

    # Fetch existing APAARs for collision checks
    existing_apaars = {s[0] for s in db.query(Student.apaar_id).all()}
    
    seen_in_batch = set()
    preview_rows = []
    valid_count = 0
    invalid_count = 0

    for idx, r in enumerate(rows, start=1):
        # Normalize fields
        norm_row = {
            "apaar_id": str(r.get("apaar_id", "")).strip().replace(".0", ""),
            "student_id": str(r.get("student_id", "")).strip(),
            "name": str(r.get("name", "")).strip(),
            "dob": str(r.get("dob", "")).strip(),
            "gender": str(r.get("gender", "")).strip(),
            "course": str(r.get("course", "")).strip(),
            "branch": str(r.get("branch", "")).strip(),
            "year_of_study": int(r.get("year_of_study", 1) or 1),
            "admission_date": str(r.get("admission_date", "")).strip(),
            "category": str(r.get("category", "General")).strip(),
            "quota": str(r.get("quota", "Regular")).strip(),
            "oci_status": str(r.get("oci_status", "False")).strip().lower() in ["true", "1", "yes"],
            "foreign_national": str(r.get("foreign_national", "False")).strip().lower() in ["true", "1", "yes"],
            "nationality": str(r.get("nationality", "Indian")).strip(),
            "consent_flag": str(r.get("consent_flag", "True")).strip().lower() in ["true", "1", "yes"]
        }

        is_valid, errors, warnings = validation_service.validate_row_dict(norm_row, seen_in_batch)
        if norm_row["apaar_id"] in existing_apaars:
            warnings.append(f"APAAR ID {norm_row['apaar_id']} already registered in central repository")

        if norm_row["apaar_id"]:
            seen_in_batch.add(norm_row["apaar_id"])

        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        preview_rows.append(StudentBulkRowPreview(
            row_number=idx,
            data=norm_row,
            is_valid=is_valid,
            errors=errors,
            warnings=warnings
        ))

    # If preview_only, return validation preview directly
    if preview_only:
        return StudentBulkPreviewResponse(
            total_rows=len(rows),
            valid_rows_count=valid_count,
            invalid_rows_count=invalid_count,
            preview_rows=preview_rows
        )

    # Insert valid rows & save flagged records
    inserted_ids = []
    course_cache = {}

    for p in preview_rows:
        d = p.data
        cache_key = (d["course"], d["branch"])
        if cache_key not in course_cache:
            course_obj = db.query(Course).filter(
                Course.institution_id == inst_id,
                Course.course_name.ilike(d["course"]),
                Course.branch_name.ilike(d["branch"])
            ).first()
            course_cache[cache_key] = course_obj.id if course_obj else None

        student = Student(
            institution_id=inst_id,
            course_id=course_cache[cache_key],
            apaar_id=d["apaar_id"],
            student_id=d["student_id"],
            name=d["name"],
            dob=d["dob"],
            gender=d["gender"],
            course=d["course"],
            branch=d["branch"],
            year_of_study=d["year_of_study"],
            admission_date=d["admission_date"],
            category=d["category"],
            quota=d["quota"],
            oci_status=d["oci_status"],
            foreign_national=d["foreign_national"],
            nationality=d["nationality"],
            consent_flag=d["consent_flag"],
            verification_status="Flagged" if not p.is_valid else "Verified",
            validation_notes="; ".join(p.errors + p.warnings) if (p.errors or p.warnings) else None
        )
        db.add(student)
        db.flush()
        inserted_ids.append(student.id)

    db.commit()

    # Run complete validation audit across institution and update anomaly scores
    audit_res = validation_service.run_full_validation_audit(db, institution_id=inst_id)
    anomaly_service.calculate_anomalies(db)

    log_audit(
        db=db,
        action="STUDENT_UPLOAD_BULK",
        entity="Student",
        entity_id=f"Batch_{len(inserted_ids)}",
        details=f"Uploaded {len(inserted_ids)} records from {file.filename}. Valid: {valid_count}, Flagged/Errors: {invalid_count}",
        user=current_user,
        institution_id=inst_id
    )

    return StudentBulkSubmitResponse(
        total_processed=len(preview_rows),
        inserted_count=len(inserted_ids),
        flagged_count=invalid_count,
        errors_count=invalid_count,
        inserted_ids=inserted_ids,
        flags_generated=audit_res.get("total_flags", 0)
    )

@router.get("", response_model=List[StudentOut])
def list_students(
    institution_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    course: Optional[str] = Query(None),
    quota: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    # Institution Admins can only see their own students
    if current_user.role == "institution_admin":
        query = query.filter(Student.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(Student.institution_id == institution_id)

    if status:
        query = query.filter(Student.verification_status.ilike(status))
    if course:
        query = query.filter(Student.course.ilike(f"%{course}%"))
    if quota:
        query = query.filter(Student.quota == quota)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_filter)) |
            (Student.apaar_id.ilike(search_filter)) |
            (Student.student_id.ilike(search_filter)) |
            (Student.branch.ilike(search_filter))
        )

    students = query.order_by(Student.id.desc()).offset(skip).limit(limit).all()

    # Preload institution names
    inst_ids = {s.institution_id for s in students}
    institutions = {i.id: i.name for i in db.query(Institution).filter(Institution.id.in_(inst_ids)).all()}

    return [
        StudentOut(
            id=s.id,
            institution_id=s.institution_id,
            institution_name=institutions.get(s.institution_id, "Unknown"),
            apaar_id=s.apaar_id,
            student_id=s.student_id,
            name=s.name,
            dob=s.dob,
            gender=s.gender,
            course=s.course,
            branch=s.branch,
            year_of_study=s.year_of_study,
            admission_date=s.admission_date,
            category=s.category,
            quota=s.quota,
            oci_status=s.oci_status,
            foreign_national=s.foreign_national,
            nationality=s.nationality,
            consent_flag=s.consent_flag,
            verification_status=s.verification_status,
            validation_notes=s.validation_notes,
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        for s in students
    ]

@router.get("/{id}", response_model=StudentOut)
def get_student(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    if current_user.role == "institution_admin" and student.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to external institution student")

    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()

    return StudentOut(
        id=student.id,
        institution_id=student.institution_id,
        institution_name=inst.name if inst else "Unknown",
        apaar_id=student.apaar_id,
        student_id=student.student_id,
        name=student.name,
        dob=student.dob,
        gender=student.gender,
        course=student.course,
        branch=student.branch,
        year_of_study=student.year_of_study,
        admission_date=student.admission_date,
        category=student.category,
        quota=student.quota,
        oci_status=student.oci_status,
        foreign_national=student.foreign_national,
        nationality=student.nationality,
        consent_flag=student.consent_flag,
        verification_status=student.verification_status,
        validation_notes=student.validation_notes,
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.put("/{id}", response_model=StudentOut)
def update_student(
    id: int,
    student_update: StudentUpdate,
    current_user: User = Depends(require_roles(["aicte_admin", "institution_admin"])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    if current_user.role == "institution_admin" and student.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Unauthorized to edit external institution student")

    update_data = student_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(student, field, val)

    db.commit()

    # Re-run validation audit
    validation_service.run_full_validation_audit(db, institution_id=student.institution_id)
    anomaly_service.calculate_anomalies(db)

    log_audit(
        db=db,
        action="STUDENT_UPDATE",
        entity="Student",
        entity_id=str(student.id),
        details=f"Updated student {student.name} ({student.student_id}): modified fields {list(update_data.keys())}",
        user=current_user,
        institution_id=student.institution_id
    )

    db.refresh(student)
    inst = db.query(Institution).filter(Institution.id == student.institution_id).first()

    return StudentOut(
        id=student.id,
        institution_id=student.institution_id,
        institution_name=inst.name if inst else "Unknown",
        apaar_id=student.apaar_id,
        student_id=student.student_id,
        name=student.name,
        dob=student.dob,
        gender=student.gender,
        course=student.course,
        branch=student.branch,
        year_of_study=student.year_of_study,
        admission_date=student.admission_date,
        category=student.category,
        quota=student.quota,
        oci_status=student.oci_status,
        foreign_national=student.foreign_national,
        nationality=student.nationality,
        consent_flag=student.consent_flag,
        verification_status=student.verification_status,
        validation_notes=student.validation_notes,
        created_at=student.created_at,
        updated_at=student.updated_at
    )
