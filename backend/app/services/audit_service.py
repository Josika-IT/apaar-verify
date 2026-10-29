from typing import Optional
from sqlalchemy.orm import Session
from ..models import AuditLog, User

def log_audit(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: str = "127.0.0.1",
    institution_id: Optional[int] = None
) -> AuditLog:
    user_email = user.email if user else "public_or_system"
    user_role = user.role if user else "public"
    user_id = user.id if user else None
    inst_id = institution_id or (user.institution_id if user else None)

    audit_entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        institution_id=inst_id,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_entry)
    db.commit()
    return audit_entry
