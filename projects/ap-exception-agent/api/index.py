"""Ledger API. Routes under /api/py."""
import os
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _lib.rules import decide  # noqa: E402

app = FastAPI(title="Ledger API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, list[float]] = defaultdict(list)


def _limited(req: Request, n: int) -> bool:
    ip = (req.headers.get("x-forwarded-for") or "local").split(",")[0].strip()
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 600] + [now]
    return len(_hits[ip]) > n


@app.get("/api/py/health")
def health():
    return {"live": bool(os.environ.get("ANTHROPIC_API_KEY")), "controls": "up"}


class Line(BaseModel):
    description: str = Field(max_length=120)
    qty: float
    unit_price: float


class Fields(BaseModel):
    vendor_name: str = Field(max_length=120)
    vendor_tax_id: str = Field(max_length=40)
    invoice_number: str = Field(max_length=40)
    invoice_date: str = Field(max_length=10)
    po_number: str = Field(max_length=20)
    currency: str = Field(max_length=3)
    lines: list[Line] = Field(max_length=20)
    subtotal: float
    tax: float
    total: float
    bank_iban: str = Field(max_length=40)


@app.post("/api/py/controls")
def controls(body: Fields, request: Request):
    """Run the AP controls on extracted fields. No model involved."""
    if _limited(request, 120):
        return JSONResponse({"error": "Too many requests."}, status_code=429)
    try:
        return decide(body.model_dump())
    except Exception:  # noqa: BLE001
        return JSONResponse({"error": "Could not evaluate these fields."}, status_code=400)


class Doc(BaseModel):
    document: str = Field(min_length=20, max_length=6000)


@app.post("/api/py/process")
def process(body: Doc, request: Request):
    from _lib.agent import get_client, run_agent
    client = get_client()
    if client is None:
        return JSONResponse({"error": "The live agent is offline: no API key is configured. The controls checker works without one."}, status_code=503)
    if _limited(request, 15):
        return JSONResponse({"error": "Too many requests. Wait a few minutes."}, status_code=429)
    try:
        return run_agent(body.document, client)
    except Exception as e:  # noqa: BLE001
        print("agent error", type(e).__name__)
        return JSONResponse({"error": "The agent hit an error. Please try again."}, status_code=502)
