from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # student | faculty | administrator
    institution: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    institution: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Keys ──────────────────────────────────────────────────────────────
class KeyGenerate(BaseModel):
    password: str  # used to AES-encrypt the private key


class KeyStatus(BaseModel):
    has_keys: bool
    status: Optional[str] = None
    created_at: Optional[datetime] = None


# ── Files ─────────────────────────────────────────────────────────────
class FileOut(BaseModel):
    id: int
    filename: str
    data_type: str
    row_count: int
    column_names: list
    encrypted_size: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Compute ───────────────────────────────────────────────────────────
class ComputeRequest(BaseModel):
    operation: str  # addition | scalar_multiply | summation | average | threshold | gpa
    input_file_ids: List[int]
    parameters: Optional[dict] = {}


class ComputeOut(BaseModel):
    id: int
    operation: str
    input_file_ids: list
    parameters: Optional[dict] = {}
    result_file_id: Optional[int] = None
    status: str
    duration_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class DecryptRequest(BaseModel):
    password: str


class DecryptResponse(BaseModel):
    computation_id: int
    operation: str
    result_values: list


# ── Audit ─────────────────────────────────────────────────────────────
class AuditLogOut(BaseModel):
    id: int
    user_email: str
    role: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_files: int
    total_computations: int
    keys_active: bool
    recent_activity: list
