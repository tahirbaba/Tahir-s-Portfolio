"""Compass API. Routes under /api/py."""
import os
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _lib.docs import ROLES  # noqa: E402
from _lib.retrieval import INDEX  # noqa: E402

app = FastAPI(title="Compass API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, list[float]] = defaultdict(list)


def _limited(req: Request, n: int) -> bool:
    ip = (req.headers.get("x-forwarded-for") or "local").split(",")[0].strip()
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 600] + [now]
    return len(_hits[ip]) > n


@app.get("/api/py/health")
def health():
    return {"live": bool(os.environ.get("ANTHROPIC_API_KEY")), "search": "up"}


class Q(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    role: str = Field(max_length=20)


@app.post("/api/py/search")
def search(body: Q, request: Request):
    """Permission-filtered retrieval. No model involved."""
    if _limited(request, 300):
        return JSONResponse({"error": "Too many requests."}, status_code=429)
    if body.role not in ROLES:
        return JSONResponse({"error": "Unknown role"}, status_code=400)
    return INDEX.search(body.question, body.role)


@app.post("/api/py/ask")
def ask(body: Q, request: Request):
    from _lib.agent import get_client, run_agent
    client = get_client()
    if client is None:
        return JSONResponse({"error": "The live assistant is offline: no API key is configured. Permission-filtered search works without one."}, status_code=503)
    if body.role not in ROLES:
        return JSONResponse({"error": "Unknown role"}, status_code=400)
    if _limited(request, 20):
        return JSONResponse({"error": "Too many requests. Wait a few minutes."}, status_code=429)
    try:
        return run_agent(body.question, body.role, client)
    except Exception as e:  # noqa: BLE001
        print("agent error", type(e).__name__)
        return JSONResponse({"error": "The assistant hit an error. Please try again."}, status_code=502)
