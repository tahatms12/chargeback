import base64
import hashlib
import hmac
from urllib.parse import urlparse

import jwt
from fastapi import HTTPException

from app.core.config import settings


def verify_shopify_session_token(session_token: str):
    try:
        payload = jwt.decode(
            session_token,
            settings.SHOPIFY_API_SECRET,
            algorithms=["HS256"],
            audience=settings.SHOPIFY_API_KEY,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session token expired")
    except jwt.InvalidTokenError as exc:
        detail = "Invalid audience" if "audience" in str(exc).lower() else "Invalid token"
        raise HTTPException(status_code=401, detail=detail)

    dest = payload.get("dest")
    sub = payload.get("sub")
    if not dest or not sub:
        raise HTTPException(status_code=401, detail="Missing required claims")
    host = urlparse(dest).hostname or ""
    if not host.endswith(".myshopify.com"):
        raise HTTPException(status_code=401, detail="Invalid shop in token")
    return {"shop": host, "user_id": sub}


def verify_shopify_hmac(params, secret: str) -> bool:
    data = {k: v for k, v in params.items() if k != "hmac"}
    message = "&".join(f"{k}={v}" for k, v in sorted(data.items()))
    digest = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, params.get("hmac", ""))


def verify_webhook_hmac(body: bytes, hmac_header: str) -> bool:
    if not hmac_header:
        return False
    digest = hmac.new(settings.SHOPIFY_API_SECRET.encode(), body, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode()
    return hmac.compare_digest(expected, hmac_header)


def _dev_context():
    import os
    if os.environ.get("APP_ENV", settings.APP_ENV) != "development":
        raise HTTPException(status_code=401, detail="dev-session disabled")
    return {"shop": "dev-store.myshopify.com", "role": "owner"}


def create_jwt_token(payload):
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
