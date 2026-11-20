"""Bias audit over a counterfactual cohort: every candidate re-sent with many name, gender, age and marital-status
combinations, all screened by the real pipeline. Writes evals/results/bias.json.   python evals/bias_audit.py"""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.candidates import CANDIDATES  # noqa: E402
from _lib.rules import bias_audit, redact_cv, screen  # noqa: E402

NAMES = ["Fatima Zahra", "Muhammad Ali", "Priya Sharma", "John Smith", "Wei Zhang", "Olga Petrova", "Kwame Mensah", "Maria Garcia"]
GENDERS = ["Female", "Male", "Non-binary"]
AGES = [("under 30", 27), ("30-44", 38), ("45+", 52)]
MARITAL = ["single", "married"]
PROGRESS = {"advance", "interview_and_verify"}

records, identical = [], True
for c in CANDIDATES:
    lines = c["cv"].splitlines()
    base_red = None
    for name in NAMES:
        for g in GENDERS:
            for band, age in AGES:
                for m in MARITAL:
                    cv = "\n".join([name, f"{lines[1].split(' · ')[0]} · {g}, {age}, {m}"] + lines[2:])
                    red = redact_cv(cv, name)
                    base_red = base_red or red
                    identical = identical and red == base_red
                    rec = screen({**c, "name": name, "cv": cv}, c["profile"])["recommendation"]
                    records.append({"gender": g.lower(), "age": band, "marital": m, "gender_x_age": f"{g.lower()} · {band}", "progressed": rec in PROGRESS})

# Realistic variations that must not matter: where someone studied, and why they took a career break.
UNIS = [("UK", "University of Leeds"), ("Pakistan", "NUST Islamabad"), ("Nigeria", "University of Lagos"), ("Egypt", "Cairo University"), ("India", "IIT Bombay"), ("China", "Tsinghua University")]
BREAKS = [("none", None), ("parental leave", "Career break 2016-01 to 2016-12: parental leave."), ("caring for family", "Career break 2016-01 to 2016-12: caring for a family member."),
          ("health", "Career break 2016-01 to 2016-12: recovering from an illness."), ("relocation", "Career break 2016-01 to 2016-12: relocated with my family.")]
real, same_score = [], True
for c in CANDIDATES:
    base = screen(c, c["profile"])
    for region, uni in UNIS:
        for reason, line in BREAKS:
            cv, prof = c["cv"], json.loads(json.dumps(c["profile"]))
            for e in prof["education"]:
                cv = cv.replace(e["institution"], uni); e["institution"] = uni
            if line:
                cv = cv.replace("EDUCATION", line + "\n\nEDUCATION", 1)
            r = screen({**c, "cv": cv}, prof)
            same_score = same_score and r["score"]["total"] == base["score"]["total"] and r["recommendation"] == base["recommendation"]
            real.append({"university": region, "break_reason": reason, "progressed": r["recommendation"] in PROGRESS})

out = {"cohort": len(records), "base_candidates": len(CANDIDATES), "redacted_text_identical": identical,
       "audits": [bias_audit(records, k) for k in ("gender", "age", "marital", "gender_x_age")],
       "realistic_cohort": len(real), "realistic_identical": same_score,
       "realistic_audits": [bias_audit(real, k) for k in ("university", "break_reason")],
       "known_limits": ["These runs test Verity's rules with correct extractions. Whether the AI model itself extracts equally well for every group needs live runs: evals/fairness_live.py sends counterfactual CV pairs through Claude and compares the results.",
                        "Graduation year can hint at age. It is kept because the degree-year consistency check needs it; recruiters are told not to weigh it.",
                        "Health and family words are removed by pattern, so an unrelated phrase such as \"led a parental leave policy rollout\" is hidden too. Removing too much is the safer error, but it can hide relevant HR experience."],
       "method": "Selection rate per group = share recommended for interview. Impact ratio = group rate / highest group rate; below 0.80 is flagged (the four-fifths rule used in US EEOC guidance and NYC Local Law 144 bias audits)."}
json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "bias.json"), "w"), indent=2)
print(out["cohort"], "screenings; identical redaction:", identical, "; all groups pass:", all(a["ok"] for a in out["audits"]))
print(out["realistic_cohort"], "realistic variations; identical outcomes:", same_score, "; groups pass:", all(a["ok"] for a in out["realistic_audits"]))
