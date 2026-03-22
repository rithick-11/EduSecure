from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, AuditLog
from schemas import UserRegister, UserLogin, Token, UserOut
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _log(db: Session, email: str, role: str, action: str, ip: str):
    db.add(AuditLog(user_email=email, role=role, action=action, ip=ip))
    db.commit()


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserRegister, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        institution=body.institution,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _log(db, user.email, user.role, "register", request.client.host)
    return user


@router.post("/login", response_model=Token)
def login(body: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})
    _log(db, user.email, user.role, "login", request.client.host)
    return {"access_token": token}
