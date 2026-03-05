"""
ChargeGuard API — FastAPI Application
Production-ready Shopify chargeback tracker backend
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import (
    auth, disputes, evidence, documents,
    checklists, events, analytics, templates,
    billing, webhooks, export, ai_module
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ChargeGuard API",
    description="Shopify chargeback deadline and evidence prep tracker",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/redoc" if settings.APP_ENV == "development" else None,
)

# ─── Middleware ────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    return response

# ─── Routes ───────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(disputes.router, prefix="/api/disputes", tags=["disputes"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["evidence"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(checklists.router, prefix="/api/checklists", tags=["checklists"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(ai_module.router, prefix="/api/ai", tags=["ai"])

# ─── Health ────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    return {"app": "ChargeGuard API", "docs": "/docs"}

# ─── Error Handlers ────────────────────────────────────────────

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Not found"})

@app.exception_handler(500)
async def internal_error(request: Request, exc):
    logger.error(f"Internal error: {exc}")
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
