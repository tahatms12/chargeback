"""
Rate limiting middleware for ChargeGuard API.
Uses slowapi (Starlette-compatible limiter backed by Redis or memory).

Per-route policies:
  OAuth install/callback:  10/minute per IP  (prevent CSRF spray)
  Billing:                  5/minute per user (prevent billing abuse)
  Export:                  10/minute per user (ZIP generation is heavy)
  Upload:                  30/minute per user (document uploads)
  General CRUD:           120/minute per user (standard API)
  Webhooks:               exempt from user limits; protected by HMAC + payload size

Webhook note:
  Shopify retries webhooks on 5xx/timeout (up to 19 retries over 48h).
  Webhooks are NOT rate-limited by user. HMAC verification is the gate.
  A per-IP limit of 100/minute is applied at nginx level (see docker-compose comments).
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# Key function: use authenticated user identity when available, fall back to IP
def _key_func(request: Request) -> str:
    # After auth middleware runs, user context is in request.state
    user = getattr(request.state, "user", None)
    if user and user.get("account_id"):
        return f"account:{user['account_id']}"
    return get_remote_address(request)


limiter = Limiter(key_func=_key_func)

# Convenience decorators for route-specific limits
oauth_limit    = limiter.limit("10/minute", key_func=get_remote_address)
billing_limit  = limiter.limit("5/minute")
export_limit   = limiter.limit("10/minute")
upload_limit   = limiter.limit("30/minute")
api_limit      = limiter.limit("120/minute")
