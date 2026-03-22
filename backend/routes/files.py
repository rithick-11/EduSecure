import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, EncryptionKey, EncryptedFile, AuditLog
from schemas import FileOut
from auth import get_current_user
from crypto import encrypt_values

router = APIRouter(prefix="/files", tags=["Encrypted Files"])


@router.post("/upload", response_model=FileOut, status_code=201)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    data_type: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check keys exist
    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id, EncryptionKey.status == "active").first()
    if not ek:
        raise HTTPException(status_code=400, detail="Generate encryption keys first")

    # Read CSV/JSON
    content = await file.read()
    try:
        if file.filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to parse file. Provide CSV or JSON.")

    # Flatten numeric columns to a list of ints
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    if not numeric_cols:
        raise HTTPException(status_code=400, detail="File contains no numeric columns to encrypt")

    values = df[numeric_cols].values.flatten().astype(int).tolist()
    blob = encrypt_values(values, ek.public_key, ek.relin_key)

    ef = EncryptedFile(
        user_id=user.id,
        filename=file.filename,
        data_type=data_type,
        row_count=len(df),
        column_names=numeric_cols,
        ciphertext_blob=blob,
        encrypted_size=len(blob),
    )
    db.add(ef)
    db.add(AuditLog(user_email=user.email, role=user.role, action="upload_file",
                     resource_type="file", resource_id=file.filename, ip=request.client.host))
    db.commit()
    db.refresh(ef)
    return ef


@router.get("/", response_model=list[FileOut])
def list_files(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(EncryptedFile).filter(EncryptedFile.user_id == user.id).order_by(EncryptedFile.created_at.desc()).all()


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: int, request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ef = db.query(EncryptedFile).filter(EncryptedFile.id == file_id, EncryptedFile.user_id == user.id).first()
    if not ef:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(ef)
    db.add(AuditLog(user_email=user.email, role=user.role, action="delete_file",
                     resource_type="file", resource_id=str(file_id), ip=request.client.host))
    db.commit()
