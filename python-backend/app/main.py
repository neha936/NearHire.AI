from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.config import settings
from app.api.health import router as health_router
from app.api.resume import router as resume_router
from app.api.recommendations import router as recommendations_router
from app.api.agent import router as agent_router


# ────────────────────────────────────────────────────────────────
# FastAPI App
# ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NearHire.AI — Python Backend",
    description="AI-powered backend for hyperlocal job discovery",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ────────────────────────────────────────────────────────────────
# CORS Configuration
# ────────────────────────────────────────────────────────────────

origins = [
    # Local Development
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",

    # Production Frontend
    "https://near-hire-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────────────────────────────────────
# Health Check
# ────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"], summary="Root Health Check")
async def root_health():
    return {
        "status": "ok",
        "service": "nearhire-python-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ────────────────────────────────────────────────────────────────
# API Routes
# ────────────────────────────────────────────────────────────────

app.include_router(health_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
