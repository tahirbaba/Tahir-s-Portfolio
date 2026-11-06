import copy
from types import SimpleNamespace as NS

from _lib.gateway import call, new_state, tools_for
from _lib.mcp import handle
from _lib.agent import run_agent
from _lib.session import sign, verify

S, A, I = "sk_demo_support", "sk_demo_analytics", "sk_demo_intern"


def test_tools_list_is_filtered_by_scope():
    assert {t["name"] for t in tools_for(I)} == {"files.read"}
    assert "db.query" in {t["name"] for t in tools_for(A)} and "payments.refund" not in {t["name"] for t in tools_for(A)}
    assert tools_for("nope") == []


def test_every_decision_is_audited():
    st = new_state()
    _, st = call(S, "files.read", {"path": "handbook/refund-policy.md"}, st)
    _, st = call(I, "payments.refund", {"customer_id": "C-1", "amount": 1, "reason": "x"}, st)
    _, st = call(None, "files.read", {"path": "x"}, st)
    assert [a["decision"] for a in st["audit"]] == ["allowed", "blocked", "blocked"]
    assert st["audit"][2]["agent"] == "unknown"


def test_pipeline_stops_at_first_failed_check():
    r, _ = call(I, "db.query", {"sql": "SELECT 1"}, new_state())
    assert [c["check"] for c in r["checks"]] == ["authenticate", "rate limit", "scope"] and not r["checks"][-1]["ok"]


def test_sql_row_cap_and_read_only_by_authorizer():
    r, _ = call(A, "db.query", {"sql": "WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x < 500) SELECT x FROM n"}, new_state())
    assert r["decision"] == "blocked"  # recursive CTEs are denied by the authorizer
    r, _ = call(A, "db.query", {"sql": "SELECT a.id FROM invoices a, invoices b, invoices c"}, new_state())
    assert r["decision"] == "allowed" and len(r["result"]["rows"]) == 100 and "truncated" in r["reason"]


def test_support_sees_full_pii_analytics_masked():
    full, _ = call(S, "crm.get_customer", {"customer_id": "c-101"}, new_state())
    masked, _ = call(A, "db.query", {"sql": "SELECT email FROM customers WHERE id = 'C-101'"}, new_state())
    assert full["result"]["email"] == "aisha.rahman@example.com"
    assert masked["result"]["rows"][0][0] == "a***@example.com"


def test_injection_is_removed_and_flagged():
    r, _ = call(S, "files.read", {"path": "vendors/acme-invoice.txt"}, new_state())
    assert r["flags"] and "ignore all previous" not in r["result"]["content"].lower() and "1,240 USD" in r["result"]["content"]


def test_approvals_are_queued():
    st = new_state()
    r, st = call(S, "payments.refund", {"customer_id": "C-104", "amount": 240, "reason": "credit"}, st)
    assert r["decision"] == "pending_approval" and st["approvals"][0]["status"] == "pending"


def test_mcp_initialize_list_and_call():
    st = new_state()
    init, st, _ = handle({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}, S, st)
    assert init["result"]["capabilities"]["tools"] is not None and init["result"]["protocolVersion"]
    assert handle({"jsonrpc": "2.0", "method": "notifications/initialized"}, S, st)[0] is None
    lst, st, _ = handle({"jsonrpc": "2.0", "id": 2, "method": "tools/list"}, S, st)
    assert all("inputSchema" in t for t in lst["result"]["tools"])
    res, st, d = handle({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "files.read", "arguments": {"path": "hr/salaries.csv"}}}, S, st)
    assert res["result"]["isError"] is True and d["decision"] == "blocked"


def test_mcp_errors():
    assert handle({"id": 1, "method": "x"}, S, new_state())[0]["error"]["code"] == -32600
    assert handle({"jsonrpc": "2.0", "id": 1, "method": "resources/list"}, S, new_state())[0]["error"]["code"] == -32601
    assert handle({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, "bad", new_state())[0]["error"]["code"] == -32001


def test_signed_state():
    t = sign({"a": 1})
    assert verify(t) == {"a": 1} and verify(t[:-2] + "xx") is False


def fake(script):
    calls = []

    def create(**kw):
        calls.append(copy.deepcopy(kw)); stop, content = script[len(calls) - 1]
        return NS(stop_reason=stop, content=content, usage=NS(input_tokens=500, output_tokens=50, cache_read_input_tokens=0, cache_creation_input_tokens=0))
    return NS(beta=NS(messages=NS(create=create))), calls


def test_agent_only_sees_scoped_tools_and_gateway_decides():
    client, calls = fake([
        ("tool_use", [{"type": "tool_use", "id": "a", "name": "files__read", "input": {"path": "hr/salaries.csv"}}]),
        ("end_turn", [{"type": "text", "text": "That folder is restricted."}]),
    ])
    r = run_agent("intern-bot", "What are salaries?", client)
    assert [t["name"] for t in calls[0]["tools"]] == ["files__read"]
    assert r["trace"][1]["decision"] == "blocked" and r["audit"][0]["decision"] == "blocked"
    assert calls[1]["messages"][-1]["content"][0]["is_error"] is True
