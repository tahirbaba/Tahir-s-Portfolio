"""Verity integrity + fairness suite (no model): consistency checks, evidence grounding and counterfactual fairness.
   python evals/integrity_suite.py  -> evals/results/integrity.json"""
import copy, json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.candidates import CANDIDATES, TWIN  # noqa: E402
from _lib.rules import audit_record, computed_years, redact_cv, redact_with_report, screen  # noqa: E402

C = {c["id"]: c for c in CANDIDATES}
results = []


def add(cid, cat, ok, detail):
    results.append({"id": cid, "category": cat, "pass": bool(ok), "detail": detail})


def flags(c, prof=None):
    return [f["type"] for f in screen(c, prof or c["profile"])["flags"]]


# 1. demo candidates land where a recruiter would expect
EXPECT = {"amina": "advance", "rahul": "verify_first", "omar": "interview_and_verify", "li": "verify_first", "sara": "advance", "tom": "not_a_fit_yet", "nadia": "interview_and_verify"}
for k, v in EXPECT.items():
    got = screen(C[k], C[k]["profile"])["recommendation"]
    add(f"REC-{k}", "Recommendations", got == v, f"expected {v}, got {got}")

# 2. consistency checks
c = copy.deepcopy(C["amina"]); c["form"]["claimed_years"] = 8
add("CON-1", "Consistency", "years_inflated" not in flags(c), "8 claimed vs 7.9 computed is within tolerance")
c["form"]["claimed_years"] = 10
add("CON-2", "Consistency", "years_inflated" in flags(c), "10 claimed vs 7.9 computed is flagged")
p = copy.deepcopy(C["amina"]["profile"]); p["roles"][1]["end"] = "2022-05"
add("CON-3", "Consistency", "overlapping_roles" not in flags(C["amina"], p), "a 2-month overlap during a job change is not flagged")
p["roles"][1]["end"] = "2023-01"
add("CON-4", "Consistency", "overlapping_roles" in flags(C["amina"], p), "an 11-month overlap is flagged")
p = copy.deepcopy(C["li"]["profile"]); p["roles"][1]["full_time"] = False
add("CON-5", "Consistency", "overlapping_roles" not in flags(C["li"], p), "overlap with a part-time role is not flagged")
add("CON-6", "Consistency", abs(computed_years(C["li"]["profile"]["roles"]) - 9.6) < 0.05, "overlapping years are not double-counted (9.6, not 12.4)")
c = copy.deepcopy(C["omar"]); c["public"]["roles"][0]["title"] = "Lead Data Engineer"
add("CON-7", "Consistency", "title_inflation" not in flags(c), "matching titles raise nothing")
c = copy.deepcopy(C["nadia"]); c["form"]["degree_year"] = 2016; c["profile"]["certifications"][0]["id"] = "SPC-1234-5678"
add("CON-8", "Consistency", flags(c) == [], "fixing degree year and certificate ID clears both flags")
p = copy.deepcopy(C["amina"]["profile"]); p["roles"][0]["start"] = "2027-01"
add("CON-9", "Consistency", "future_date" in flags(C["amina"], p), "a start date in the future is flagged")
add("CON-10", "Consistency", [f["severity"] for f in screen(C["sara"], C["sara"]["profile"])["flags"]] == ["info"], "a career gap is informational, never a penalty")

# 3. evidence grounding: invented quotes earn nothing
p = copy.deepcopy(C["tom"]["profile"]); p["evidence"] += [{"criterion": "spark_dbt", "quote": "Built large Spark pipelines"}, {"criterion": "leadership", "quote": "Led a team of ten"}]
r = screen(C["tom"], p)["score"]
add("GRD-1", "Evidence grounding", r["total"] == screen(C["tom"], C["tom"]["profile"])["score"]["total"] and len(r["unverified_evidence"]) == 2, "two invented quotes are rejected and listed")
p = copy.deepcopy(C["amina"]["profile"]); p["evidence"] = [{"criterion": e["criterion"], "quote": e["quote"].upper()} for e in p["evidence"]]
add("GRD-2", "Evidence grounding", screen(C["amina"], p)["score"]["total"] == 100, "quotes match regardless of letter case and spacing")
p = copy.deepcopy(C["amina"]["profile"]); p["evidence"] = []
add("GRD-3", "Evidence grounding", screen(C["amina"], p)["score"]["total"] == 20, "with no evidence only the computed years count")

# 4. fairness: protected attributes never change the outcome
base = screen(C["amina"], C["amina"]["profile"])
twin = screen(TWIN, TWIN["profile"])
add("FAIR-1", "Fairness", base["score"]["total"] == twin["score"]["total"] and base["recommendation"] == twin["recommendation"], "name, gender, age and marital status swapped: identical score and recommendation")
add("FAIR-2", "Fairness", redact_cv(C["amina"]["cv"], "Amina Yusuf") == redact_cv(TWIN["cv"], "Daniel Okafor"), "both CVs are identical after redaction, so the model sees the same text")
SWAPS = [("Amina Yusuf", "Fatima Zahra"), ("Amina Yusuf", "Muhammad Ali"), ("Amina Yusuf", "Priya Sharma"), ("Amina Yusuf", "John Smith"), ("Amina Yusuf", "Wei Zhang")]
red = redact_cv(C["amina"]["cv"], "Amina Yusuf")
for i, (a, b) in enumerate(SWAPS, 3):
    cv = C["amina"]["cv"].replace(a, b)
    add(f"FAIR-{i}", "Fairness", redact_cv(cv, b) == red, f"name swapped to {b}: redacted text unchanged")
for gender_line in ["Male, 29, single", "Woman, 52, widowed", "Non-binary, 38, divorced"]:
    cv = C["amina"]["cv"].replace("Female, 34, married", gender_line)
    add(f"FAIR-{len(results)}", "Fairness", not any(ch.isdigit() for ch in redact_cv(cv, "Amina Yusuf").splitlines()[1]) and not any(w in redact_cv(cv, "Amina Yusuf").lower() for w in ("male", "woman", "single", "widowed", "divorced", "non-binary")), f"“{gender_line}” fully removed")

# 5. privacy and governance (added after an expert privacy review)
cv = C["amina"]["cv"].replace("· London ·", "· linkedin.com/in/amina-y · github.com/aminay · London ·")
r, counts = redact_with_report(cv, "Amina Yusuf")
add("PRIV-1", "Privacy", "linkedin" not in r and "github" not in r and counts.get("profile_link") == 2, "LinkedIn and GitHub links are removed, so the model can't look the person up")
add("PRIV-2", "Privacy", "London" not in redact_cv(C["amina"]["cv"], "Amina Yusuf"), "the city on the contact line is removed with the rest of the contact details")
a = audit_record(C["amina"], C["amina"]["profile"], None)
add("PRIV-3", "Privacy", a["stored"] is False and set(a["redacted_before_model"]) >= {"name", "email", "phone", "gender", "age", "marital_status"}, "every screening writes an audit record of what was hidden; nothing is stored")
add("PRIV-4", "Privacy", all("never ask why" in x["item"] for x in screen(C["sara"], C["sara"]["profile"])["checklist"]), "a career gap is never questioned: the checklist says not to ask for family or health reasons")
add("PRIV-5", "Privacy", all(screen(c, c["profile"])["decided_by"].startswith("a recruiter") for c in CANDIDATES), "no decision is automated; every outcome waits for a recruiter")

out = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "total": len(results), "passed": sum(r["pass"] for r in results), "results": results}
os.makedirs(os.path.join(os.path.dirname(__file__), "results"), exist_ok=True)
json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "integrity.json"), "w"), indent=2)
print(f"{out['passed']}/{out['total']} integrity cases pass")
for r in results:
    if not r["pass"]:
        print("FAIL", r["id"], r["detail"])
