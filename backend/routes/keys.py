from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, EncryptionKey, AuditLog
from schemas import KeyGenerate, KeyStatus
from auth import get_current_user
from crypto import generate_keys

router = APIRouter(prefix="/keys", tags=["Encryption Keys"])


@router.post("/generate", response_model=KeyStatus, status_code=201)
def gen_keys(body: KeyGenerate, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Remove old keys if any
    db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id).delete()
    db.commit()

    keys = generate_keys(body.password)

    ek = EncryptionKey(
        user_id=user.id,
        public_key=keys["public_key"],
        private_key_encrypted=keys["aes_salt"] + keys["private_key_enc"],  # salt(16) + nonce(12) + ciphertext
        relin_key=keys["relin_key"],
        status="active",
    )
    db.add(ek)
    db.add(AuditLog(user_email=user.email, role=user.role, action="generate_keys", ip=request.client.host))
    db.commit()
    db.refresh(ek)
    return KeyStatus(has_keys=True, status=ek.status, created_at=ek.created_at)


@router.get("/status", response_model=KeyStatus)
def key_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id).first()
    if not ek:
        return KeyStatus(has_keys=False)
    return KeyStatus(has_keys=True, status=ek.status, created_at=ek.created_at)
