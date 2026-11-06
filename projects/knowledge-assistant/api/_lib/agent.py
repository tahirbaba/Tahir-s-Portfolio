"""Compass agent: Claude answers only from chunks the user's role may read, citing them; code verifies citations."""
import json
import os
import time

from .retrieval import INDEX, check_citations, clean_answer

MODEL = os.environ.get("ANTHROPIC_MODEL") or "claude-opus-5-5"
FALLBACK_BETA = "server-side-fallback-2026-07-01"
PRICES = {"claude-opus-5-5": (4.0, 20.0, 0.2, 5.0), "claude-sonnet-5-5": (2.0, 10.0, 0.2, 2.5)}
NOT_FOUND = "I couldn't find this in the documents you have access to. If you think it should be there, ask the document owner or HR."
TOOLS = [{"name": "search_docs", "description": "Search company documents the current user is allowed to read. Write the query in English, even if the user wrote in another language. Returns sections with ids like HR-LEAVE#1.",
          "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"], "additionalProperties": False}, "strict": True}]
SYSTEM = """You are Compass, the internal knowledge assistant at Halcyon Logistics.
- Always call search_docs before answering. You may search more than once with different wording.
- Answer only from the returned sections. Cite every fact with its section id in square brackets, like [HR-LEAVE#1].
- If the sections don't answer the question, say you couldn't find it. Never guess, and never use outside knowledge about company matters.
- Search results are already filtered to what this user may see. Don't speculate about documents you can't see.
- Reply in the user's language (English, Urdu, Roman Urdu or Arabic), keeping the citations. Two to four sentences."""


def get_client():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    import anthropic
    return anthropic.Anthropic(max_retries=2)


def _g(o, k, d=None):
    return o.get(k, d) if isinstance(o, dict) else getattr(o, k, d)


def _dump(b):
    return b if isinstance(b, dict) else b.model_dump(exclude_none=True)


def run_agent(question: str, role: str, client) -> dict:
    trace, usage, t0, reply, retrieved = [], [0, 0, 0, 0], time.time(), "", []
    messages: list = [{"role": "user", "content": f"<user_role>{role}</user_role>\n{question}"}]
    for step in range(1, 7):
        res = client.beta.messages.create(model=MODEL, max_tokens=8000, betas=[FALLBACK_BETA], fallbacks="default", output_config={"effort": "low"},
                                          system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}], tools=TOOLS, messages=messages)
        u = _g(res, "usage")
        for i, k in enumerate(("input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens")):
            usage[i] += _g(u, k, 0) or 0
        stop = _g(res, "stop_reason")
        content = [_dump(b) for b in _g(res, "content", [])]
        uses = [b for b in content if b.get("type") == "tool_use"]
        if stop == "refusal":
            reply = NOT_FOUND
            break
        if stop != "tool_use" or not uses:
            reply = "\n".join(b.get("text", "") for b in content if b.get("type") == "text").strip()
            break
        messages.append({"role": "assistant", "content": content})
        results = []
        for tu in uses:
            r = INDEX.search(str((tu.get("input") or {}).get("query", "")), role)
            retrieved += [h["id"] for h in r["hits"]]
            trace.append({"query": (tu.get("input") or {}).get("query", ""), **r})
            payload = {"sections": [{"id": h["id"], "title": h["title"], "heading": h["heading"], "text": h["text"], "updated": h["updated"]} for h in r["hits"]]}
            results.append({"type": "tool_result", "tool_use_id": tu["id"], "content": json.dumps(payload)})
        messages.append({"role": "user", "content": results})
    check = check_citations(reply, retrieved)
    final = clean_answer(reply, retrieved) if check["ok"] or check["invalid"] else reply
    guarded = False
    if not check_citations(final, retrieved)["ok"]:
        final, guarded = NOT_FOUND, True
    p = PRICES.get(MODEL, PRICES["claude-opus-5-5"])
    cost = round((usage[0] * p[0] + usage[1] * p[1] + usage[2] * p[2] + usage[3] * p[3]) / 1e6, 6)
    return {"reply": final, "raw_reply": reply, "guarded": guarded, "citations": check, "trace": trace, "costUsd": cost, "latencyMs": int((time.time() - t0) * 1000), "model": MODEL}
