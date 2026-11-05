import copy
from types import SimpleNamespace as NS

from _lib.agent import NO_REPLY, run_agent
from _lib.rules import empty_state

LEAD = {"id": "L1", "name": "Mona", "email": "mona@gulfline.example", "company": "Gulfline", "role": "VP Operations", "source": "web_form",
        "country": "AE", "timezone": "Asia/Dubai", "message": "Can we see a demo this week? Pricing too."}


def fake(script):
    calls = []

    def create(**kw):
        calls.append(copy.deepcopy(kw))
        stop, content = script[len(calls) - 1]
        return NS(stop_reason=stop, content=content, usage=NS(input_tokens=1000, output_tokens=100, cache_read_input_tokens=0, cache_creation_input_tokens=0))
    return NS(beta=NS(messages=NS(create=create))), calls


def tu(i, name, inp):
    return {"type": "tool_use", "id": i, "name": name, "input": inp}


def test_full_hot_flow():
    client, calls = fake([
        ("tool_use", [tu("a", "score_lead", {})]),
        ("tool_use", [tu("b", "alert_rep", {"reason": "VP asking for demo"}), tu("c", "get_availability", {"count": 3})]),
        ("tool_use", [tu("d", "log_to_crm", {"summary": "Hot lead", "next_step": "Meeting"})]),
        ("end_turn", [{"type": "text", "text": "Hi Mona, happy to show you a demo."}]),
    ])
    r = run_agent(LEAD, [], empty_state(), client)
    assert r["reply"].startswith("Hi Mona")
    assert r["state"]["scored"]["tier"] == "hot" and r["state"]["alerts"] and r["state"]["crm"]
    assert sum(1 for e in r["trace"] if e["kind"] == "tool") == 4
    # parallel tool results returned in one user message
    assert len(calls[2]["messages"][-1]["content"]) == 2
    assert r["costUsd"] > 0


def test_blocked_tool_returns_error_to_model():
    client, calls = fake([
        ("tool_use", [tu("a", "book_meeting", {"start_utc": "2026-11-04T06:00:00+00:00"})]),
        ("end_turn", [{"type": "text", "text": "ok"}]),
    ])
    r = run_agent(LEAD, [], empty_state(), client)
    assert calls[1]["messages"][-1]["content"][0]["is_error"] is True
    assert not r["state"]["meetings"]


def test_spam_produces_no_reply():
    spam = {**LEAD, "message": "SEO services and backlinks"}
    client, _ = fake([("tool_use", [tu("a", "score_lead", {})]), ("end_turn", [{"type": "text", "text": NO_REPLY}])])
    assert run_agent(spam, [], empty_state(), client)["reply"] is None


def test_trace_masks_emails():
    client, _ = fake([("tool_use", [tu("a", "enrich_company", {"domain": "gulfline.example"})]), ("end_turn", [{"type": "text", "text": "hi"}])])
    r = run_agent(LEAD, [], empty_state(), client)
    assert "mona@" not in str(r["trace"])


def test_refusal_is_safe():
    client, _ = fake([("refusal", [])])
    assert "team" in run_agent(LEAD, [], empty_state(), client)["reply"]
