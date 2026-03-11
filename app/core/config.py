import logging
import os
from dataclasses import dataclass, field
from typing import Optional

from app.services.token_crypto import validate_key_at_startup

logger = logging.getLogger(__name__)


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        logger.warning("Invalid %s=%r; using default %s", name, value, default)
        return default


def _env_optional(name: str, default: Optional[str]) -> Optional[str]:
    value = os.environ.get(name)
    if value is None:
        return default
    value = value.strip()
    return value or None


def _env_list(name: str, default: list[str]) -> list[str]:
    raw_value = os.environ.get(name)
    if raw_value is None:
        return default
    return [item.strip() for item in raw_value.split(",") if item.strip()]


@dataclass
class Settings:
    APP_ENV: str = os.environ.get("APP_ENV", "development")
    APP_SECRET_KEY: str = os.environ.get("APP_SECRET_KEY", "change-me")
    APP_URL: str = os.environ.get("APP_URL", "https://chargeguard.uplifttechnologies.pro")
    SHOPIFY_APP_URL: str = os.environ.get("SHOPIFY_APP_URL", "https://chargeguard.uplifttechnologies.pro")
    ALLOWED_ORIGINS: list[str] = field(
        default_factory=lambda: _env_list(
            "ALLOWED_ORIGINS",
            ["https://chargeguard.uplifttechnologies.pro", "https://admin.shopify.com"],
        )
    )

    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@postgres:5432/chargeguard"
    )
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://redis:6379/0")

    SHOPIFY_API_KEY: str = os.environ.get("SHOPIFY_API_KEY", "")
    SHOPIFY_API_SECRET: str = os.environ.get("SHOPIFY_API_SECRET", "")
    SHOPIFY_SCOPES: str = os.environ.get("SHOPIFY_SCOPES", "read_orders,read_customers")
    SHOPIFY_BILLING_RETURN_URL: str = os.environ.get("SHOPIFY_BILLING_RETURN_URL", "")

    TOKEN_ENCRYPTION_KEY: str = os.environ.get("TOKEN_ENCRYPTION_KEY", "")

    S3_BUCKET: str = os.environ.get("S3_BUCKET", "chargeguard-evidence")
    S3_REGION: str = os.environ.get("S3_REGION", "us-east-1")
    S3_ACCESS_KEY_ID: str = os.environ.get("S3_ACCESS_KEY_ID", "minioadmin")
    S3_SECRET_ACCESS_KEY: str = os.environ.get("S3_SECRET_ACCESS_KEY", "minioadmin")
    S3_ENDPOINT_URL: Optional[str] = _env_optional("S3_ENDPOINT_URL", "http://minio:9000")
    SIGNED_URL_EXPIRY_SECONDS: int = _env_int("SIGNED_URL_EXPIRY_SECONDS", 3600)

    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me-jwt-secret")
    JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_HOURS: int = _env_int("JWT_EXPIRY_HOURS", 2)

    STRIPE_ENABLED: bool = _env_bool("STRIPE_ENABLED", False)
    AI_MODULE_ENABLED: bool = _env_bool("AI_MODULE_ENABLED", False)
    MULTI_STORE_ENABLED: bool = _env_bool("MULTI_STORE_ENABLED", False)

    AI_PROVIDER: str = os.environ.get("AI_PROVIDER", "anthropic")
    OPENAI_API_KEY: Optional[str] = _env_optional("OPENAI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = _env_optional("ANTHROPIC_API_KEY", None)
    AI_TOKEN_CAP_PER_DISPUTE: int = _env_int("AI_TOKEN_CAP_PER_DISPUTE", 2000)
    AI_CACHE_TTL_HOURS: int = _env_int("AI_CACHE_TTL_HOURS", 24)

    DEADLINE_CHECK_INTERVAL_MINUTES: int = _env_int("DEADLINE_CHECK_INTERVAL_MINUTES", 60)
    STRIPE_SYNC_INTERVAL_MINUTES: int = _env_int("STRIPE_SYNC_INTERVAL_MINUTES", 30)

    BILLING_MODE: str = os.environ.get("BILLING_MODE", "simulation")

    def validate_for_production(self) -> None:
        errors = []

        if self.APP_ENV == "production":
            if not self.SHOPIFY_API_SECRET:
                errors.append("SHOPIFY_API_SECRET is required in production")
            if not self.TOKEN_ENCRYPTION_KEY:
                errors.append(
                    "TOKEN_ENCRYPTION_KEY is required in production. "
                    "Generate: python -c \"import secrets; print(secrets.token_hex(32))\""
                )
            if self.BILLING_MODE == "simulation":
                errors.append("BILLING_MODE=simulation is not allowed in production")
            if self.JWT_SECRET in ("change-me-jwt-secret", "change-me"):
                errors.append("JWT_SECRET must be changed from default in production")
            if self.APP_SECRET_KEY in ("change-me", "change-me-to-random-64-char-string"):
                errors.append("APP_SECRET_KEY must be changed from default in production")
        else:
            if not self.TOKEN_ENCRYPTION_KEY:
                logger.warning(
                    "TOKEN_ENCRYPTION_KEY not set — tokens will be stored plaintext in development. "
                    "Set this before production."
                )
            if not self.SHOPIFY_API_KEY:
                logger.warning("SHOPIFY_API_KEY not set — Shopify OAuth will not work")

        if errors:
            raise RuntimeError("Startup validation failed:\n" + "\n".join(f"  - {e}" for e in errors))

        if self.TOKEN_ENCRYPTION_KEY:
            validate_key_at_startup(self.APP_ENV)


settings = Settings()
