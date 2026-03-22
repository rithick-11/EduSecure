from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)          # student | faculty | administrator
    institution = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    keys = relationship("EncryptionKey", back_populates="user", uselist=False)
    files = relationship("EncryptedFile", back_populates="user")
    computations = relationship("Computation", back_populates="user")


class EncryptionKey(Base):
    __tablename__ = "encryption_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    public_key = Column(LargeBinary, nullable=False)
    private_key_encrypted = Column(LargeBinary, nullable=False)   # AES-encrypted with user password
    relin_key = Column(LargeBinary, nullable=False)
    status = Column(String, default="active")   # active | revoked | expired
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="keys")


class EncryptedFile(Base):
    __tablename__ = "encrypted_files"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    data_type = Column(String, nullable=False)    # grades | gpa | research | records
    row_count = Column(Integer, default=0)
    column_names = Column(JSON, default=[])
    ciphertext_blob = Column(LargeBinary, nullable=False)   # pickled list of serialized ciphertexts
    encrypted_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="files")


class Computation(Base):
    __tablename__ = "computations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operation = Column(String, nullable=False)    # addition | scalar_multiply | summation | average | threshold | gpa
    input_file_ids = Column(JSON, default=[])
    parameters = Column(JSON, default={})
    result_file_id = Column(Integer, ForeignKey("encrypted_files.id"), nullable=True)
    status = Column(String, default="pending")    # pending | completed | failed
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="computations")
    result_file = relationship("EncryptedFile", foreign_keys=[result_file_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
