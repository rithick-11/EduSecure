from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User, AuditLog
from schemas import AuditLogOut
from auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/logs", response_model=list[AuditLogOut])
def get_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Admin sees all logs; others see only their own
    query = db.query(AuditLog)
    if user.role != "administrator":
        query = query.filter(AuditLog.user_email == user.email)
    return query.order_by(AuditLog.timestamp.desc()).limit(200).all()
