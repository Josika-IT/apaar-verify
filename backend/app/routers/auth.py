from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Institution
from ..schemas import LoginRequest, Token, UserOut
from ..services.auth import verify_password, create_access_token, get_current_user
from ..services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact AICTE administrator."
        )

    # Optional captcha / OTP validation (accepts any mock or valid OTP)
    if request.otp and len(request.otp.strip()) != 6:
        raise HTTPException(status_code=400, detail="OTP must be 6 digits")

    # Fetch institution name if associated
    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "user_id": user.id,
            "institution_id": user.institution_id
        }
    )

    log_audit(
        db=db,
        action="USER_LOGIN",
        entity="Auth",
        entity_id=str(user.id),
        details=f"User logged in successfully with role '{user.role}'",
        user=user
    )

    user_out = UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        institution_name=inst_name,
        is_active=user.is_active
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inst_name = None
    if current_user.institution_id:
        inst = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
        if inst:
            inst_name = inst.name

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        institution_id=current_user.institution_id,
        institution_name=inst_name,
        is_active=current_user.is_active
    )

@router.post("/forgot-password-stub")
def forgot_password_stub(payload: dict):
    email = payload.get("email", "")
    return {
        "status": "success",
        "message": f"If an account exists with {email}, password reset instructions have been dispatched via AICTE secure portal."
    }
