"""Builds data/replays.json (scripted model, real checks).   python evals/replays.py [--live]"""
import json, os, sys
from types import SimpleNamespace as NS

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import get_client, run_agent  # noqa: E402
from _lib.candidates import CANDIDATES, TWIN  # noqa: E402
from _lib.rules import audit_record, redact_cv  # noqa: E402

LIVE = "--live" in sys.argv
REPLY = {
    "amina": "Recommend advancing. Every must-have is backed by the CV, including Spark and dbt pipelines on Snowflake and production Python, with mentoring and healthcare data as bonuses. No inconsistencies found.",
    "rahul": "Verify before interviewing. Skills match the core stack, but the application claims 8 years while the CV's own dates add up to about 6. Ask the candidate to walk through the timeline.",
    "omar": "Interview and verify. Strong evidence across dbt, BigQuery, data quality and leading a team of six. The CV says Lead Data Engineer at Petra Pay but the public profile says Data Engineer; confirm the title with a reference.",
    "li": "Verify before interviewing. Two full-time senior roles overlap for 33 months, and Kopi Logistics doesn't appear on the public profile. Confirm both employments and whether one was part-time.",
    "sara": "Recommend advancing. Spark and dbt on BigQuery for hospital claims data, production Python, data testing and mentoring are all evidenced. There is a two-year career break; it is noted only and does not affect the score.",
    "tom": "Not a fit for this senior role yet. The CV shows about three years with Python notebooks and SQL dashboards, but no Spark or dbt pipeline work. Worth keeping in mind for a junior opening.",
    "nadia": "Interview and verify. The core stack is evidenced, but the degree year differs between the CV (2016) and the form (2014), and the SnowPro ID doesn't match the issuer's format. Check both before an offer.",
    "amina_twin": "Recommend advancing. Identical evidence and identical score to the first candidate: the name, gender, age and marital status were removed before screening.",
}


def scripted(c):
    steps = [[{"type": "tool_use", "id": "a", "name": "submit_profile", "input": c["profile"]}], [{"type": "tool_use", "id": "b", "name": "run_checks", "input": {}}], [{"type": "text", "text": REPLY[c["id"]]}]]
    i = {"n": 0}
    z = NS(input_tokens=0, output_tokens=0, cache_read_input_tokens=0, cache_creation_input_tokens=0)

    def create(**_):
        st = steps[i["n"]]; i["n"] += 1
        return NS(stop_reason="end_turn" if i["n"] == 3 else "tool_use", content=st, usage=z)
    return NS(beta=NS(messages=NS(create=create)))


client = get_client() if LIVE else None
if LIVE and not client:
    sys.exit("--live needs ANTHROPIC_API_KEY")
out = []
for c in CANDIDATES + [TWIN]:
    r = run_agent(c, client or scripted(c))
    r["state"]["result"]["audit"] = audit_record(c, c["profile"], r["model"] if LIVE else None)
    out.append({"id": c["id"], "title": c["title"], "name": c["name"], "cv": c["cv"], "redacted": redact_cv(c["cv"], c["name"]), "form": c["form"], "public": c["public"],
                "kind": "recorded" if LIVE else "scripted", "model": r["model"] if LIVE else None, "reply": r["reply"], "result": r["state"]["result"]})
    print(c["id"], r["state"]["result"]["recommendation"], r["state"]["result"]["score"]["total"])
json.dump(out, open(os.path.join(os.path.dirname(__file__), "..", "data", "replays.json"), "w"), indent=2, ensure_ascii=False)
