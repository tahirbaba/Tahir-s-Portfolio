import copy
from types import SimpleNamespace as NS

from _lib.agent import run_agent
from _lib.invoices import INVOICES
from _lib.rules import check_bank, decide, empty_state, execute, three_way_match, validate_extraction

F = {i["id"]: i["fields"] for i in INVOICES}


def test_every_demo_invoice_gets_the_expected_decision():
    for i in INVOICES:
        assert decide(i["fields"])["decision"] == i["expect"], i["id"]


def test_math_validation_names_the_numbers():
    f = copy.deepcopy(F["clean"]); f["subtotal"] = 8530
    assert "8,350.00" in validate_extraction(f)[0]


def test_partial_receipt_names_the_line():
    assert "Toner" in three_way_match(F["partial"])["issues"][0]


def test_iban_formatting_is_normalised_but_changes_are_caught():
    f = copy.deepcopy(F["clean"]); f["bank_iban"] = "ae07 0331 2345 6789 0123 456"
    assert check_bank(f)["ok"]
    f["bank_iban"] = "AE070331234567890123999"
    assert not check_bank(f)["ok"]


def test_fraud_beats_duplicate_and_math():
    f = copy.deepcopy(F["duplicate"]); f["bank_iban"] = "AE99"; f["total"] = 1
    assert decide(f)["type"] == "bank_change"


def test_tools_enforce_order_and_decision():
    s = empty_state()
    assert execute("run_controls", {}, s)[2]
    _, s, _ = execute("submit_extraction", F["bank"], s)
    assert execute("post_to_erp", {}, s)[2]  # controls not run
    _, s, _ = execute("run_controls", {}, s)
    out, s2, err = execute("post_to_erp", {}, s)
    assert err and "hold" in out["error"] and s2["posted"] is None
    _, s3, err = execute("create_exception", {"clerk_note": "verify", "vendor_message": ""}, s)
    assert not err and s3["exception"]["type"] == "bank_change"


def test_clean_invoice_cannot_be_sent_to_exceptions():
    s = empty_state()
    _, s, _ = execute("submit_extraction", F["clean"], s)
    _, s, _ = execute("run_controls", {}, s)
    assert execute("create_exception", {"clerk_note": "x", "vendor_message": "x"}, s)[2]


def test_agent_loop_posts_clean_invoice():
    script = [("tool_use", [{"type": "tool_use", "id": "a", "name": "submit_extraction", "input": F["clean"]}]),
              ("tool_use", [{"type": "tool_use", "id": "b", "name": "run_controls", "input": {}}]),
              ("tool_use", [{"type": "tool_use", "id": "c", "name": "post_to_erp", "input": {}}]),
              ("end_turn", [{"type": "text", "text": "Posted."}])]
    calls = []

    def create(**kw):
        calls.append(kw); stop, c = script[len(calls) - 1]
        return NS(stop_reason=stop, content=c, usage=NS(input_tokens=1, output_tokens=1, cache_read_input_tokens=0, cache_creation_input_tokens=0))
    r = run_agent("doc", NS(beta=NS(messages=NS(create=create))))
    assert r["state"]["posted"] and r["reply"] == "Posted."


def test_controls_api_without_model():
    import index
    from fastapi.testclient import TestClient
    c = TestClient(index.app)
    assert c.post("/api/py/controls", json=F["bank"]).json()["decision"] == "hold"
    assert c.post("/api/py/process", json={"document": "x" * 30}).status_code == 503
