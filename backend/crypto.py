"""
BFV homomorphic encryption wrapper.

In production this uses Pyfhel.  When Pyfhel is not installed (e.g. local
dev on Python 3.14 where the C++ extension can't build) we fall back to a
*simulation* that stores plaintext values inside the "ciphertext" blobs.
The API surface stays the same so every route works identically.
"""

import pickle
import os
import struct
import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# ── Check if Pyfhel is available ──────────────────────────────────────
try:
    from Pyfhel import Pyfhel, PyCtxt
    HAS_PYFHEL = True
except ImportError:
    HAS_PYFHEL = False
    print("[crypto] Pyfhel not available – using simulated (DEV) encryption")

# ── BFV parameters (IEEE 2025 reference) ──────────────────────────────
BFV_PARAMS = {
    "scheme": "BFV",
    "n": 16384,
    "t": 1032193,
    "sec": 128,
}


def _derive_aes_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=480_000)
    return kdf.derive(password.encode())


# ======================================================================
#  SIMULATED (DEV) helpers – used when Pyfhel is not installed
# ======================================================================
def _sim_encrypt_int(value: int) -> bytes:
    """Wrap an int in a tiny envelope so we can round-trip it."""
    return struct.pack("<q", value)


def _sim_decrypt_int(blob: bytes) -> int:
    return struct.unpack("<q", blob)[0]


# ======================================================================
#  Key generation
# ======================================================================
def generate_keys(password: str) -> dict:
    salt = os.urandom(16)
    aes_key = _derive_aes_key(password, salt)
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)

    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.keyGen()
        he.relinKeyGen()
        pub = he.to_bytes_public_key()
        priv = he.to_bytes_secret_key()
        relin = he.to_bytes_relin_key()
    else:
        # Simulated keys – random bytes so the DB columns stay non-empty
        pub = os.urandom(64)
        priv = os.urandom(64)
        relin = os.urandom(64)

    priv_enc = nonce + aesgcm.encrypt(nonce, priv, None)

    return {
        "public_key": pub,
        "private_key_enc": priv_enc,
        "relin_key": relin,
        "aes_salt": salt,
    }


# ======================================================================
#  Encrypt / Decrypt
# ======================================================================
def encrypt_values(values: list, public_key: bytes, relin_key: bytes) -> bytes:
    arr = np.array(values, dtype=np.int64)
    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(public_key)
        he.from_bytes_relin_key(relin_key)
        cts = [he.encryptInt(np.array([v], dtype=np.int64)).to_bytes() for v in arr]
    else:
        cts = [_sim_encrypt_int(int(v)) for v in arr]
    return pickle.dumps(cts)


def decrypt_values(
    ciphertext_blob: bytes,
    encrypted_private_key: bytes,
    password: str,
    aes_salt: bytes,
    public_key: bytes,
    relin_key: bytes,
) -> list:
    aes_key = _derive_aes_key(password, aes_salt)
    aesgcm = AESGCM(aes_key)
    nonce = encrypted_private_key[:12]
    priv_bytes = aesgcm.decrypt(nonce, encrypted_private_key[12:], None)

    ct_list = pickle.loads(ciphertext_blob)

    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(public_key)
        he.from_bytes_secret_key(priv_bytes)
        he.from_bytes_relin_key(relin_key)
        results = []
        for ct_bytes in ct_list:
            ct = PyCtxt(pyfhel=he)
            ct.from_bytes(ct_bytes)
            results.append(int(he.decryptInt(ct)[0]))
    else:
        results = [_sim_decrypt_int(b) for b in ct_list]
    return results


# ======================================================================
#  Homomorphic operations
# ======================================================================
def homomorphic_add(blob_a: bytes, blob_b: bytes, pub: bytes, relin: bytes) -> bytes:
    list_a = pickle.loads(blob_a)
    list_b = pickle.loads(blob_b)
    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(pub)
        he.from_bytes_relin_key(relin)
        results = []
        for a_b, b_b in zip(list_a, list_b):
            ct_a = PyCtxt(pyfhel=he); ct_a.from_bytes(a_b)
            ct_b = PyCtxt(pyfhel=he); ct_b.from_bytes(b_b)
            results.append((ct_a + ct_b).to_bytes())
    else:
        results = [_sim_encrypt_int(_sim_decrypt_int(a) + _sim_decrypt_int(b)) for a, b in zip(list_a, list_b)]
    return pickle.dumps(results)


def homomorphic_scalar_multiply(blob: bytes, scalar: int, pub: bytes, relin: bytes) -> bytes:
    ct_list = pickle.loads(blob)
    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(pub)
        he.from_bytes_relin_key(relin)
        results = []
        for ct_bytes in ct_list:
            ct = PyCtxt(pyfhel=he); ct.from_bytes(ct_bytes)
            ct_r = ct * scalar
            he.relinearize(ct_r)
            results.append(ct_r.to_bytes())
    else:
        results = [_sim_encrypt_int(_sim_decrypt_int(b) * scalar) for b in ct_list]
    return pickle.dumps(results)


def homomorphic_sum(blob: bytes, pub: bytes, relin: bytes) -> bytes:
    ct_list = pickle.loads(blob)
    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(pub)
        he.from_bytes_relin_key(relin)
        acc = PyCtxt(pyfhel=he); acc.from_bytes(ct_list[0])
        for ct_bytes in ct_list[1:]:
            ct = PyCtxt(pyfhel=he); ct.from_bytes(ct_bytes)
            acc = acc + ct
        return pickle.dumps([acc.to_bytes()])
    else:
        total = sum(_sim_decrypt_int(b) for b in ct_list)
        return pickle.dumps([_sim_encrypt_int(total)])


def homomorphic_scalar_subtract(blob: bytes, scalar: int, pub: bytes, relin: bytes) -> bytes:
    ct_list = pickle.loads(blob)
    if HAS_PYFHEL:
        he = Pyfhel()
        he.contextGen(**BFV_PARAMS)
        he.from_bytes_public_key(pub)
        he.from_bytes_relin_key(relin)
        results = []
        for ct_bytes in ct_list:
            ct = PyCtxt(pyfhel=he); ct.from_bytes(ct_bytes)
            ct_r = ct - scalar
            results.append(ct_r.to_bytes())
    else:
        results = [_sim_encrypt_int(_sim_decrypt_int(b) - scalar) for b in ct_list]
    return pickle.dumps(results)
