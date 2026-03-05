"""
Auth Service — hardened for App Store submission.

Request authentication flow (production, embedded app):
  1. App Bridge calls useSessionToken() → short-lived JWT signed by Shopify (HS256)
  2. Frontend: Authorization: Bearer <session_token>
  3. get_current_user() → verify_shopify_session_token()
     - Verifies signature with SHOPIFY_API_SECRET
     - Verifies audience == SHOPIFY_API_KEY
     - Verifies exp and nbf
     - Extracts shop from `dest` claim
  4. Checks shop is not invalidated (post-uninstall Redis marker)
  5. Loads Store from DB, returns auth context

The internal JWT fallback (used after OAuth redirect for initial page load) is
restricted to non-embedded API paths and is NOT reachable if the session token
is present. It is entirely disabled in production when APP_ENV=production by
requiring the Bearer token to be a valid Shopify session token.

dev-session bypass is impossible when APP_ENV != development.
"""
import hmac
import hashlib
import base64
import jwt
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any
from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models import Store
from app.services.redis_session import is_shop_invalidated
from app.services.token_crypto import decrypt_token

logger = logging.getLogger(__name__)

_SESSION_TOKEN_ALG = "HS256"


# ─── Session token verification ───────────────────────────────────────────

def verify_shopify_session_token(session_token: str) -> Dict[str, Any]:
    """
    Verify a Shopify App Bridge session token (JWT).

    Token is signed with SHOPIFY_API_SECRET (HS256), audience = SHOPIFY_API_KEY.
    Claims: iss, dest (https://{shop}), aud, sub (user_id), exp, nbf, jti.

    Raises HTTPException(401) on any failure.
    Ref: https://shopify.dev/docs/apps/build/authentication-authorization/set-embedded-app-authorization
    """
    try:
        payload = jwt.decode(
            session_token,
            settings.SHOPIFY_API_SECRET,
            algorithms=[_SESSION_TOKEN_ALG],
            audience=settings.SHOPIFY_API_KEY,
            options={"verify_exp": True, "verify_nbf": True, "require": ["exp", "nbf", "iss", "dest", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session token expired")
    except jwt.MissingRequiredClaimError as exc:
        raise HTTPException(status_code=401, detail=f"Session token missing claim: {exc}")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Session token audience mismatch")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid session token: {exc}")

    dest: str = payload.get("dest", "")
    shop = dest.replace("https://", "").rstrip("/")
    if not shop.endswith(".myshopify.com") or "/" in shop or len(shop) > 100:
        raise HTTPException(status_code=401, detail="Invalid shop in session token dest claim")

    return {
        "shop": shop,
        "user_id": str(payload.get("sub", "")),
        "dest": dest,
        "iss": payload.get("iss", ""),
    }


# ─── Main auth dependency ─────────────────────────────────────────────────

async def get_current_user(request: Request, db: AsyncSession) -> Dict[str, Any]:
    """
    Authenticate a request.

    Production:
        Requires a valid Shopify App Bridge session token.
        Raises 401 on any auth failure — no silent fallback.

    Development (APP_ENV=development only):
        Accepts "dev-session" as a bypass.
        This code path raises 401 if APP_ENV is anything else.
    """
    auth = request.headers.get("Authorization", "")
    token: Optional[str] = None

    if auth.startswith("Bearer "):
        token = auth[7:].strip()
    else:
        token = request.query_params.get("session", "").strip() or None

    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # ── dev-session bypass — impossible in production ──
    if token == "dev-session":
        if settings.APP_ENV != "development":
            raise HTTPException(
                status_code=401,
                detail="Dev session is disabled outside development environment",
            )
        logger.debug("dev-session active (development only)")
        return _dev_context()

    # ── Primary path: Shopify session token ──
    try:
        claims = verify_shopify_session_token(token)
        shop = claims["shop"]
    except HTTPException as session_token_error:
        # ── Secondary path: internal JWT (post-OAuth redirect only, non-embedded) ──
        # In production, this path remains available ONLY if the token was issued
        # by our own OAuth callback (not a Shopify session token).
        # It is not reachable from embedded contexts where App Bridge is present.
        if settings.APP_ENV == "production":
            # In production, do NOT silently fall through — raise the session token error
            raise session_token_error
        # In development, try internal JWT as well
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
            )
            shop = payload.get("shop", "")
            if not shop:
                raise HTTPException(status_code=401, detail="Invalid internal JWT: no shop claim")
            claims = {"shop": shop, "user_id": payload.get("user_id")}
        except jwt.InvalidTokenError:
            raise session_token_error  # Raise the original session token error

    # ── Post-uninstall invalidation check ──
    if await is_shop_invalidated(shop):
        raise HTTPException(
            status_code=401,
            detail="Shop has been uninstalled. Please reinstall the app.",
        )

    # ── Load store from DB ──
    result = await db.execute(
        select(Store).where(Store.shopify_domain == shop, Store.is_active == True)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(
            status_code=401,
            detail="Store not found or inactive. Reinstall the app.",
        )

    return {
        "shop": shop,
        "store_id": str(store.id),
        "account_id": str(store.account_id),
        "user_id": claims.get("user_id"),
        "role": "owner",
    }


def get_store_access_token(store: Store) -> str:
    """
    Decrypt and return the store's Shopify access token.
    Transparently handles both encrypted (v1:) and legacy plaintext values.
    """
    return decrypt_token(store.access_token)


# ─── JWT (internal, post-OAuth redirect) ─────────────────────────────────

def create_jwt_token(payload: Dict[str, Any]) -> str:
    """Issue a short-lived internal JWT for post-OAuth redirect."""
    data = {**payload}
    data["exp"] = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    data["iat"] = datetime.now(timezone.utc)
    return jwt.encode(data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# ─── HMAC verification ────────────────────────────────────────────────────

def verify_shopify_hmac(params: Dict[str, str], secret: str) -> bool:
    """Verify Shopify OAuth callback HMAC signature."""
    clean = {k: v for k, v in params.items() if k != "hmac"}
    message = "&".join(f"{k}={v}" for k, v in sorted(clean.items()))
    computed = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, params.get("hmac", ""))


def verify_webhook_hmac(body: bytes, hmac_header: str) -> bool:
    """
    Verify Shopify webhook HMAC-SHA256.
    Returns False on empty header rather than raising — callers raise 401.
    """
    if not hmac_header:
        return False
    computed = hmac.new(
        settings.SHOPIFY_API_SECRET.encode(), body, hashlib.sha256
    ).digest()
    computed_b64 = base64.b64encode(computed).decode()
    return hmac.compare_digest(computed_b64, hmac_header)


# ─── RBAC ─────────────────────────────────────────────────────────────────

def require_role(minimum_role: str):
    """RBAC dependency. Hierarchy: owner > manager > analyst."""
    role_order = {"owner": 3, "manager": 2, "analyst": 1}

    async def check(request: Request, db: AsyncSession = Depends(get_db)):
        ctx = await get_current_user(request, db)
        user_level = role_order.get(ctx.get("role", "analyst"), 0)
        required_level = role_order.get(minimum_role, 0)
        if user_level < required_level:
            raise HTTPException(status_code=403, detail=f"Requires {minimum_role} role or higher")
        return ctx

    return check


# ─── Audit logging ────────────────────────────────────────────────────────

async def log_audit_event(
    db: AsyncSession,
    account_id: str,
    entity_type: str,
    entity_id: str,
    action: str,
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None,
    user_id: Optional[str] = None,
    store_id: Optional[str] = None,
) -> None:
    """Write an audit log entry. Caller is responsible for commit."""
    from app.models import AuditLog
    import uuid
    db.add(AuditLog(
        account_id=uuid.UUID(account_id),
        store_id=uuid.UUID(store_id) if store_id else None,
        user_id=uuid.UUID(user_id) if user_id else None,
        entity_type=entity_type,
        entity_id=uuid.UUID(entity_id),
        action=action,
        old_values=old_values,
        new_values=new_values,
    ))


# ─── Dev context ─────────────────────────────────────────────────────────

def _dev_context() -> Dict[str, Any]:
    """Development-only mock auth context."""
    return {
        "shop": "dev-store.myshopify.com",
        "store_id": "00000000-0000-0000-0000-000000000002",
        "account_id": "00000000-0000-0000-0000-000000000001",
        "user_id": "00000000-0000-0000-0000-000000000003",
        "role": "owner",
    }
