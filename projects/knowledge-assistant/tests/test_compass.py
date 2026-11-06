import copy
from types import SimpleNamespace as NS

from _lib.agent import NOT_FOUND, run_agent
from _lib.retrieval import INDEX, check_citations, clean_answer


def test_restricted_never_returned_and_counted():
    r = INDEX.search("salary band senior software engineer", "employee")
    assert all(h["doc"] != "HR-BANDS" for h in r["hits"]) and r["hidden_by_access"] >= 1
    assert INDEX.search("salary band senior software engineer", "hr")["hits"][0]["doc"] == "HR-BANDS"


def test_superseded_policy_hidden():
    r = INDEX.search("hotel limit per night", "employee")
    assert r["hits"][0]["doc"] == "FIN-TRAVEL-2026" and r["hidden_as_outdated"] >= 1


def test_citation_check():
    assert check_citations("24 days [HR-LEAVE#1].", ["HR-LEAVE#1"])["ok"]
    c = check_citations("Band is 95k [HR-BANDS#1].", ["HR-LEAVE#1"])
    assert not c["ok"] and c["invalid"] == ["HR-BANDS#1"]
    assert clean_answer("x [HR-BANDS#1] y [HR-LEAVE#1]", ["HR-LEAVE#1"]) == "x y [HR-LEAVE#1]"


def fake(script):
    calls = []

    def create(**kw):
        calls.append(copy.deepcopy(kw)); st, c = script[len(calls) - 1]
        return NS(stop_reason=st, content=c, usage=NS(input_tokens=1, output_tokens=1, cache_read_input_tokens=0, cache_creation_input_tokens=0))
    return NS(beta=NS(messages=NS(create=create))), calls


def test_answer_with_valid_citation_passes():
    client, calls = fake([("tool_use", [{"type": "tool_use", "id": "a", "name": "search_docs", "input": {"query": "annual leave days"}}]),
                          ("end_turn", [{"type": "text", "text": "You get 24 days [HR-LEAVE#1]."}])])
    r = run_agent("How much leave?", "employee", client)
    assert r["reply"] == "You get 24 days [HR-LEAVE#1]." and not r["guarded"]
    assert "HR-BANDS" not in str(calls[1]["messages"][-1])


def test_uncited_or_hallucinated_answers_are_replaced():
    client, _ = fake([("tool_use", [{"type": "tool_use", "id": "a", "name": "search_docs", "input": {"query": "salary band"}}]),
                      ("end_turn", [{"type": "text", "text": "Senior engineers earn 95,000 to 128,000 USD [HR-BANDS#1]."}])])
    r = run_agent("What do seniors earn?", "employee", client)
    assert r["reply"] == NOT_FOUND and r["guarded"]
    client, _ = fake([("tool_use", [{"type": "tool_use", "id": "a", "name": "search_docs", "input": {"query": "wifi password"}}]),
                      ("end_turn", [{"type": "text", "text": "The wifi password is on the kitchen wall."}])])
    assert run_agent("wifi?", "employee", client)["reply"] == NOT_FOUND


def test_api_search_without_model():
    import index
    from fastapi.testclient import TestClient
    c = TestClient(index.app)
    assert c.post("/api/py/search", json={"question": "discount authority", "role": "manager"}).json()["hits"][0]["doc"] == "FIN-PRICING"
    assert c.post("/api/py/search", json={"question": "leave policy", "role": "admin"}).status_code == 400
    assert c.post("/api/py/ask", json={"question": "hi", "role": "employee"}).status_code == 503
