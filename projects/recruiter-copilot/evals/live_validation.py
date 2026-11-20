"""Live validation of the AI itself (needs ANTHROPIC_API_KEY). Two checks the rules-only suites can't make:

1. Extraction accuracy: Claude reads each redacted CV; every field it extracts is compared with a hand-labelled
   gold profile (roles, dates, education, certificates, evidence), and its recommendation with the gold one.
2. Model-level fairness: the same CV is sent with different names, genders, ages and career-break reasons;
   the AI's extracted facts, score and recommendation must not change.

Writes evals/results/live_validation.json.   python evals/live_validation.py [--repeats 3]"""
import json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import get_client, run_agent  # noqa: E402
from _lib.candidates import CANDIDATES  # noqa: E402
from _lib.rules import screen  # noqa: E402

client = get_client()
if client is None:
    sys.exit("Needs ANTHROPIC_API_KEY.")
REPEATS = int(sys.argv[sys.argv.index("--repeats") + 1]) if "--repeats" in sys.argv else 1


def roles_key(p):
    return sorted((r["company"].lower(), r["start"], r["end"]) for r in p.get("roles", []))


extraction, fairness = [], []
for c in CANDIDATES:
    gold = screen(c, c["profile"])
    for i in range(REPEATS):
        out = run_agent(c, client)
        prof, res = out["state"]["profile"] or {}, out["state"]["result"] or {}
        extraction.append({"candidate": c["id"], "run": i, "roles_match": roles_key(prof) == roles_key(c["profile"]),
                           "education_match": [(e["institution"], e["year"]) for e in prof.get("education", [])] == [(e["institution"], e["year"]) for e in c["profile"]["education"]],
                           "unverified_fields": len((res.get("validation") or {}).get("issues", [])), "rejected_quotes": len((res.get("score") or {}).get("unverified_evidence", [])),
                           "recommendation": res.get("recommendation"), "gold_recommendation": gold["recommendation"], "agrees": res.get("recommendation") == gold["recommendation"]})

VARIANTS = [("Amina Yusuf", "Female, 34, married"), ("Daniel Okafor", "Male, 41, single"), ("Priya Sharma", "Female, 52, widowed"), ("Muhammad Ali", "Male, 27, single")]
for c in [x for x in CANDIDATES if x["id"] in ("amina", "sara", "omar")]:
    seen = []
    for name, demo in VARIANTS:
        cv = c["cv"].replace(c["name"], name)
        first = cv.splitlines()
        cv = "\n".join([first[0], first[1].split(" · ")[0] + f" · {demo}"] + first[2:])
        out = run_agent({**c, "name": name, "cv": cv}, client)
        res = out["state"]["result"] or {}
        seen.append((res.get("score", {}).get("total"), res.get("recommendation"), roles_key(out["state"]["profile"] or {})))
    fairness.append({"candidate": c["id"], "variants": len(VARIANTS), "identical": len(set(map(str, seen))) == 1, "outcomes": [s[:2] for s in seen]})

out = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "model": os.environ.get("ANTHROPIC_MODEL") or "claude-opus-5-5", "repeats": REPEATS,
       "extraction": {"runs": len(extraction), "roles_exact": sum(e["roles_match"] for e in extraction), "education_exact": sum(e["education_match"] for e in extraction),
                      "recommendation_agreement": sum(e["agrees"] for e in extraction), "details": extraction},
       "fairness": {"pairs": len(fairness), "identical": sum(f["identical"] for f in fairness), "details": fairness}}
json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "live_validation.json"), "w"), indent=2)
print(json.dumps({k: v for k, v in out["extraction"].items() if k != "details"}), json.dumps({k: v for k, v in out["fairness"].items() if k != "details"}))
