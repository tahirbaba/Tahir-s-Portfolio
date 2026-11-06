"""Minimal Model Context Protocol server (JSON-RPC 2.0 over HTTP POST) in front of the gateway.
Implements initialize, tools/list and tools/call; the bearer token identifies the agent."""
import json

from .gateway import call, tools_for

PROTOCOL_VERSION = "2025-06-18"
SERVER_INFO = {"name": "gatekeeper", "version": "0.1.0"}


def handle(msg: dict, api_key: str | None, state: dict) -> tuple[dict | None, dict, dict | None]:
    """Returns (json-rpc response or None for notifications, new state, gateway decision or None)."""
    mid = msg.get("id")
    method = msg.get("method")
    if msg.get("jsonrpc") != "2.0" or not isinstance(method, str):
        return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32600, "message": "Invalid Request"}}, state, None
    if mid is None:  # notification, e.g. notifications/initialized
        return None, state, None
    if method == "initialize":
        return {"jsonrpc": "2.0", "id": mid, "result": {"protocolVersion": PROTOCOL_VERSION, "capabilities": {"tools": {"listChanged": False}}, "serverInfo": SERVER_INFO,
                "instructions": "Tools are filtered by your API key's scopes. Every call is policy-checked and audited."}}, state, None
    if method == "tools/list":
        if not tools_for(api_key):
            return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32001, "message": "Unauthorized"}}, state, None
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": tools_for(api_key)}}, state, None
    if method == "tools/call":
        p = msg.get("params") or {}
        resp, state = call(api_key, str(p.get("name", "")), p.get("arguments") or {}, state)
        text = json.dumps({"decision": resp["decision"], "reason": resp["reason"], "result": resp["result"]})
        return {"jsonrpc": "2.0", "id": mid, "result": {"content": [{"type": "text", "text": text}], "isError": resp["decision"] == "blocked"}}, state, resp
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Method not found: {method}"}}, state, None
