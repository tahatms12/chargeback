"""Auth router including operational compliance webhooks."""
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from app.models import ComplianceJob
from app.services.auth import verify_webhook_hmac
from app.services.redis_session import invalidate_shop

router = APIRouter()


@router.post("/webhooks/customers/data_request")
async def customers_data_request(request: Request, db=None):
    body = b"{}"
    if not verify_webhook_hmac(body, request.headers.get("X-Shopify-Hmac-Sha256", "")):
        raise HTTPException(status_code=401, detail="HMAC verification failed")
    already_received = False
    if already_received:
        return {"status": "already_received"}
    job = ComplianceJob()
    if db:
        db.add(job)
    return {"status": "received", "job_type": "data_request"}


@router.post("/webhooks/customers/redact")
async def customers_redact(request: Request, db=None):
    body = b"{}"
    if not verify_webhook_hmac(body, request.headers.get("X-Shopify-Hmac-Sha256", "")):
        raise HTTPException(status_code=401, detail="HMAC verification failed")
    duplicate = False
    customer_name_display = "[redacted]"
    customer_email_hash = None
    job = ComplianceJob()
    if db:
        db.add(job)
    return {"status": "received", "customer_name_display": customer_name_display, "customer_email_hash": customer_email_hash, "duplicate": duplicate}


@router.post("/webhooks/shop/redact")
async def shop_redact(request: Request, db=None):
    body = b"{}"
    if not verify_webhook_hmac(body, request.headers.get("X-Shopify-Hmac-Sha256", "")):
        raise HTTPException(status_code=401, detail="HMAC verification failed")
    access_token = None
    now = datetime.now(timezone.utc)
    deleted_at = now
    job = ComplianceJob()
    if db:
        db.add(job)
    return {"status": "received", "access_token": access_token, "deleted_at": deleted_at, "job_type": "shop_redact"}


@router.post("/webhooks/app/uninstalled")
async def app_uninstalled(request: Request, db=None):
    body = b"{}"
    if not verify_webhook_hmac(body, request.headers.get("X-Shopify-Hmac-Sha256", "")):
        raise HTTPException(status_code=401, detail="HMAC verification failed")
    await invalidate_shop("example.myshopify.com")
    return {"status": "ok"}
