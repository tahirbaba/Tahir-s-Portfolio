import copy
from types import SimpleNamespace as NS

from _lib.agent import run_agent
from _lib.candidates import CANDIDATES, TWIN
from _lib.rules import computed_years, empty_state, execute, redact_cv, screen

C = {c["id"]: c for c in CANDIDATES}


def test_redaction_removes_protected_attributes():
    r = redact_cv(C["amina"]["cv"], "Amina Yusuf")
    for s in ("Amina", "Yusuf", "amina.yusuf@", "+44", "Female", "34", "married"):
        assert s not in r
    assert "Snowflake" in r and "London" not in r and "[contact details removed]" in r


def test_redaction_removes_profile_links():
    from _lib.rules import redact_with_report
    cv = "Jane Roe\njane@example.com · linkedin.com/in/jane-roe · Cairo\n\nSee github.com/janeroe and https://janeroe.dev"
    r, counts = redact_with_report(cv, "Jane Roe")
    assert "jane" not in r.lower() and "Cairo" not in r and counts["profile_link"] == 3 and counts["location"] == 1


def test_audit_record_and_retention():
    from _lib.rules import audit_record
    a = audit_record(C["amina"], C["amina"]["profile"], None)
    assert a["stored"] is False and a["redacted_before_model"]["gender"] == 1 and a["decision"].startswith("pending")
    assert any("University of Leeds" in n for n in a["reidentification_notes"])


def test_years_union_of_intervals():
    assert computed_years([{"start": "2020-01", "end": "2020-12", "full_time": True}, {"start": "2020-07", "end": "2021-06", "full_time": True}]) == 1.5


def test_nobody_is_auto_rejected():
    for c in CANDIDATES:
        r = screen(c, c["profile"])
        assert r["recommendation"] != "reject" and r["decided_by"].startswith("a recruiter")


def test_twin_scores_identically():
    assert screen(C["amina"], C["amina"]["profile"])["score"] == screen(TWIN, TWIN["profile"])["score"]


def test_checklist_follows_flags():
    r = screen(C["li"], C["li"]["profile"])
    assert len(r["checklist"]) == len(r["flags"]) and any("both employments" in x["item"] for x in r["checklist"])


def test_tools_order():
    s = empty_state()
    assert execute("run_checks", {}, C["amina"], s)[2]
    _, s, _ = execute("submit_profile", C["omar"]["profile"], C["omar"], s)
    out, s, err = execute("run_checks", {}, C["omar"], s)
    assert not err and out["recommendation"] == "interview_and_verify"


def test_agent_sees_only_redacted_cv():
    calls = []
    script = [("tool_use", [{"type": "tool_use", "id": "a", "name": "submit_profile", "input": C["amina"]["profile"]}]),
              ("tool_use", [{"type": "tool_use", "id": "b", "name": "run_checks", "input": {}}]), ("end_turn", [{"type": "text", "text": "Advance."}])]

    def create(**kw):
        calls.append(copy.deepcopy(kw)); st, c = script[len(calls) - 1]
        return NS(stop_reason=st, content=c, usage=NS(input_tokens=1, output_tokens=1, cache_read_input_tokens=0, cache_creation_input_tokens=0))
    r = run_agent(C["amina"], NS(beta=NS(messages=NS(create=create))))
    first = calls[0]["messages"][0]["content"]
    assert "Amina" not in first and "Female" not in first and r["state"]["result"]["recommendation"] == "advance"


def test_api_check_without_model():
    import index
    from fastapi.testclient import TestClient
    c = TestClient(index.app)
    r = c.post("/api/py/check", json={"candidate_id": "amina", "claimed_years": 12, "degree_year": 2018}).json()
    assert any(f["type"] == "years_inflated" for f in r["flags"]) and r["audit"]["stored"] is False
    body = {"name": "X", "cv": "x" * 50, "claimed_years": 1, "degree_year": 2020}
    assert c.post("/api/py/screen", json=body).status_code == 400  # no consent, no screening
    assert c.post("/api/py/screen", json={**body, "consent": True}).status_code == 503
    assert "Zero Data Retention" in c.get("/api/py/notice").json()["other_uses"]


def test_bias_audit_four_fifths():
    from _lib.rules import bias_audit
    recs = [{"g": "a", "progressed": True}] * 4 + [{"g": "b", "progressed": True}] * 3 + [{"g": "b", "progressed": False}]
    r = bias_audit(recs, "g")
    assert not r["ok"] and [x["impact_ratio"] for x in r["rows"]] == [1.0, 0.75] and r["rows"][1]["flag"] is True
    assert bias_audit(recs, "g", threshold=0.7)["ok"]


def test_non_essential_personal_data_dropped():
    from _lib.rules import redact_with_report
    cv = "Jo Doe\njo@x.com\nDate of birth: 1990-01-01\nReligion: Hindu\n[photo: jo.png]\n\nHOBBIES\nChess\n\nEXPERIENCE\nEngineer"
    r, _ = redact_with_report(cv, "Jo Doe")
    assert not any(w in r for w in ("1990", "Hindu", "jo.png", "Chess")) and "EXPERIENCE" in r
