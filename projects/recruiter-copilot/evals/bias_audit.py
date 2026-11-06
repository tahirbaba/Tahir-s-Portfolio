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
                    records.append({"gender": g.lower(), "age": band, "marital": m, "progressed": rec in PROGRESS})

out = {"cohort": len(records), "base_candidates": len(CANDIDATES), "redacted_text_identical": identical,
       "audits": [bias_audit(records, k) for k in ("gender", "age", "marital")],
       "method": "Selection rate per group = share recommended for interview. Impact ratio = group rate / highest group rate; below 0.80 is flagged (the four-fifths rule used in US EEOC guidance and NYC Local Law 144 bias audits)."}
json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "bias.json"), "w"), indent=2)
print(out["cohort"], "screenings; identical redaction:", identical, "; all groups pass:", all(a["ok"] for a in out["audits"]))
