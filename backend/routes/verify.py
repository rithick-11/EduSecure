import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import os

from database import get_db
from models import User, EncryptedFile, EncryptionKey, AuditLog
from auth import get_current_user, verify_password
from crypto import homomorphic_scalar_subtract, decrypt_values, BFV_PARAMS

router = APIRouter(prefix="/verify", tags=["Instant Verification"])

# Stable Fernet key for dev mode to ensure tokens survive server restarts
# In production, this MUST be deeply secured in .env!
DEFAULT_FERNET_KEY = b'eXQxNThnN1pKaEZIYjh1NDJwNWY3dndSdlZONUdXZEE='
FERNET_SECRET = os.getenv("FERNET_SECRET", DEFAULT_FERNET_KEY)
fernet = Fernet(FERNET_SECRET)

class GenerateLinkRequest(BaseModel):
    file_id: int
    password: str

class VerifyEligibilityRequest(BaseModel):
    token: str
    column_name: str
    required_score: int

@router.post("/generate-link")
def generate_link(req: GenerateLinkRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    file = db.query(EncryptedFile).filter(EncryptedFile.id == req.file_id, EncryptedFile.user_id == user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id, EncryptionKey.status == "active").first()
    if not ek:
        raise HTTPException(status_code=400, detail="Encryption keys not found")
        
    # Create token payload
    payload = {
        "user_id": user.id,
        "file_id": file.id,
        "password": req.password,
        "exp": (datetime.utcnow() + timedelta(days=7)).timestamp()
    }
    
    token = fernet.encrypt(json.dumps(payload).encode()).decode()
    
    db.add(AuditLog(
        user_email=user.email,
        role=user.role,
        action="generate_verify_link",
        resource_type="file",
        resource_id=str(file.id)
    ))
    db.commit()
    
    return {"token": token}

@router.post("/check-eligibility")
def check_eligibility(req: VerifyEligibilityRequest, db: Session = Depends(get_db)):
    try:
        decrypted_payload = fernet.decrypt(req.token.encode()).decode()
        payload = json.loads(decrypted_payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    if datetime.utcnow().timestamp() > payload.get("exp", 0):
        raise HTTPException(status_code=400, detail="Verification token has expired")
        
    user_id = payload["user_id"]
    file_id = payload["file_id"]
    password = payload["password"]
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    file = db.query(EncryptedFile).filter(EncryptedFile.id == file_id, EncryptedFile.user_id == user_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user_id, EncryptionKey.status == "active").first()
    if not ek:
        raise HTTPException(status_code=400, detail="Keys not found")
        
    if req.column_name not in file.column_names:
        raise HTTPException(status_code=400, detail=f"Column '{req.column_name}' not found in this file.")
        
    try:
        col_idx = file.column_names.index(req.column_name)
    except ValueError:
        raise HTTPException(status_code=400, detail="Column not found")
        
    stored = ek.private_key_encrypted
    aes_salt = stored[:16]
    enc_priv = stored[16:]
    
    # Perform homomorphic subtraction: Encrypted_Score - Required_Score
    diff_blob = homomorphic_scalar_subtract(file.ciphertext_blob, req.required_score, ek.public_key, ek.relin_key)
    
    try:
        # Decrypt the difference
        diff_results = decrypt_values(diff_blob, enc_priv, password, aes_salt, ek.public_key, ek.relin_key)
    except Exception:
        raise HTTPException(status_code=400, detail="Verification failed due to encryption mismatch.")
        
    num_cols = len(file.column_names)
    modulus = BFV_PARAMS["t"]
    half_mod = modulus // 2
    
    is_eligible = True if file.row_count > 0 else False
    for row in range(file.row_count):
        idx = row * num_cols + col_idx
        if idx < len(diff_results):
            val = diff_results[idx]
            # In modulo arithmetic (Pyfhel), negative numbers wrap around (val > half_mod).
            # In the dummy simulated encryption (Windows), negative numbers are just val < 0.
            # Thus, it's ONLY a positive match if 0 <= val <= half_mod.
            # To mandate ALL rows pass, if we find any that fail, they are NOT ELIGIBLE.
            if not (0 <= val <= half_mod):
                is_eligible = False
                break
                
    db.add(AuditLog(
        user_email=user.email,
        role="third_party_verifier",
        action="verified_eligibility",
        resource_type="file",
        resource_id=str(file.id)
    ))
    db.commit()
    
    return {"eligible": is_eligible, "column": req.column_name, "required": req.required_score}
