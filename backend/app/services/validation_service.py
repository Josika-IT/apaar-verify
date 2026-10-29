import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from ..models import Student, Institution, Course, ValidationFlag

class ValidationService:
    @staticmethod
    def validate_row_dict(row: Dict[str, Any], existing_apaar_ids: Optional[set] = None) -> Tuple[bool, List[str], List[str]]:
        """
        Validates a single record represented as a dict (from CSV or single form).
        Returns (is_valid, errors, warnings).
        """
        errors = []
        warnings = []

        # 1. Mandatory Fields
        required_fields = ["apaar_id", "student_id", "name", "dob", "gender", "course", "branch", "admission_date"]
        for field in required_fields:
            val = str(row.get(field, "")).strip()
            if not val or val.lower() == "nan" or val.lower() == "none":
                errors.append(f"Missing mandatory field: '{field}'")

        # 2. APAAR ID: exactly 12 digits
        apaar = str(row.get("apaar_id", "")).strip()
        # strip any quotes or decimals e.g. if parsed from excel as float
        if apaar.endswith(".0"):
            apaar = apaar[:-2]
        
        if not apaar:
            # Already caught by mandatory check
            pass
        elif not re.fullmatch(r"^\d{12}$", apaar):
            errors.append(f"Invalid APAAR ID format '{apaar}': Must be exactly 12 numeric digits")
        elif existing_apaar_ids is not None and apaar in existing_apaar_ids:
            errors.append(f"Duplicate APAAR ID detected in this batch: {apaar}")

        # 3. DOB and Age sanity
        dob_str = str(row.get("dob", "")).strip()
        adm_str = str(row.get("admission_date", "")).strip()
        if dob_str and dob_str.lower() != "nan":
            try:
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                today = datetime.utcnow().date()
                if dob >= today:
                    errors.append(f"Invalid DOB '{dob_str}': Date of birth cannot be in the present or future")
                else:
                    age_years = (today - dob).days / 365.25
                    if age_years < 15:
                        errors.append(f"Age sanity error: Student age ({age_years:.1f} yrs) is under 15 at higher education level")
                    elif age_years > 75:
                        warnings.append(f"Unusual age ({age_years:.1f} yrs) for student enrollment")
            except ValueError:
                # Try fallback format DD-MM-YYYY or DD/MM/YYYY
                try:
                    dob = datetime.strptime(dob_str.replace("/", "-"), "%d-%m-%Y").date()
                except ValueError:
                    errors.append(f"Invalid DOB format '{dob_str}': Expected YYYY-MM-DD")

        # 4. Gender check
        gender = str(row.get("gender", "")).strip().capitalize()
        if gender and gender not in ["Male", "Female", "Other"]:
            errors.append(f"Invalid Gender '{gender}': Must be Male, Female, or Other")

        # 5. Category & Quota checks
        cat = str(row.get("category", "General")).strip()
        valid_cats = ["General", "OBC", "SC", "ST", "EWS"]
        if cat and cat not in valid_cats:
            warnings.append(f"Unrecognized category '{cat}', defaulting to General")

        quota = str(row.get("quota", "Regular")).strip()
        valid_quotas = ["Regular", "Supernumerary", "NRI"]
        if quota and quota not in valid_quotas:
            warnings.append(f"Unrecognized quota '{quota}', defaulting to Regular")

        # 6. NRI / Foreign National / OCI Consistency
        nationality = str(row.get("nationality", "Indian")).strip().title()
        is_fn = str(row.get("foreign_national", "False")).strip().lower() in ["true", "1", "yes"]
        is_oci = str(row.get("oci_status", "False")).strip().lower() in ["true", "1", "yes"]

        if is_fn and nationality == "Indian":
            errors.append("Nationality mismatch: Student flagged as Foreign National but nationality specified as 'Indian'")
        if not is_fn and not is_oci and nationality != "Indian" and quota == "Regular":
            warnings.append(f"Non-Indian citizen ({nationality}) enrolled under Regular quota without NRI/OCI flag")

        is_valid = len(errors) == 0
        return is_valid, errors, warnings

    @staticmethod
    def run_full_validation_audit(db: Session, institution_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Executes full validation suite on all students or specific institution.
        Updates validation_flags and student status.
        """
        # Fetch target institutions
        inst_query = db.query(Institution)
        if institution_id:
            inst_query = inst_query.filter(Institution.id == institution_id)
        institutions = inst_query.all()
        inst_map = {inst.id: inst for inst in institutions}

        # Clear existing flags for these institutions
        if institution_id:
            db.query(ValidationFlag).filter(ValidationFlag.institution_id == institution_id).delete()
        else:
            db.query(ValidationFlag).delete()
        db.commit()

        # Fetch all students for cross-checking
        all_students = db.query(Student).all()
        
        # 1. Check Duplicate APAAR IDs (internal and cross-institution)
        apaar_dict: Dict[str, List[Student]] = {}
        for s in all_students:
            apaar_clean = s.apaar_id.strip()
            apaar_dict.setdefault(apaar_clean, []).append(s)

        flags_to_add = []
        flagged_student_ids = set()

        for apaar, students in apaar_dict.items():
            # A) Check format
            if not re.fullmatch(r"^\d{12}$", apaar):
                for s in students:
                    if institution_id and s.institution_id != institution_id:
                        continue
                    flags_to_add.append(ValidationFlag(
                        student_id=s.id,
                        institution_id=s.institution_id,
                        apaar_id=s.apaar_id,
                        rule_name="INVALID_APAAR_FORMAT",
                        severity="ERROR",
                        message=f"APAAR ID '{s.apaar_id}' does not comply with 12-digit standard",
                        details=f"Student {s.name} (Roll: {s.student_id})"
                    ))
                    flagged_student_ids.add(s.id)

            # B) Check duplicates
            if len(students) > 1:
                # Group by institution
                by_inst: Dict[int, List[Student]] = {}
                for s in students:
                    by_inst.setdefault(s.institution_id, []).append(s)

                for inst_id, inst_students in by_inst.items():
                    if institution_id and inst_id != institution_id:
                        continue
                    if len(inst_students) > 1:
                        # Internal duplicate
                        for s in inst_students:
                            flags_to_add.append(ValidationFlag(
                                student_id=s.id,
                                institution_id=inst_id,
                                apaar_id=s.apaar_id,
                                rule_name="DUPLICATE_APAAR_INTERNAL",
                                severity="CRITICAL",
                                message=f"Duplicate APAAR ID {apaar} registered multiple times within the same institution",
                                details=f"Student ID: {s.student_id}, Name: {s.name}"
                            ))
                            flagged_student_ids.add(s.id)

                # Cross-institution duplicates
                if len(by_inst) > 1:
                    inst_names = [inst_map[i].name if i in inst_map else f"Inst#{i}" for i in by_inst.keys()]
                    inst_summary = ", ".join(inst_names)
                    for s in students:
                        if institution_id and s.institution_id != institution_id:
                            continue
                        flags_to_add.append(ValidationFlag(
                            student_id=s.id,
                            institution_id=s.institution_id,
                            apaar_id=s.apaar_id,
                            rule_name="DUPLICATE_APAAR_CROSS",
                            severity="CRITICAL",
                            message=f"Potential multi-institution duplicate enrollment detected across: {inst_summary}",
                            details=f"APAAR {apaar} belongs to {s.name} at {inst_map.get(s.institution_id, Institution(name='Other')).name}"
                        ))
                        flagged_student_ids.add(s.id)

        # 2. Check Enrolment vs Approved Intake (excluding supernumerary)
        for inst in institutions:
            courses = db.query(Course).filter(Course.institution_id == inst.id).all()
            for c in courses:
                # Count regular students enrolled in this course & branch
                regular_students = db.query(Student).filter(
                    Student.institution_id == inst.id,
                    Student.course == c.course_name,
                    Student.branch == c.branch_name,
                    Student.quota == "Regular"
                ).all()
                
                enrolled_count = len(regular_students)
                if enrolled_count > c.approved_intake:
                    excess = enrolled_count - c.approved_intake
                    # Create flag for the institution
                    flags_to_add.append(ValidationFlag(
                        student_id=regular_students[-1].id if regular_students else None,
                        institution_id=inst.id,
                        apaar_id="N/A_INTAKE",
                        rule_name="EXCESS_INTAKE",
                        severity="ERROR",
                        message=f"Approved intake exceeded for {c.course_name} - {c.branch_name}: {enrolled_count} regular students admitted against approved capacity of {c.approved_intake} (Excess: +{excess})",
                        details=f"Intake: {c.approved_intake}, Regular Enrolment: {enrolled_count}, Excess: {excess}"
                    ))
                    # Mark excess students as flagged
                    for s in regular_students[c.approved_intake:]:
                        flagged_student_ids.add(s.id)

        # 3. Check Citizenship / Quota Inconsistencies & DOB
        for s in all_students:
            if institution_id and s.institution_id != institution_id:
                continue
            
            # Nationality vs Foreign National
            if s.foreign_national and s.nationality.strip().lower() == "indian":
                flags_to_add.append(ValidationFlag(
                    student_id=s.id,
                    institution_id=s.institution_id,
                    apaar_id=s.apaar_id,
                    rule_name="CITIZENSHIP_MISMATCH",
                    severity="ERROR",
                    message=f"Inconsistency: Student flagged as Foreign National with nationality recorded as 'Indian'",
                    details=f"Student: {s.name} ({s.student_id})"
                ))
                flagged_student_ids.add(s.id)

            # Age sanity
            try:
                dob = datetime.strptime(s.dob, "%Y-%m-%d").date()
                age = (datetime.utcnow().date() - dob).days / 365.25
                if age < 15:
                    flags_to_add.append(ValidationFlag(
                        student_id=s.id,
                        institution_id=s.institution_id,
                        apaar_id=s.apaar_id,
                        rule_name="DOB_SANITY_ERROR",
                        severity="ERROR",
                        message=f"DOB Sanity Warning: Student age ({age:.1f} yrs) is under minimum threshold for higher technical education",
                        details=f"DOB: {s.dob}, Name: {s.name}"
                    ))
                    flagged_student_ids.add(s.id)
            except Exception:
                pass

        # Save all generated flags
        for f in flags_to_add:
            db.add(f)
        
        # Update student statuses
        for s in all_students:
            if institution_id and s.institution_id != institution_id:
                continue
            if s.id in flagged_student_ids:
                s.verification_status = "Flagged"
            else:
                s.verification_status = "Verified"
        
        db.commit()

        # Update institution status if flags exist
        for inst in institutions:
            inst_flags = [f for f in flags_to_add if f.institution_id == inst.id]
            criticals = [f for f in inst_flags if f.severity == "CRITICAL"]
            if len(criticals) > 0:
                inst.status = "Flagged"
            elif len(inst_flags) > 0:
                inst.status = "Under Review"
            else:
                inst.status = "Active"
        db.commit()

        return {
            "total_flags": len(flags_to_add),
            "flagged_students_count": len(flagged_student_ids),
            "flags": flags_to_add
        }

validation_service = ValidationService()
