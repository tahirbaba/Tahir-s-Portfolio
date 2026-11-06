"""Verity's screening rules, enforced in code:
- protected attributes are removed before the model sees a CV
- a rubric point counts only if its evidence quote appears verbatim in the CV
- years of experience are computed from dates, not taken from claims
- consistency checks compare CV, application form and public profile
- the output is a recommendation for a person; nothing is auto-rejected"""
from __future__ import annotations

import re
from copy import deepcopy
from datetime import datetime, timezone

from .candidates import CERT_FORMATS, NOW, ROLE

RULES_VERSION = "verity-rules 1.2"
URL = re.compile(r"(https?://\S+|www\.\S+|\b(?:linkedin|github|gitlab|twitter|x|behance|medium)\.com/\S*)", re.I)
PROTECTED_PATTERNS = [
    ("email", re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "[email]"),
    ("profile_link", URL, "[link]"),
    ("phone", re.compile(r"\+?\d[\d\s-]{8,}\d"), "[phone]"),
    ("gender", re.compile(r"\b(male|female|man|woman|non-binary)\b", re.I), "[removed]"),
    ("marital_status", re.compile(r"\b(married|single|divorced|widowed)\b", re.I), "[removed]"),
    ("religion", re.compile(r"\b(muslim|christian|catholic|protestant|hindu|jewish|buddhist|sikh|atheist|religion:?)\b", re.I), "[removed]"),
    ("age", re.compile(r"\b\d{2}\s*(years old|y/o)?\b(?=[,\s]*(married|single|\[removed\]|$))", re.I), "[removed]"),
]
CONTACT_LINE = "[contact details removed]"
# Lines and sections that are never needed to judge skills. They are dropped, not just hidden.
PERSONAL_LINE = re.compile(r"^\s*(date of birth|dob|born|nationality|religion|marital status|photo|picture|passport|visa status|gender|age)\b\s*[:\-]", re.I)
PHOTO = re.compile(r"\[(photo|image|picture)[^\]]*\]|\S+\.(jpe?g|png|heic|webp)\b", re.I)
PERSONAL_SECTION = re.compile(r"^\s*(hobbies|interests|hobbies and interests|personal( details| information)?)\s*:?\s*$", re.I)


def redact_with_report(cv: str, name: str) -> tuple[str, dict]:
    """Remove name, contact details (incl. city and profile links), gender, age and marital status before screening.
    Returns the redacted text and a count of what was removed, for the audit log."""
    counts: dict[str, int] = {}
    out = []
    skipping = False

    def bump(k):
        counts[k] = counts.get(k, 0) + 1
    for i, line in enumerate(cv.splitlines()):
        if PERSONAL_SECTION.match(line):
            skipping = True
            bump("non_essential_section")
            continue
        if skipping:
            if line.strip() == "" or (line.isupper() and len(line.strip()) > 3):
                skipping = False
                if line.strip() == "":
                    continue
            else:
                continue
        if PERSONAL_LINE.match(line):
            bump("personal_detail_line")
            continue
        line, n = PHOTO.subn("", line)
        if n:
            counts["photo"] = counts.get("photo", 0) + n
        if i == 0 and line.strip() == name:
            out.append("[candidate]")
            counts["name"] = counts.get("name", 0) + 1
            continue
        hit = False
        for kind, pat, rep in PROTECTED_PATTERNS:
            line, n = pat.subn(rep, line)
            if n:
                counts[kind] = counts.get(kind, 0) + n
                hit = hit or kind in ("email", "phone")
        for part in name.split():
            line, n = re.subn(rf"\b{re.escape(part)}\b", "[candidate]", line)
            if n:
                counts["name"] = counts.get("name", 0) + n
        if hit and i <= 2:
            # a header line with an email or phone is the contact line: drop it whole, so the city goes too
            counts["location"] = counts.get("location", 0) + 1
            line = CONTACT_LINE
        out.append(line)
    return "\n".join(out), counts


def redact_cv(cv: str, name: str) -> str:
    return redact_with_report(cv, name)[0]


def reidentification_notes(profile: dict) -> list[str]:
    """Things left in the CV that could still point to a person. Kept because recruiters must verify them, but never scored."""
    orgs = sorted({r["company"] for r in profile.get("roles", [])} | {e["institution"] for e in profile.get("education", [])})
    notes = []
    if orgs:
        notes.append(f"{len(orgs)} employer or university names stay visible ({', '.join(orgs)}). They are needed to verify experience, are not used in the score, and together could identify someone.")
    return notes


RETENTION = "Not stored. The CV is processed in memory and discarded when the response is sent. Personal details not needed for the job are dropped, not kept."
NOTICE = {
    "ai_processing": "Your CV is screened with the help of AI (Anthropic's Claude). A recruiter reviews every result and makes the decision.",
    "hidden": "Before the AI reads it, we remove your name, contact details, city, profile links, photo, gender, age, marital status, religion, nationality, date of birth and hobbies.",
    "analysed": "The AI reads only your work history, dates, skills, education and certifications, and must quote your CV for every point it gives.",
    "other_uses": "Your CV is not stored by Verity and is not used to train any model. Anthropic does not train on API data by default; Zero Data Retention can be arranged for enterprise deployments.",
    "security": "Data is encrypted in transit (HTTPS/TLS). Verity keeps nothing at rest; a deployment that keeps CVs must encrypt them at rest and delete them on the agreed schedule.",
}


def bias_audit(records: list[dict], key: str, threshold: float = 0.8) -> dict:
    """Selection rate per group and impact ratio against the best-treated group (the four-fifths rule).
    Group labels are kept apart from screening and used only for this audit."""
    groups: dict[str, list[bool]] = {}
    for r in records:
        groups.setdefault(r[key], []).append(r["progressed"])
    rates = {g: sum(v) / len(v) for g, v in groups.items()}
    top = max(rates.values()) or 1
    rows = [{"group": g, "n": len(groups[g]), "rate": round(rates[g], 3), "impact_ratio": round(rates[g] / top, 3), "flag": rates[g] / top < threshold} for g in sorted(groups)]
    return {"key": key, "threshold": threshold, "rows": rows, "ok": not any(r["flag"] for r in rows)}


def audit_record(cand: dict, profile: dict, model: str | None) -> dict:
    _, counts = redact_with_report(cand["cv"], cand["name"])
    return {"at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "rules_version": RULES_VERSION, "model": model or "none: rules only",
            "redacted_before_model": counts, "reidentification_notes": reidentification_notes(profile), "stored": False, "retention": RETENTION,
            "decision": "pending: a recruiter decides"}


def _months(ym: str) -> int:
    y, m = (NOW if ym == "present" else ym).split("-")
    return int(y) * 12 + int(m)


def computed_years(roles: list[dict]) -> float:
    """Union of full-time role intervals, so overlaps are not double-counted."""
    spans = sorted((_months(r["start"]), _months(r["end"]) + 1) for r in roles if r.get("full_time", True))
    total, cur_s, cur_e = 0, None, None
    for s, e in spans:
        if cur_e is None or s > cur_e:
            if cur_e is not None:
                total += cur_e - cur_s
            cur_s, cur_e = s, e
        else:
            cur_e = max(cur_e, e)
    if cur_e is not None:
        total += cur_e - cur_s
    return round(total / 12, 1)


def score(profile: dict, cv: str) -> dict:
    cv_l = " ".join(cv.lower().split())
    rows, unverified = [], []
    for c in ROLE["rubric"]:
        quotes = [e["quote"] for e in profile.get("evidence", []) if e["criterion"] == c["id"]]
        verified = [q for q in quotes if " ".join(q.lower().split()) in cv_l]
        unverified += [{"criterion": c["id"], "quote": q} for q in quotes if q not in verified]
        rows.append({"id": c["id"], "label": c["label"], "weight": c["weight"], "must": c["must"], "met": bool(verified), "evidence": verified[0] if verified else None,
                     "points": c["weight"] if verified else 0})
    yrs = computed_years(profile.get("roles", []))
    yrs_pts = ROLE["years_weight"] if yrs >= ROLE["min_years"] else round(ROLE["years_weight"] * yrs / ROLE["min_years"])
    rows.append({"id": "years", "label": f"{ROLE['min_years']}+ years (computed from dates)", "weight": ROLE["years_weight"], "must": True, "met": yrs >= ROLE["min_years"],
                 "evidence": f"{yrs} years of full-time work by the CV's own dates", "points": yrs_pts})
    total = sum(r["points"] for r in rows)
    missing_must = [r["label"] for r in rows if r["must"] and not r["met"]]
    return {"total": total, "max": sum(c["weight"] for c in ROLE["rubric"]) + ROLE["years_weight"], "rows": rows, "computed_years": yrs, "missing_must": missing_must, "unverified_evidence": unverified}


def consistency(profile: dict, form: dict, public: dict) -> list[dict]:
    flags = []
    roles = profile.get("roles", [])
    yrs = computed_years(roles)
    if form.get("claimed_years", 0) > yrs + 1:
        flags.append({"type": "years_inflated", "severity": "high", "detail": f"Application claims {form['claimed_years']} years; the CV's dates add up to {yrs}."})
    ft = [r for r in roles if r.get("full_time", True)]
    for i, a in enumerate(ft):
        for b in ft[i + 1:]:
            overlap = min(_months(a["end"]), _months(b["end"])) - max(_months(a["start"]), _months(b["start"]))
            if overlap > 3:
                flags.append({"type": "overlapping_roles", "severity": "high", "detail": f"Full-time roles at {a['company']} and {b['company']} overlap for {overlap} months."})
    ordered = sorted(ft, key=lambda r: _months(r["start"]))
    for a, b in zip(ordered, ordered[1:]):
        gap = _months(b["start"]) - _months(a["end"]) - 1
        if gap >= 12:
            flags.append({"type": "career_gap", "severity": "info", "detail": f"{gap}-month gap between {a['company']} and {b['company']}. Not scored and not a negative signal."})
    pub = {r["company"].lower(): r["title"] for r in public.get("roles", [])}
    senior = re.compile(r"\b(senior|lead|head|principal|staff|director|manager)\b", re.I)
    for r in roles:
        p = pub.get(r["company"].lower())
        if p is None:
            flags.append({"type": "role_not_on_profile", "severity": "medium", "detail": f"{r['title']} at {r['company']} is not on the public profile. Verify employment."})
        elif bool(senior.search(r["title"])) and not senior.search(p):
            flags.append({"type": "title_inflation", "severity": "medium", "detail": f"CV says {r['title']} at {r['company']}; public profile says {p}."})
    for e in profile.get("education", []):
        if form.get("degree_year") and e.get("year") and form["degree_year"] != e["year"]:
            flags.append({"type": "degree_year_mismatch", "severity": "medium", "detail": f"{e['degree']}: CV says {e['year']}, application form says {form['degree_year']}."})
    for c in profile.get("certifications", []):
        fmt = CERT_FORMATS.get(c["name"])
        if fmt and not re.match(fmt, c.get("id", "")):
            flags.append({"type": "certificate_id_format", "severity": "medium", "detail": f"{c['name']} ID “{c.get('id')}” doesn't match the issuer's ID format. Check with the issuer."})
    for r in roles:
        if r["start"] != "present" and _months(r["start"]) > _months(NOW):
            flags.append({"type": "future_date", "severity": "high", "detail": f"{r['company']} start date {r['start']} is in the future."})
    return flags


CHECKLIST = {
    "years_inflated": "Ask the candidate to walk through their timeline; confirm dates with references.",
    "overlapping_roles": "Confirm both employments and whether either was part-time or contract.",
    "title_inflation": "Confirm job title with the employer's HR or a reference.",
    "role_not_on_profile": "Verify employment with the company directly.",
    "degree_year_mismatch": "Request the degree certificate or verify with the university.",
    "certificate_id_format": "Verify the certificate on the issuer's verification page.",
    "future_date": "Clarify the dates with the candidate.",
    "career_gap": "No action needed. Judge skills only; never ask why (family or health reasons are private) and never score the gap.",
}


def recommend(sc: dict, flags: list[dict]) -> dict:
    high = [f for f in flags if f["severity"] == "high"]
    medium = [f for f in flags if f["severity"] == "medium"]
    if sc["missing_must"]:
        rec, why = "not_a_fit_yet", f"Missing must-haves: {', '.join(sc['missing_must'])}."
    elif high:
        rec, why = "verify_first", "Strong on paper, but serious inconsistencies must be resolved before an interview."
    elif medium:
        rec, why = "interview_and_verify", "Meets the bar; some claims need checking alongside the interview."
    else:
        rec, why = "advance", "Meets every must-have with verified evidence and no inconsistencies."
    checklist = [{"item": CHECKLIST[f["type"]], "because": f["detail"]} for f in flags if f["type"] in CHECKLIST]
    return {"recommendation": rec, "why": why, "checklist": checklist, "decided_by": "a recruiter, not the system"}


def screen(cand: dict, profile: dict) -> dict:
    sc = score(profile, cand["cv"])
    flags = consistency(profile, cand["form"], cand["public"])
    return {"score": sc, "flags": flags, **recommend(sc, flags)}


# ---------------------------------------------------------------- agent tools

PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "roles": {"type": "array", "items": {"type": "object", "properties": {"title": {"type": "string"}, "company": {"type": "string"}, "start": {"type": "string", "description": "YYYY-MM"}, "end": {"type": "string", "description": "YYYY-MM or present"}, "full_time": {"type": "boolean"}},
                                              "required": ["title", "company", "start", "end", "full_time"], "additionalProperties": False}},
        "education": {"type": "array", "items": {"type": "object", "properties": {"degree": {"type": "string"}, "institution": {"type": "string"}, "year": {"type": "integer"}}, "required": ["degree", "institution", "year"], "additionalProperties": False}},
        "certifications": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}, "id": {"type": "string"}}, "required": ["name", "id"], "additionalProperties": False}},
        "evidence": {"type": "array", "description": "For each rubric criterion the CV supports, a short quote copied verbatim from the CV.",
                     "items": {"type": "object", "properties": {"criterion": {"type": "string", "enum": [c["id"] for c in ROLE["rubric"]]}, "quote": {"type": "string"}}, "required": ["criterion", "quote"], "additionalProperties": False}},
    },
    "required": ["roles", "education", "certifications", "evidence"], "additionalProperties": False,
}

TOOLS = [
    {"name": "submit_profile", "description": "Submit what the redacted CV says: roles with dates, education, certifications, and verbatim evidence quotes for rubric criteria. Quotes that don't appear in the CV will not count.",
     "input_schema": PROFILE_SCHEMA, "strict": True},
    {"name": "run_checks", "description": "Score against the rubric and compare the CV with the application form and public profile. Returns score, flags, a recommendation and a verification checklist.",
     "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False}, "strict": True},
]


def empty_state() -> dict:
    return {"profile": None, "result": None}


def execute(name: str, args: dict, cand: dict, state: dict) -> tuple[dict, dict, bool]:
    s = deepcopy(state)
    if name == "submit_profile":
        s["profile"], s["result"] = args, None
        return {"ok": True, "roles": len(args.get("roles", [])), "evidence_items": len(args.get("evidence", []))}, s, False
    if name == "run_checks":
        if not s["profile"]:
            return {"ok": False, "error": "Submit the profile first."}, s, True
        s["result"] = screen(cand, s["profile"])
        r = s["result"]
        return {"ok": True, "score": f"{r['score']['total']}/{r['score']['max']}", "recommendation": r["recommendation"], "flags": [f["detail"] for f in r["flags"]],
                "unverified_evidence": r["score"]["unverified_evidence"]}, s, False
    return {"ok": False, "error": f"Unknown tool {name}"}, s, True
