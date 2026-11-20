import os, runpy, json


def test_security_suite_all_pass(tmp_path):
    here = os.path.join(os.path.dirname(__file__), "..", "evals", "security_suite.py")
    runpy.run_path(here, run_name="__main__")
    data = json.load(open(os.path.join(os.path.dirname(here), "results", "security.json")))
    assert data["passed"] == data["total"]


def test_workflow_suite_all_pass():
    here = os.path.join(os.path.dirname(__file__), "..", "evals", "workflow_suite.py")
    runpy.run_path(here, run_name="__main__")
    data = json.load(open(os.path.join(os.path.dirname(here), "results", "workflow.json")))
    assert data["passed"] == data["total"] and data["fuzzViolations"] == 0


def test_approve_endpoint_two_person_flow():
    import index
    from fastapi.testclient import TestClient
    c = TestClient(index.app)
    r = c.post("/api/py/call", json={"api_key": "sk_demo_support", "tool": "payments.refund", "args": {"customer_id": "C-105", "amount": 450, "reason": "x"}}).json()
    aid, st = r["approvals"][-1]["id"], r["state"]
    r = c.post("/api/py/approve", json={"approver": "lead-sara", "approval_id": aid, "decision": "approve", "state": st}).json()
    assert r["decision"] == "pending_approval"
    r = c.post("/api/py/approve", json={"approver": "fin-omar", "approval_id": aid, "decision": "approve", "state": r["state"]}).json()
    assert r["decision"] == "allowed" and r["result"]["refunded"] == 450
    assert c.post("/api/py/approve", json={"approver": "fin-omar", "approval_id": aid, "decision": "approve", "state": "forged.state"}).status_code == 400
