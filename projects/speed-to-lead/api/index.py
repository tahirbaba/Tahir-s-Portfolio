"""Leadline API (FastAPI on Vercel Python functions). Routes live under /api/py."""
import os
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _lib.agent import get_client, run_agent  # noqa: E402
from _lib.rules import empty_state  # noqa: E402
from _lib.session import sign, verify  # noqa: E402

app = FastAPI(title="Leadline API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, list[float]] = defaultdict(list)


class Lead(BaseModel):
    id: str = Field(default="L-LIVE", max_length=40)
    name: str = Field(max_length=80)
    email: str = Field(max_length=120)
    company: str = Field(default="", max_length=120)
    role: str = Field(default="", max_length=80)
    source: str = Field(default="web_form", max_length=30)
    country: str = Field(default="", max_length=4)
    timezone: str = Field(default="UTC", max_length=40)
    message: str = Field(max_length=1500)


class Turn(BaseModel):
    role: str
    content: str = Field(max_length=1200)


class LeadRequest(BaseModel):
    lead: Lead
    followups: list[Turn] = Field(default_factory=list, max_length=10)
    state: str | None = None


@app.get("/api/py/health")
def health():
    return {"live": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.post("/api/py/lead")
def handle_lead(body: LeadRequest, request: Request):
    client = get_client()
    if client is None:
        return JSONResponse({"error": "The live agent is offline: no API key is configured for this deployment."}, status_code=503)
    ip = (request.headers.get("x-forwarded-for") or "local").split(",")[0].strip()
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 600] + [now]
    if len(_hits[ip]) > 20:
        return JSONResponse({"error": "Too many requests. Please wait a few minutes."}, status_code=429)
    state = verify(body.state)
    if state is False:
        return JSONResponse({"error": "This conversation expired. Start a new lead."}, status_code=400)
    state = state or empty_state()
    try:
        from zoneinfo import ZoneInfo
        ZoneInfo(body.lead.timezone)
    except Exception:
        return JSONResponse({"error": "Unknown time zone."}, status_code=400)
    turns = [t.model_dump() for t in body.followups]
    if turns and (turns[-1]["role"] != "user" or any(t["role"] not in ("user", "assistant") for t in turns)):
        return JSONResponse({"error": "Bad request"}, status_code=400)
    try:
        r = run_agent(body.lead.model_dump(), turns, state, client)
    except Exception as e:  # noqa: BLE001
        print("agent error", type(e).__name__)
        return JSONResponse({"error": "The agent hit an error. Please try again."}, status_code=502)
    r["state_token"] = sign(r["state"])
    return r
