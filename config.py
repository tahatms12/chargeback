"""
Application configuration — all values from environment variables.
Pydantic validators raise on invalid/missing critical values.
Production validators are enforced when APP_ENV=production.
"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-me"
    APP_URL: str = "http://localhost:8000"
    SHOPIFY_APP_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://admin.shopify.com"]

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/chargeguard"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Shopify — SHOPIFY_API_SECRET stays in API container only, never web
    SHOPIFY_API_KEY: str = ""
    SHOPIFY_API_SECRET: str = ""
    SHOPIFY_SCOPES: str = "read_orders,read_customers"
    SHOPIFY_BILLING_RETURN_URL: str = ""

    # AES-256-GCM token encryption
    # Required in production. Generate: python -c "import secrets; print(secrets.token_hex(32))"
    TOKEN_ENCRYPTION_KEY: str = ""

    # S3 / MinIO
    S3_BUCKET: str = "chargeguard-evidence"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY_ID: str = "minioadmin"
    S3_SECRET_ACCESS_KEY: str = "minioadmin"
    S3_ENDPOINT_URL: Optional[str] = "http://localhost:9000"
    SIGNED_URL_EXPIRY_SECONDS: int = 3600

    # JWT (internal, post-OAuth redirect only; App Bridge session tokens preferred)
    JWT_SECRET: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 2

    # Feature flags
    STRIPE_ENABLED: bool = False
    AI_MODULE_ENABLED: bool = False
    MULTI_STORE_ENABLED: bool = False

    # AI
    AI_PROVIDER: str = "anthropic"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_TOKEN_CAP_PER_DISPUTE: int = 2000
    AI_CACHE_TTL_HOURS: int = 24

    # Worker
    DEADLINE_CHECK_INTERVAL_MINUTES: int = 60
    STRIPE_SYNC_INTERVAL_MINUTES: int = 30

    # Billing: simulation (dev) | shopify (production)
    BILLING_MODE: str = "simulation"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def validate_for_production(self) -> None:
        """
        Called at startup. Raises RuntimeError on missing/invalid critical values
        when APP_ENV=production. Logs warnings in development.
        """
        import logging
        logger = logging.getLogger(__name__)
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
            raise RuntimeError(
                "Startup validation failed:\n" + "\n".join(f"  - {e}" for e in errors)
            )

        # Validate encryption key format if set
        if self.TOKEN_ENCRYPTION_KEY:
            from app.services.token_crypto import validate_key_at_startup
            validate_key_at_startup(self.APP_ENV)


settings = Settings()
