import os
from dataclasses import dataclass
from app.services.token_crypto import validate_key_at_startup


@dataclass
class Settings:
    APP_ENV: str = os.environ.get("APP_ENV", "development")
    SHOPIFY_API_KEY: str = os.environ.get("SHOPIFY_API_KEY", "")
    SHOPIFY_API_SECRET: str = os.environ.get("SHOPIFY_API_SECRET", "")
    SHOPIFY_SCOPES: str = os.environ.get("SHOPIFY_SCOPES", "read_orders,read_customers")
    TOKEN_ENCRYPTION_KEY: str = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
    BILLING_MODE: str = os.environ.get("BILLING_MODE", "simulation")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "change-me-jwt-secret")
    APP_SECRET_KEY: str = os.environ.get("APP_SECRET_KEY", "change-me")

    def validate_for_production(self) -> None:
        errors = []
        if self.APP_ENV == "production":
            if not self.SHOPIFY_API_SECRET:
                errors.append("SHOPIFY_API_SECRET is required in production")
            if not self.TOKEN_ENCRYPTION_KEY:
                errors.append("TOKEN_ENCRYPTION_KEY is required in production")
            if self.BILLING_MODE == "simulation":
                errors.append("BILLING_MODE=simulation is not allowed in production")
            if self.JWT_SECRET in ("change-me-jwt-secret", "change-me"):
                errors.append("JWT_SECRET must be changed from default")
            if self.APP_SECRET_KEY in ("change-me", "change-me-to-random-64-char-string"):
                errors.append("APP_SECRET_KEY must be changed from default")
        if errors:
            raise RuntimeError("\n".join(errors))
        validate_key_at_startup(self.APP_ENV)


settings = Settings()
