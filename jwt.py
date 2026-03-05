import base64
import hashlib
import hmac
import json
import time


class InvalidTokenError(Exception):
    pass


class ExpiredSignatureError(InvalidTokenError):
    pass


def _b64e(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64d(data: str) -> bytes:
    pad = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + pad)


def encode(payload, key, algorithm="HS256"):
    header = {"alg": algorithm, "typ": "JWT"}
    s1 = _b64e(json.dumps(header, separators=(",", ":")).encode())
    s2 = _b64e(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(key.encode(), f"{s1}.{s2}".encode(), hashlib.sha256).digest()
    return f"{s1}.{s2}.{_b64e(sig)}"


def decode(token, key, algorithms=None, audience=None, options=None):
    try:
        s1, s2, s3 = token.split(".")
    except ValueError as exc:
        raise InvalidTokenError("Malformed") from exc
    expected = hmac.new(key.encode(), f"{s1}.{s2}".encode(), hashlib.sha256).digest()
    if not hmac.compare_digest(_b64d(s3), expected):
        raise InvalidTokenError("Bad signature")
    payload = json.loads(_b64d(s2))
    now = int(time.time())
    if payload.get("exp") is not None and int(payload["exp"]) < now:
        raise ExpiredSignatureError("expired")
    if payload.get("nbf") is not None and int(payload["nbf"]) > now:
        raise InvalidTokenError("nbf")
    if audience is not None and payload.get("aud") != audience:
        raise InvalidTokenError("audience")
    return payload
