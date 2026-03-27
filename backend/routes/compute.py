import time
import pickle
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, EncryptionKey, EncryptedFile, Computation, AuditLog
from schemas import ComputeRequest, ComputeOut, DecryptRequest, DecryptResponse
from auth import get_current_user
from crypto import (
    homomorphic_add,
    homomorphic_scalar_multiply,
    homomorphic_sum,
    decrypt_values,
)

router = APIRouter(prefix="/compute", tags=["Homomorphic Computation"])


@router.post("/", response_model=ComputeOut, status_code=201)
def run_computation(
    body: ComputeRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id, EncryptionKey.status == "active").first()
    if not ek:
        raise HTTPException(status_code=400, detail="No active encryption keys")

    files = db.query(EncryptedFile).filter(
        EncryptedFile.id.in_(body.input_file_ids),
        EncryptedFile.user_id == user.id,
    ).all()
    if len(files) != len(body.input_file_ids):
        raise HTTPException(status_code=404, detail="One or more files not found")

    start = time.perf_counter()
    op = body.operation.lower()

    try:
        if op == "addition":
            if len(files) < 2:
                raise HTTPException(status_code=400, detail="Addition requires at least 2 files")
            result_blob = files[0].ciphertext_blob
            for f in files[1:]:
                result_blob = homomorphic_add(result_blob, f.ciphertext_blob, ek.public_key, ek.relin_key)

        elif op == "scalar_multiply":
            scalar = int(body.parameters.get("scalar", 2))
            result_blob = homomorphic_scalar_multiply(files[0].ciphertext_blob, scalar, ek.public_key, ek.relin_key)

        elif op in ("summation", "sum"):
            result_blob = homomorphic_sum(files[0].ciphertext_blob, ek.public_key, ek.relin_key)

        elif op == "average":
            sum_blob = homomorphic_sum(files[0].ciphertext_blob, ek.public_key, ek.relin_key)
            count = len(pickle.loads(files[0].ciphertext_blob))
            # Cannot do true division on BFV integers — store sum and count for client-side division
            result_blob = sum_blob
            body.parameters["count"] = count

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported operation: {op}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")

    duration = int((time.perf_counter() - start) * 1000)

    # Store result as a virtual encrypted file
    result_file = EncryptedFile(
        user_id=user.id,
        filename=f"result_{op}_{int(time.time())}.enc",
        data_type="result",
        row_count=0,
        column_names=[],
        ciphertext_blob=result_blob,
        encrypted_size=len(result_blob),
    )
    db.add(result_file)
    db.flush()

    comp = Computation(
        user_id=user.id,
        operation=op,
        input_file_ids=body.input_file_ids,
        parameters=body.parameters,
        result_file_id=result_file.id,
        status="completed",
        duration_ms=duration,
    )
    db.add(comp)
    db.add(AuditLog(
        user_email=user.email, role=user.role,
        action=f"compute_{op}", resource_type="computation",
        ip=request.client.host,
    ))
    db.commit()
    db.refresh(comp)
    return comp


@router.get("/history", response_model=list[ComputeOut])
def computation_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Computation)
        .filter(Computation.user_id == user.id)
        .order_by(Computation.created_at.desc())
        .all()
    )


@router.post("/{comp_id}/decrypt", response_model=DecryptResponse)
def decrypt_result(
    comp_id: int,
    body: DecryptRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comp = db.query(Computation).filter(Computation.id == comp_id, Computation.user_id == user.id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Computation not found")
    if not comp.result_file_id:
        raise HTTPException(status_code=400, detail="No result to decrypt")

    ek = db.query(EncryptionKey).filter(EncryptionKey.user_id == user.id).first()
    if not ek:
        raise HTTPException(status_code=400, detail="No encryption keys found")

    result_file = db.query(EncryptedFile).filter(EncryptedFile.id == comp.result_file_id).first()
    if not result_file:
        raise HTTPException(status_code=404, detail="Result file missing")

    # Extract salt (first 16 bytes) from stored private key blob
    stored = ek.private_key_encrypted
    aes_salt = stored[:16]
    enc_priv = stored[16:]

    try:
        values = decrypt_values(
            result_file.ciphertext_blob, enc_priv, body.password,
            aes_salt, ek.public_key, ek.relin_key,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Decryption failed — wrong password?")

    db.add(AuditLog(
        user_email=user.email, role=user.role,
        action="decrypt_result", resource_type="computation",
        resource_id=str(comp_id), ip=request.client.host,
    ))
    db.commit()

    return DecryptResponse(computation_id=comp.id, operation=comp.operation, result_values=values)
