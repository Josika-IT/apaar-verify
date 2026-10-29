import random
from datetime import datetime, date
from sqlalchemy.orm import Session
from ..models import User, Institution, Course, Student, ValidationFlag, AuditLog
from .auth import get_password_hash
from .validation_service import validation_service
from .anomaly_service import anomaly_service

FIRST_NAMES = [
    "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavya", "Chetan", "Deepika",
    "Dhruv", "Divya", "Gaurav", "Harsh", "Isha", "Ishaan", "Jhanvi", "Karan",
    "Kavya", "Manish", "Meera", "Neha", "Nikhil", "Pooja", "Pranav", "Priya",
    "Rahul", "Riya", "Rohan", "Sakshi", "Sameer", "Sanya", "Siddharth", "Sneha",
    "Tarun", "Tanvi", "Varun", "Vidya", "Vikram", "Yash", "Zoya", "Kunal"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Iyer", "Nair",
    "Reddy", "Rao", "Joshi", "Bose", "Chatterjee", "Banerjee", "Kulkarni", "Deshmukh",
    "Mehta", "Shah", "Chopra", "Malhotra", "Saxena", "Mishra", "Pandey", "Yadav"
]

INSTITUTIONS_SEED = [
    {
        "aicte_code": "1-332456781",
        "name": "Indian Institute of Technology Delhi (IITD)",
        "state": "Delhi",
        "city": "New Delhi",
        "type": "Institute of National Importance",
        "approved_intake": 120,
        "admin_email": "admin@iitd.ac.in",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Science and Engineering", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Electrical Engineering", "approved_intake": 60}
        ]
    },
    {
        "aicte_code": "1-332456782",
        "name": "Indian Institute of Technology Bombay (IITB)",
        "state": "Maharashtra",
        "city": "Mumbai",
        "type": "Institute of National Importance",
        "approved_intake": 120,
        "admin_email": "admin@iitb.ac.in",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Science and Engineering", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Mechanical Engineering", "approved_intake": 60}
        ]
    },
    {
        "aicte_code": "1-332456783",
        "name": "Anna University, CEG Campus",
        "state": "Tamil Nadu",
        "city": "Chennai",
        "type": "State Government University",
        "approved_intake": 120,
        "admin_email": "admin@annauniv.edu",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Information Technology", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Electronics & Communication Engg", "approved_intake": 60}
        ]
    },
    {
        "aicte_code": "1-332456784",
        "name": "COEP Technological University",
        "state": "Maharashtra",
        "city": "Pune",
        "type": "State Government Autonomous",
        "approved_intake": 100,
        "admin_email": "admin@coep.ac.in",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Engineering", "approved_intake": 50},
            {"course_name": "B.Tech", "branch_name": "Civil Engineering", "approved_intake": 50}
        ]
    },
    {
        "aicte_code": "1-332456785",
        "name": "Jadavpur University Faculty of Engg & Tech",
        "state": "West Bengal",
        "city": "Kolkata",
        "type": "State Government University",
        "approved_intake": 100,
        "admin_email": "admin@jadavpur.edu",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Science and Engineering", "approved_intake": 50},
            {"course_name": "B.Tech", "branch_name": "Electrical Engineering", "approved_intake": 50}
        ]
    },
    {
        "aicte_code": "1-332456786",
        "name": "National Institute of Technology Tiruchirappalli (NITT)",
        "state": "Tamil Nadu",
        "city": "Tiruchirappalli",
        "type": "NIT / CFTI",
        "approved_intake": 120,
        "admin_email": "admin@nitt.edu",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Science and Engineering", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Instrumentation & Control", "approved_intake": 60}
        ]
    },
    {
        "aicte_code": "1-332456787",
        "name": "R.V. College of Engineering (RVCE)",
        "state": "Karnataka",
        "city": "Bengaluru",
        "type": "Private Autonomous",
        "approved_intake": 120,
        "admin_email": "admin@rvce.edu.in",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Science and Engineering", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Information Science and Engg", "approved_intake": 60}
        ]
    },
    {
        "aicte_code": "1-332456788",
        "name": "Delhi Technological University (DTU)",
        "state": "Delhi",
        "city": "Delhi",
        "type": "State Government University",
        "approved_intake": 120,
        "admin_email": "admin@dtu.ac.in",
        "courses": [
            {"course_name": "B.Tech", "branch_name": "Computer Engineering", "approved_intake": 60},
            {"course_name": "B.Tech", "branch_name": "Software Engineering", "approved_intake": 60}
        ]
    }
]

def seed_database(db: Session):
    """Auto-seeds database if users table is empty."""
    if db.query(User).count() > 0:
        print("[SEEDER] Database already seeded. Skipping initial seed.")
        return

    print("[SEEDER] Starting database seeding with realistic AICTE datasets...")
    random.seed(42)

    # 1. Seed Core Admins & Verifiers
    aicte_admin = User(
        email="admin@aicte.gov.in",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Dr. Anil Sahasrabudhe (AICTE Central Directorate)",
        role="aicte_admin",
        institution_id=None
    )
    db.add(aicte_admin)

    verifier = User(
        email="verifier@tcs.com",
        hashed_password=get_password_hash("Verifier@123"),
        full_name="Rajesh Subramaniam (TCS Talent Verification)",
        role="verifier",
        institution_id=None
    )
    db.add(verifier)
    db.commit()

    # 2. Seed Institutions and Institution Admins
    created_institutions = []
    inst_course_map = {}

    for inst_data in INSTITUTIONS_SEED:
        inst = Institution(
            aicte_code=inst_data["aicte_code"],
            name=inst_data["name"],
            state=inst_data["state"],
            city=inst_data["city"],
            type=inst_data["type"],
            approved_intake=inst_data["approved_intake"],
            status="Active",
            risk_score=10.0,
            risk_level="Low"
        )
        db.add(inst)
        db.commit()
        db.refresh(inst)
        created_institutions.append(inst)

        # Admin user for institution
        inst_admin = User(
            email=inst_data["admin_email"],
            hashed_password=get_password_hash("Admin@123"),
            full_name=f"Registrar / Nodal Officer, {inst.city}",
            role="institution_admin",
            institution_id=inst.id
        )
        db.add(inst_admin)

        # Courses
        inst_course_map[inst.id] = []
        for c in inst_data["courses"]:
            course_obj = Course(
                institution_id=inst.id,
                course_name=c["course_name"],
                branch_name=c["branch_name"],
                approved_intake=c["approved_intake"]
            )
            db.add(course_obj)
            db.commit()
            db.refresh(course_obj)
            inst_course_map[inst.id].append(course_obj)

    db.commit()

    # 3. Seed Realistic Students (~500 students)
    categories = ["General", "OBC", "SC", "ST", "EWS"]
    cat_weights = [0.45, 0.27, 0.15, 0.08, 0.05]
    nationalities = ["Indian", "Indian", "Indian", "Indian", "Nepalese", "Bhutanese", "US Citizen"]

    apaar_counter = 100000000000
    student_records = []

    for inst in created_institutions:
        courses = inst_course_map[inst.id]
        
        # Decide enrolment volume:
        # COEP (inst id 4) & Jadavpur (inst id 5) will have EXCESS enrolment
        is_excess_inst = inst.name.startswith("COEP") or inst.name.startswith("Jadavpur")

        for course in courses:
            intake = course.approved_intake
            if is_excess_inst and "Computer" in course.branch_name:
                num_regular = intake + 15  # Deliberate 15 excess regular students!
            else:
                num_regular = int(intake * random.uniform(0.85, 0.98))

            num_supernumerary = random.randint(2, 6)
            num_nri = random.randint(1, 3)

            total_for_course = num_regular + num_supernumerary + num_nri

            for i in range(total_for_course):
                apaar_counter += 17
                apaar_id = f"{apaar_counter:012d}"
                
                # Determine quota
                if i < num_regular:
                    quota = "Regular"
                    foreign_national = False
                    oci_status = False
                    nationality = "Indian"
                elif i < num_regular + num_supernumerary:
                    quota = "Supernumerary"
                    foreign_national = False
                    oci_status = False
                    nationality = "Indian"
                else:
                    quota = "NRI"
                    oci_status = random.choice([True, False])
                    foreign_national = random.choice([True, False])
                    nationality = "American" if foreign_national else "Indian"

                fname = random.choice(FIRST_NAMES)
                lname = random.choice(LAST_NAMES)
                name = f"{fname} {lname}"
                gender = random.choice(["Male", "Female", "Male", "Female", "Other"])
                
                # DOB between 2002 and 2006
                birth_year = random.randint(2002, 2006)
                birth_month = random.randint(1, 12)
                birth_day = random.randint(1, 28)
                dob = f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

                cat = random.choices(categories, weights=cat_weights)[0]
                adm_year = 2024
                adm_date = f"{adm_year}-08-{random.randint(1, 25):02d}"
                year_of_study = 2026 - adm_year + 1

                student_id = f"{inst.aicte_code[-3:]}-{course.branch_name[:2].upper()}-{adm_year % 100}{i+1:03d}"
                consent_flag = random.random() > 0.12  # ~88% consent given

                student = Student(
                    institution_id=inst.id,
                    course_id=course.id,
                    apaar_id=apaar_id,
                    student_id=student_id,
                    name=name,
                    dob=dob,
                    gender=gender,
                    course=course.course_name,
                    branch=course.branch_name,
                    year_of_study=year_of_study,
                    admission_date=adm_date,
                    category=cat,
                    quota=quota,
                    oci_status=oci_status,
                    foreign_national=foreign_national,
                    nationality=nationality,
                    consent_flag=consent_flag,
                    verification_status="Verified"
                )
                db.add(student)
                student_records.append(student)

    db.commit()

    # 4. Inject Deliberate Anomaly Records for Demonstration
    # Anomaly A: Internal Duplicate in IIT Delhi (Institution 1)
    dup_apaar = "889911223344"
    dup_student_1 = Student(
        institution_id=created_institutions[0].id,
        apaar_id=dup_apaar,
        student_id="IITD-CS-24098",
        name="Abhishek Verma",
        dob="2003-05-14",
        gender="Male",
        course="B.Tech",
        branch="Computer Science and Engineering",
        year_of_study=1,
        admission_date="2024-08-10",
        category="General",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    dup_student_2 = Student(
        institution_id=created_institutions[0].id,
        apaar_id=dup_apaar,  # SAME APAAR!
        student_id="IITD-CS-24099",
        name="Abhishek Verma (Duplicate Entry)",
        dob="2003-05-14",
        gender="Male",
        course="B.Tech",
        branch="Computer Science and Engineering",
        year_of_study=1,
        admission_date="2024-08-10",
        category="General",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    db.add(dup_student_1)
    db.add(dup_student_2)

    # Anomaly B: Cross-Institution Duplicate between IIT Bombay and DTU
    cross_apaar = "772233445566"
    cross_student_1 = Student(
        institution_id=created_institutions[1].id,  # IIT Bombay
        apaar_id=cross_apaar,
        student_id="IITB-CS-24077",
        name="Pooja Kulkarni",
        dob="2004-03-22",
        gender="Female",
        course="B.Tech",
        branch="Computer Science and Engineering",
        year_of_study=1,
        admission_date="2024-08-12",
        category="General",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    cross_student_2 = Student(
        institution_id=created_institutions[7].id,  # DTU
        apaar_id=cross_apaar,  # SAME APAAR in different institution!
        student_id="DTU-SE-24088",
        name="Pooja Kulkarni",
        dob="2004-03-22",
        gender="Female",
        course="B.Tech",
        branch="Software Engineering",
        year_of_study=1,
        admission_date="2024-08-14",
        category="General",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    db.add(cross_student_1)
    db.add(cross_student_2)

    # Anomaly C: Invalid APAAR ID format (< 12 digits)
    invalid_format_student = Student(
        institution_id=created_institutions[2].id,  # Anna University
        apaar_id="445566",  # ONLY 6 DIGITS!
        student_id="AU-IT-24091",
        name="Karthik Subramanian",
        dob="2003-11-09",
        gender="Male",
        course="B.Tech",
        branch="Information Technology",
        year_of_study=1,
        admission_date="2024-08-05",
        category="OBC",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    db.add(invalid_format_student)

    # Anomaly D: Citizenship mismatch (Foreign National flag = True, but nationality = Indian)
    citizen_mismatch_student = Student(
        institution_id=created_institutions[6].id,  # RVCE
        apaar_id="665544332211",
        student_id="RVCE-CS-24095",
        name="Rohan Narang",
        dob="2004-01-18",
        gender="Male",
        course="B.Tech",
        branch="Computer Science and Engineering",
        year_of_study=1,
        admission_date="2024-08-10",
        category="General",
        quota="Regular",
        foreign_national=True,  # Inconsistent!
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    db.add(citizen_mismatch_student)

    # Anomaly E: DOB sanity error (student age under 12)
    dob_error_student = Student(
        institution_id=created_institutions[3].id,  # COEP
        apaar_id="554433221100",
        student_id="COEP-CE-24099",
        name="Aditya Child Prodigy",
        dob="2016-09-12",  # Only 10 years old!
        gender="Male",
        course="B.Tech",
        branch="Computer Engineering",
        year_of_study=1,
        admission_date="2024-08-01",
        category="General",
        quota="Regular",
        nationality="Indian",
        consent_flag=True,
        verification_status="Pending"
    )
    db.add(dob_error_student)

    db.commit()

    # 5. Run initial validation audit and anomaly calculation
    print("[SEEDER] Executing validation rules and anomaly calculations...")
    validation_service.run_full_validation_audit(db)
    anomaly_service.calculate_anomalies(db)

    # 6. Seed initial audit log entries
    initial_log = AuditLog(
        user_email="admin@aicte.gov.in",
        user_role="aicte_admin",
        action="SYSTEM_INITIALIZE_AND_SEED",
        entity="System",
        entity_id="AICTE-2026",
        details="Platform initialized with 8 institutions and 500+ student records for SIH 26263",
        ip_address="127.0.0.1"
    )
    db.add(initial_log)
    db.commit()

    total_s = db.query(Student).count()
    total_f = db.query(ValidationFlag).count()
    print(f"[SEEDER] Successfully seeded {len(created_institutions)} institutions, {total_s} students, generated {total_f} validation flags.")
