from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

from database import init_db
from routes.auth import router as auth_router
from routes.keys import router as keys_router
from routes.files import router as files_router
from routes.compute import router as compute_router
from routes.audit import router as audit_router

# ── Rate limiter ──────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

# ── App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="EduSecure API",
    description="Secure educational data sharing with BFV homomorphic encryption",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(keys_router)
app.include_router(files_router)
app.include_router(compute_router)
app.include_router(audit_router)


# ── Startup ───────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "EduSecure API", "version": "1.0.0"}
