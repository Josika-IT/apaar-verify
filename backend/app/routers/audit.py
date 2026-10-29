from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AuditLog, User
from ..schemas import AuditLogOut
from ..services.auth import get_current_user, require_roles

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    action: Optional[str] = Query(None),
    entity: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles(["aicte_admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity:
        query = query.filter(AuditLog.entity.ilike(f"%{entity}%"))
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))

    logs = query.order_by(AuditLog.id.desc()).offset(skip).limit(limit).all()
    return logs
