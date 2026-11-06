import base64, hashlib, hmac, json, os


def _secret() -> bytes:
    return (os.environ.get("STATE_SECRET") or os.environ.get("ANTHROPIC_API_KEY") or "dev-only-secret").encode()


def sign(state: dict) -> str:
    body = base64.urlsafe_b64encode(json.dumps(state, separators=(",", ":")).encode()).decode().rstrip("=")
    mac = base64.urlsafe_b64encode(hmac.new(_secret(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return f"{body}.{mac}"


def verify(token):
    if not token:
        return None
    if not isinstance(token, str) or len(token) > 20000 or "." not in token:
        return False
    body, mac = token.split(".", 1)
    good = base64.urlsafe_b64encode(hmac.new(_secret(), body.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    if not hmac.compare_digest(good, mac):
        return False
    try:
        return json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except Exception:
        return False
