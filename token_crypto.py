"""
Token encryption service — AES-256-GCM
Used to encrypt Shopify access tokens before DB write.

Key format:  TOKEN_ENCRYPTION_KEY env var, hex-encoded 32 bytes (64 hex chars).
             Generate with: python -c "import secrets; print(secrets.token_hex(32))"

Ciphertext format (stored in DB):
    v1:{base64url(nonce_12bytes || ciphertext || tag_16bytes)}

Plaintext detection:
    Tokens not starting with "v1:" are treated as plaintext (legacy/migration path).
    On read: decrypt if v1:, return raw if plaintext (with lazy-encryption warning).
    On write: always write encrypted.

Migration:
    Existing plaintext rows are migrated lazily on first read, or in bulk via the
    migration script: python scripts/migrate_encrypt_tokens.py
    The bulk script is safe to re-run; it skips already-encrypted rows.

Startup validation:
    In APP_ENV=production, startup raises if TOKEN_ENCRYPTION_KEY is missing or <32 bytes.
"""
import os
import base64
import secrets
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_PREFIX = "v1:"

# Lazy-loaded key — validated at startup in production by config.py
_key: Optional[bytes] = None


def _get_key() -> bytes:
    global _key
    if _key is not None:
        return _key
    raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
    if not raw:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is not set. Cannot encrypt/decrypt tokens.")
    try:
        key = bytes.fromhex(raw)
    except ValueError:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).")
    if len(key) != 32:
        raise RuntimeError(f"TOKEN_ENCRYPTION_KEY must be exactly 32 bytes; got {len(key)}.")
    _key = key
    return _key


def encrypt_token(plaintext: str) -> str:
    """
    Encrypt a Shopify access token.
    Returns a v1:-prefixed base64url string safe to store in the DB.
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = _get_key()
    nonce = secrets.token_bytes(12)            # 96-bit nonce
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(nonce, plaintext.encode(), None)  # tag is appended
    blob = nonce + ct_with_tag                 # 12 + len(plaintext) + 16 bytes
    return _PREFIX + base64.urlsafe_b64encode(blob).decode()


def decrypt_token(stored: str) -> str:
    """
    Decrypt a stored token.
    - If stored starts with "v1:", decrypt and return.
    - If stored is plaintext (legacy), return as-is and log a warning so the
      caller can re-encrypt (lazy migration path).

    Raises ValueError on authentication failure (tampered or wrong key).
    """
    if not stored.startswith(_PREFIX):
        # Legacy plaintext — log so callers can trigger lazy migration
        logger.warning(
            "read_plaintext_token: token is not encrypted. Lazy migration should re-encrypt on next write.",
            stack_info=False,
        )
        return stored

    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.exceptions import InvalidTag
    key = _get_key()
    try:
        blob = base64.urlsafe_b64decode(stored[len(_PREFIX):])
    except Exception as exc:
        raise ValueError(f"Token ciphertext is malformed: {exc}") from exc

    if len(blob) < 12 + 16:  # nonce + minimum tag
        raise ValueError("Token ciphertext too short")

    nonce = blob[:12]
    ct_with_tag = blob[12:]
    aesgcm = AESGCM(key)
    try:
        plaintext = aesgcm.decrypt(nonce, ct_with_tag, None)
    except InvalidTag:
        raise ValueError("Token authentication failed — wrong key or tampered data")

    return plaintext.decode()


def is_encrypted(stored: str) -> bool:
    """Return True if the stored value is already encrypted (v1: prefix)."""
    return stored.startswith(_PREFIX)


def validate_key_at_startup(app_env: str) -> None:
    """
    Called during app startup. In production, raises if key is missing or invalid.
    In development, logs a warning if key is absent (allows dev without encryption).
    """
    raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
    if not raw:
        if app_env == "production":
            raise RuntimeError(
                "TOKEN_ENCRYPTION_KEY must be set in production. "
                "Generate with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        else:
            logger.warning(
                "TOKEN_ENCRYPTION_KEY is not set. Tokens will be stored plaintext in development. "
                "Set this before deploying to production."
            )
        return
    try:
        key = bytes.fromhex(raw)
        if len(key) != 32:
            raise ValueError(f"Expected 32 bytes, got {len(key)}")
    except ValueError as exc:
        raise RuntimeError(f"TOKEN_ENCRYPTION_KEY is invalid: {exc}") from exc
    logger.info("Token encryption key validated.")
