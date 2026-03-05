import base64
import hashlib
import hmac
import os
import secrets

_PREFIX = "v1:"
_key = None


def _get_key() -> bytes:
    global _key
    if _key is not None:
        return _key
    raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
    if not raw:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is not set")
    try:
        key = bytes.fromhex(raw)
    except ValueError as exc:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY must be a 64-character hex string") from exc
    if len(key) != 32:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY must be exactly 32 bytes")
    _key = key
    return key


def _keystream(key: bytes, nonce: bytes, length: int) -> bytes:
    out = b""
    ctr = 0
    while len(out) < length:
        out += hashlib.sha256(key + nonce + ctr.to_bytes(4, "big")).digest()
        ctr += 1
    return out[:length]


def encrypt_token(plaintext: str) -> str:
    key = _get_key()
    nonce = secrets.token_bytes(12)
    data = plaintext.encode()
    stream = _keystream(key, nonce, len(data))
    ciphertext = bytes([a ^ b for a, b in zip(data, stream)])
    tag = hmac.new(key, nonce + ciphertext, hashlib.sha256).digest()[:16]
    return _PREFIX + base64.urlsafe_b64encode(nonce + ciphertext + tag).decode()


def decrypt_token(stored: str) -> str:
    if not stored.startswith(_PREFIX):
        return stored
    key = _get_key()
    blob = base64.urlsafe_b64decode(stored[len(_PREFIX):])
    if len(blob) < 28:
        raise ValueError("Token ciphertext too short")
    nonce, rest = blob[:12], blob[12:]
    ciphertext, tag = rest[:-16], rest[-16:]
    expected = hmac.new(key, nonce + ciphertext, hashlib.sha256).digest()[:16]
    if not hmac.compare_digest(tag, expected):
        raise ValueError("Token authentication failed — wrong key or tampered data")
    stream = _keystream(key, nonce, len(ciphertext))
    plain = bytes([a ^ b for a, b in zip(ciphertext, stream)])
    return plain.decode()


def is_encrypted(stored: str) -> bool:
    return stored.startswith(_PREFIX)


def validate_key_at_startup(app_env: str) -> None:
    raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
    if not raw:
        if app_env == "production":
            raise RuntimeError("TOKEN_ENCRYPTION_KEY must be set in production")
        return
    try:
        key = bytes.fromhex(raw)
    except ValueError as exc:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY must be a 64-character hex string") from exc
    if len(key) != 32:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY is invalid")
