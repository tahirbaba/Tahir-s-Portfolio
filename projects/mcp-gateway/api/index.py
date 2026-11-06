"""Gatekeeper API: MCP endpoint, a direct playground endpoint and the agent demo. Routes under /api/py."""
import os
import sys
import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse, Response  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from _lib.gateway import new_state  # noqa: E402
from _lib.gateway import call as gw_call  # noqa: E402
from _lib.mcp import handle  # noqa: E402
from _lib.session import sign, verify  # noqa: E402

app = FastAPI(title="Gatekeeper", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")
_hits: dict[str, list[float]] = defaultdict(list)


def _limited(req: Request, n: int) -> bool:
    ip = (req.headers.get("x-forwarded-for") or "local").split(",")[0].strip()
    now = time.time()
    _hits[ip] = [t for t in _hits[ip] if now - t < 60] + [now]
    return len(_hits[ip]) > n


def _bearer(req: Request) -> str | None:
    h = req.headers.get("authorization", "")
    return h[7:].strip() if h.lower().startswith("bearer ") else None


@app.get("/api/py/health")
def health():
    return {"live": bool(os.environ.get("ANTHROPIC_API_KEY")), "gateway": "up"}


@app.post("/api/py/mcp")
async def mcp(request: Request):
    """Stateless MCP endpoint (JSON responses). Point an MCP client at it with a demo bearer key."""
    if _limited(request, 120):
        return JSONResponse({"jsonrpc": "2.0", "id": None, "error": {"code": -32000, "message": "Rate limited"}}, status_code=429)
    try:
        msg = await request.json()
    except Exception:  # noqa: BLE001
        return JSONResponse({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}, status_code=400)
    resp, _, _ = handle(msg, _bearer(request), new_state())
    return Response(status_code=202) if resp is None else JSONResponse(resp)


class PlayCall(BaseModel):
    api_key: str = Field(max_length=80)
    tool: str = Field(max_length=60)
    args: dict
    state: str | None = None


@app.post("/api/py/call")
def play(body: PlayCall, request: Request):
    """Playground: send one raw tool call and see the full decision. No model involved."""
    if _limited(request, 60):
        return JSONResponse({"error": "Too many calls. Wait a minute."}, status_code=429)
    st = verify(body.state)
    if st is False:
        st = None
    resp, st = gw_call(body.api_key, body.tool, body.args, st or new_state())
    st["audit"] = st["audit"][-50:]
    return {**resp, "audit": st["audit"], "approvals": st["approvals"], "state": sign(st)}


class Task(BaseModel):
    agent: str = Field(max_length=30)
    task: str = Field(max_length=1000)


@app.post("/api/py/agent")
def agent(body: Task, request: Request):
    from _lib.agent import get_client, run_agent
    client = get_client()
    if client is None:
        return JSONResponse({"error": "The live agent is offline: no API key is configured for this deployment. The gateway playground works without one."}, status_code=503)
    if _limited(request, 10):
        return JSONResponse({"error": "Too many requests. Wait a minute."}, status_code=429)
    try:
        return run_agent(body.agent, body.task, client)
    except KeyError:
        return JSONResponse({"error": "Unknown agent"}, status_code=400)
    except Exception as e:  # noqa: BLE001
        print("agent error", type(e).__name__)
        return JSONResponse({"error": "The agent hit an error. Please try again."}, status_code=502)
