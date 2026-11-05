"""Runs the Leadline agent on evals/dataset.json, grades each case, writes evals/results/latest.json + report.md.
   ANTHROPIC_API_KEY=... python evals/run.py [--limit N] [--lang ar]"""
import argparse, json, os, re, statistics, sys, time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import MODEL, get_client, run_agent  # noqa: E402
from _lib.rules import empty_state  # noqa: E402

ap = argparse.ArgumentParser(); ap.add_argument("--limit", type=int); ap.add_argument("--lang"); ap.add_argument("--concurrency", type=int, default=3)
args = ap.parse_args()
client = get_client()
if not client:
    sys.exit("ANTHROPIC_API_KEY is not set.")
JUDGE = os.environ.get("JUDGE_MODEL", "claude-opus-5-5")
here = os.path.dirname(__file__)
cases = json.load(open(os.path.join(here, "dataset.json"), encoding="utf-8"))
if args.lang: cases = [c for c in cases if c["language"] == args.lang]
if args.limit: cases = cases[: args.limit]

ARABIC = re.compile(r"[؀-ۿ]"); URDU = re.compile(r"[ٹڈڑںےۓہھ]")
def script_ok(lang, text):
    letters = [ch for ch in text if ch.isalpha()]
    share = sum(1 for ch in letters if ARABIC.match(ch)) / max(1, len(letters))
    return {"ar": share > 0.5 and not URDU.search(text), "ur": share > 0.5 and bool(URDU.search(text))}.get(lang, share < 0.3)

SCHEMA = {"type": "object", "properties": {"helpfulness": {"type": "integer"}, "grounded": {"type": "boolean"}, "language_match": {"type": "boolean"}, "notes": {"type": "string"}},
          "required": ["helpfulness", "grounded", "language_match", "notes"], "additionalProperties": False}

def judge(case, transcript, log):
    r = client.beta.messages.create(model=JUDGE, max_tokens=4000, output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{"role": "user", "content": f"Grade a B2B sales first-response agent strictly. helpfulness 1-5. grounded=false if it states meeting times, bookings, prices or facts not supported by the tool log. language_match: replies use the lead's language/script ({case['language']}).\nExpected: {json.dumps(case['expect'])}\n<transcript>{transcript}</transcript>\n<tool_log>{log}</tool_log>"}])
    return json.loads(next(b.text for b in r.content if b.type == "text"))

def run_case(c):
    state, followups, replies, tools, log, lat, cost = empty_state(), [], [], [], [], [], 0.0
    msgs = [c["lead"]["message"]] + ([c["followup"]] if c.get("followup") else [])
    try:
        for i, m in enumerate(msgs):
            if i: followups.append({"role": "user", "content": m})
            r = run_agent(c["lead"], followups, state, client)
            state = r["state"]; lat.append(r["latencyMs"]); cost += r["costUsd"]; replies.append(r["reply"])
            if r["reply"]: followups.append({"role": "assistant", "content": r["reply"]})
            for e in r["trace"]:
                if e["kind"] == "tool": tools.append(e["name"]); log.append(f"{e['name']} {json.dumps(e['input'], ensure_ascii=False)} -> {json.dumps(e['output'], ensure_ascii=False)}")
    except Exception as e:  # noqa: BLE001
        return {**c, "pass": False, "error": repr(e), "checks": {}}
    ex = c["expect"]
    checks = {
        "scored_first": bool(tools) and tools[0] == "score_lead",
        "tier_respected": (state["scored"] or {}).get("tier") == ex["tier"],
        "alert_policy": bool(state["alerts"]) == ex["alert"],
        "slots_policy": ("get_availability" in tools) == ex["offer_slots"] or c["category"].startswith("booking"),
        "meeting_policy": bool(state["meetings"]) == ex["meeting"],
        "crm_logged": bool(state["crm"]) == ex["crm"],
        "reply_policy": all(bool(x) == ex["reply"] for x in replies),
        "script_match": all(script_ok(c["language"], x) for x in replies if x),
    }
    j = None
    if ex["reply"]:
        try:
            j = judge(c, "\n".join(f"LEAD: {m}\nAGENT: {r}" for m, r in zip(msgs, replies)), "\n".join(log))
            checks["grounded"] = j["grounded"]; checks["language_match"] = j["language_match"]
        except Exception:  # noqa: BLE001
            checks["judge_ok"] = False
    return {"id": c["lead"]["id"], "category": c["category"], "language": c["language"], "pass": all(checks.values()), "checks": checks, "judge": j,
            "replies": replies, "tools": tools, "latencyMs": lat, "costUsd": round(cost, 6)}

print(f"Running {len(cases)} cases on {MODEL}")
with ThreadPoolExecutor(args.concurrency) as ex:
    results = list(ex.map(run_case, cases))
lat = [x for r in results for x in r.get("latencyMs", [])]
pct = lambda a, b: round(100 * a / b, 1) if b else 0  # noqa: E731
judged = [r for r in results if r.get("judge")]
summary = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "model": MODEL, "judgeModel": JUDGE, "cases": len(results),
    "metrics": {"taskSuccess": pct(sum(r["pass"] for r in results), len(results)),
                "policyFollowed": pct(sum(all(r["checks"].get(k, False) for k in ("tier_respected", "alert_policy", "meeting_policy", "reply_policy")) for r in results), len(results)),
                "bookingAccuracy": pct(sum(r["checks"].get("meeting_policy", False) for r in results if r["category"].startswith("booking")), sum(1 for r in results if r["category"].startswith("booking"))),
                "spamSilenced": pct(sum(r["checks"].get("reply_policy", False) for r in results if r["category"] == "spam"), sum(1 for r in results if r["category"] == "spam")),
                "languageMatch": pct(sum(r["checks"].get("script_match", False) and r["checks"].get("language_match", True) for r in results), len(results)),
                "avgHelpfulness": round(statistics.mean(r["judge"]["helpfulness"] for r in judged), 2) if judged else 0,
                "avgCostPerLead": round(sum(r.get("costUsd", 0) for r in results) / max(1, len(results)), 4),
                "p50LatencyMs": int(statistics.median(lat)) if lat else 0, "p95LatencyMs": int(sorted(lat)[int(0.95 * (len(lat) - 1))]) if lat else 0},
    "results": results}
os.makedirs(os.path.join(here, "results"), exist_ok=True)
json.dump(summary, open(os.path.join(here, "results", "latest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps(summary["metrics"], indent=2))
