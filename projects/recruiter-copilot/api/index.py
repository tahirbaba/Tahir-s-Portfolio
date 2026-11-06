"""Verity API. Routes under /api/py."""
import os
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _lib.candidates import CANDIDATES, TWIN  # noqa: E402
from _lib.rules import audit_record, redact_cv, screen  # noqa: E402

app = FastAPI(title="Verity API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, list[float]] = defaultdict(list)
BY_ID = {c["id"]: c for c in CANDIDATES + [TWIN]}


def _limited(req: Request, n: int) -> bool:
    ip = (req.headers.get("x-forwarded-for") or "local").split(",")[0].strip()
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 600] + [now]
    return len(_hits[ip]) > n


@app.get("/api/py/health")
def health():
    return {"live": bool(os.environ.get("ANTHROPIC_API_KEY")), "checks": "up"}


class Check(BaseModel):
    candidate_id: str = Field(max_length=20)
    claimed_years: int = Field(ge=0, le=60)
    degree_year: int = Field(ge=1950, le=2030)
    public_title: str | None = Field(default=None, max_length=80)


@app.post("/api/py/check")
def check(body: Check, request: Request):
    """Rerun the consistency checks with edited application-form answers. No model involved."""
    if _limited(request, 200):
        return JSONResponse({"error": "Too many requests."}, status_code=429)
    c = BY_ID.get(body.candidate_id)
    if not c:
        return JSONResponse({"error": "Unknown candidate"}, status_code=400)
    cand = {**c, "form": {**c["form"], "claimed_years": body.claimed_years, "degree_year": body.degree_year}}
    if body.public_title:
        roles = [dict(r) for r in c["public"]["roles"]]
        roles[0]["title"] = body.public_title
        cand["public"] = {"roles": roles}
    return {**screen(cand, c["profile"]), "audit": audit_record(cand, c["profile"], None)}


class Cand(BaseModel):
    name: str = Field(max_length=80)
    cv: str = Field(min_length=40, max_length=8000)
    claimed_years: int = Field(ge=0, le=60)
    degree_year: int = Field(ge=1950, le=2030)


@app.post("/api/py/screen")
def screen_live(body: Cand, request: Request):
    from _lib.agent import get_client, run_agent
    client = get_client()
    if client is None:
        return JSONResponse({"error": "The live agent is offline: no API key is configured. The consistency checker works without one."}, status_code=503)
    if _limited(request, 15):
        return JSONResponse({"error": "Too many requests. Wait a few minutes."}, status_code=429)
    cand = {"id": "live", "name": body.name, "cv": body.cv, "form": {"claimed_years": body.claimed_years, "degree_year": body.degree_year}, "public": {"roles": []}}
    try:
        r = run_agent(cand, client)
        r["redacted"] = redact_cv(body.cv, body.name)
        if r["state"].get("result"):
            r["state"]["result"]["audit"] = audit_record(cand, r["state"].get("profile") or {}, r["model"])
        return r
    except Exception as e:  # noqa: BLE001
        print("agent error", type(e).__name__)
        return JSONResponse({"error": "The agent hit an error. Please try again."}, status_code=502)
