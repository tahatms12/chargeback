"""
Redis session backend for ChargeGuard.

Replaces Postgres Session table for ephemeral auth state.
The Postgres sessions table is retained for long-lived non-expiring records only (none currently).

Key scheme:
    oauth_state:{state}         → shop domain, TTL 10 min (CSRF protection)
    shop_invalidated:{shop}     → "1", TTL 48h (post-uninstall block)

TTL rationale:
    OAuth state: Shopify redirects back within seconds; 10 min is generous.
    Invalidation marker: covers the gap between uninstall and shop/redact arrival (48h).
"""
import json
import logging
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

_OAUTH_STATE_TTL = 600        # 10 minutes
_INVALIDATION_TTL = 172800    # 48 hours

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.close()
        _redis = None


# ─── OAuth CSRF state ─────────────────────────────────────────────────────

async def store_oauth_state(state: str, shop: str) -> None:
    """Store OAuth state → shop mapping. Expires in 10 minutes."""
    r = await get_redis()
    await r.set(f"oauth_state:{state}", shop, ex=_OAUTH_STATE_TTL)


async def consume_oauth_state(state: str) -> Optional[str]:
    """
    Retrieve and DELETE the OAuth state (single-use).
    Returns the shop domain or None if state is unknown/expired.
    """
    r = await get_redis()
    key = f"oauth_state:{state}"
    shop = await r.getdel(key)
    return shop


# ─── Shop invalidation (post-uninstall) ───────────────────────────────────

async def invalidate_shop(shop: str) -> None:
    """Mark a shop as invalidated. Any active session for this shop is rejected."""
    r = await get_redis()
    await r.set(f"shop_invalidated:{shop}", "1", ex=_INVALIDATION_TTL)


async def is_shop_invalidated(shop: str) -> bool:
    """Returns True if the shop has been recently uninstalled."""
    r = await get_redis()
    return bool(await r.exists(f"shop_invalidated:{shop}"))


async def clear_invalidation(shop: str) -> None:
    """Remove invalidation marker — called on successful reinstall."""
    r = await get_redis()
    await r.delete(f"shop_invalidated:{shop}")


# ─── Health check ─────────────────────────────────────────────────────────

async def redis_ping() -> bool:
    try:
        r = await get_redis()
        return await r.ping()
    except Exception as exc:
        logger.error(f"Redis ping failed: {exc}")
        return False
