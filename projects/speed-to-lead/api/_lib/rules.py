"""Business rules for Leadline, enforced in code. The model asks; these functions decide."""
from __future__ import annotations

import re
from copy import deepcopy
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from .data import BUSY, COMPANIES, COMPETITOR_DOMAINS, FREE_EMAIL_DOMAINS, ICP, NOW, REPS

SLOT_MINUTES = 30
WORK_START, WORK_END = 9, 17  # rep local hours
HOT, WARM = 75, 50

INTENT_TERMS = {
    "pricing": 6, "price": 6, "quote": 6, "demo": 8, "trial": 5, "budget": 6, "this quarter": 6,
    "this month": 6, "asap": 5, "urgent": 5, "replace": 4, "rollout": 4, "contract": 5,
    "سعر": 6, "عرض": 6, "تجربة": 5, "قیمت": 6, "ڈیمو": 8, "demo chahiye": 8, "price kya": 6,
}
SPAM_PATTERNS = [r"https?://\S+\.(ru|xyz|top)\b", r"\bseo services?\b", r"\bcrypto\b", r"\bguest post\b", r"\bbacklinks?\b", r"\bloan offer\b"]
NOT_BUYER_PATTERNS = [r"\b(student|thesis|assignment|internship|job opening|hiring\?|cv attached|my resume)\b"]


def domain_of(email: str) -> str:
    return email.split("@")[-1].strip().lower() if "@" in email else ""


def enrich(domain: str) -> dict:
    c = COMPANIES.get(domain.lower())
    if not c:
        return {"found": False, "domain": domain}
    return {"found": True, "domain": domain, **c}


def seniority_of(role: str) -> str:
    r = role.lower()
    if re.search(r"\b(ceo|cto|coo|cfo|founder|owner|chief|managing director)\b", r):
        return "c_level"
    if re.search(r"\b(vp|vice president)\b", r):
        return "vp"
    if "director" in r:
        return "director"
    if "head" in r:
        return "head"
    if "manager" in r or "lead" in r:
        return "manager"
    return "individual"


def score_lead(lead: dict) -> dict:
    """Deterministic fit + intent score (0-100) with reasons and a tier."""
    msg = (lead.get("message") or "").lower()
    domain = domain_of(lead.get("email", ""))
    reasons: list[str] = []

    if any(re.search(p, msg) for p in SPAM_PATTERNS):
        return {"score": 0, "tier": "spam", "reasons": ["Message matches spam patterns"]}
    if domain in COMPETITOR_DOMAINS:
        return {"score": 0, "tier": "disqualified", "reasons": ["Email domain belongs to a competitor"]}
    if any(re.search(p, msg) for p in NOT_BUYER_PATTERNS):
        return {"score": 0, "tier": "disqualified", "reasons": ["Not a buying enquiry (student, job seeker or research request)"]}

    company = enrich(domain)
    score = 0
    if company["found"]:
        ind = ICP["industries"].get(company["industry"], 0)
        score += ind
        reasons.append(f"Industry {company['industry']} (+{ind})")
        for lo, hi, pts in ICP["employees"]:
            if lo <= company["employees"] <= hi:
                score += pts
                reasons.append(f"{company['employees']} employees (+{pts})")
                break
        else:
            reasons.append(f"{company['employees']} employees, below target size (+0)")
        reg = ICP["regions"].get(company["country"], 0)
        score += reg
        reasons.append(f"Region {company['country']} (+{reg})")
    else:
        reasons.append("Company not found in enrichment data (+0)")

    sen = seniority_of(lead.get("role", ""))
    pts = ICP["seniority"][sen]
    score += pts
    reasons.append(f"Seniority {sen} (+{pts})")

    intent = 0
    for term, w in INTENT_TERMS.items():
        if term in msg:
            intent += w
    intent = min(intent, 20)
    if intent:
        score += intent
        reasons.append(f"Buying intent in message (+{intent})")

    if domain in FREE_EMAIL_DOMAINS:
        score -= 15
        reasons.append("Personal email address (-15)")

    score = max(0, min(100, score))
    tier = "hot" if score >= HOT else "warm" if score >= WARM else "cold"
    return {"score": score, "tier": tier, "reasons": reasons}


def route(lead: dict) -> str:
    country = enrich(domain_of(lead.get("email", ""))).get("country") or lead.get("country", "")
    for key, rep in REPS.items():
        if country in rep["regions"]:
            return key
    return "ayesha"


def _busy(rep: str, start: datetime, end: datetime) -> bool:
    tz = ZoneInfo(REPS[rep]["tz"])
    for s, e in BUSY[rep]:
        bs = datetime.fromisoformat(s).replace(tzinfo=tz)
        be = datetime.fromisoformat(e).replace(tzinfo=tz)
        if start < be and end > bs:
            return True
    return False


def slot_ok(rep: str, start: datetime, booked: list[str]) -> str | None:
    """Return None if the slot is bookable, else the reason it is not."""
    if rep not in REPS:
        return "Unknown rep"
    tz = ZoneInfo(REPS[rep]["tz"])
    local = start.astimezone(tz)
    end = start + timedelta(minutes=SLOT_MINUTES)
    if start <= NOW + timedelta(hours=1):
        return "Slot is in the past or less than one hour away"
    if local.weekday() >= 5:
        return "Rep does not take meetings at weekends"
    local_end = local + timedelta(minutes=SLOT_MINUTES)
    ends_in_hours = local_end.date() == local.date() and (local_end.hour < WORK_END or (local_end.hour == WORK_END and local_end.minute == 0))
    if not (local.hour >= WORK_START and ends_in_hours and local.minute in (0, 30)):
        return f"Outside {REPS[rep]['name']}'s working hours ({WORK_START}:00-{WORK_END}:00 {REPS[rep]['tz']})"
    if _busy(rep, start, end) or start.isoformat() in booked:
        return "Rep is busy at that time"
    return None


def availability(rep: str, lead_tz: str, count: int = 3, booked: list[str] | None = None) -> list[dict]:
    booked = booked or []
    tz = ZoneInfo(REPS[rep]["tz"])
    ltz = ZoneInfo(lead_tz)
    cur = NOW.astimezone(tz).replace(minute=0, second=0, microsecond=0) + timedelta(hours=2)
    out = []
    while len(out) < count and cur < NOW + timedelta(days=10):
        if slot_ok(rep, cur, booked) is None:
            local = cur.astimezone(ltz)
            out.append({"start_utc": cur.astimezone(ZoneInfo("UTC")).isoformat(), "lead_local": local.strftime("%a %d %b, %H:%M"), "lead_tz": lead_tz})
            cur += timedelta(hours=3)  # spread suggestions out
        else:
            cur += timedelta(minutes=SLOT_MINUTES)
    return out


# ---------------------------------------------------------------- session + tools

def empty_state() -> dict:
    return {"scored": None, "rep": None, "meetings": [], "crm": None, "alerts": [], "reply_blocked": False}


TOOLS = [
    {"name": "enrich_company", "description": "Look up the lead's company from their email domain: industry, size and country.",
     "input_schema": {"type": "object", "properties": {"domain": {"type": "string"}}, "required": ["domain"], "additionalProperties": False}, "strict": True},
    {"name": "score_lead", "description": "Score the current lead against the ideal customer profile. Returns score 0-100, tier (hot, warm, cold, disqualified, spam) and reasons. Always call this before replying.",
     "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False}, "strict": True},
    {"name": "get_availability", "description": "Get the next free 30-minute meeting slots for the routed sales rep, shown in the lead's time zone.",
     "input_schema": {"type": "object", "properties": {"count": {"type": "integer"}}, "required": ["count"], "additionalProperties": False}, "strict": True},
    {"name": "book_meeting", "description": "Book a meeting with the routed rep at a UTC start time taken from get_availability or agreed with the lead. Validates working hours, conflicts and time zones.",
     "input_schema": {"type": "object", "properties": {"start_utc": {"type": "string", "description": "ISO 8601 UTC, e.g. 2026-11-04T07:00:00+00:00"}}, "required": ["start_utc"], "additionalProperties": False}, "strict": True},
    {"name": "log_to_crm", "description": "Create or update the CRM record for this lead with tier, a one-paragraph summary in English and the next step.",
     "input_schema": {"type": "object", "properties": {"summary": {"type": "string"}, "next_step": {"type": "string"}}, "required": ["summary", "next_step"], "additionalProperties": False}, "strict": True},
    {"name": "alert_rep", "description": "Send an instant alert to the routed rep. Only allowed for hot leads.",
     "input_schema": {"type": "object", "properties": {"reason": {"type": "string"}}, "required": ["reason"], "additionalProperties": False}, "strict": True},
]


def execute(name: str, args: dict, lead: dict, state: dict) -> tuple[dict, dict, bool]:
    """Run a tool. Returns (result, new_state, is_error)."""
    s = deepcopy(state)

    def fail(msg: str):
        return {"ok": False, "error": msg}, s, True

    if name == "enrich_company":
        return {"ok": True, **enrich(str(args.get("domain", "")))}, s, False

    if name == "score_lead":
        sc = score_lead(lead)
        s["scored"] = sc
        s["rep"] = route(lead) if sc["tier"] in ("hot", "warm", "cold") else None
        if sc["tier"] == "spam":
            s["reply_blocked"] = True
        rep = REPS[s["rep"]] if s["rep"] else None
        return {"ok": True, **sc, "routed_rep": rep["name"] if rep else None, "rep_tz": rep["tz"] if rep else None,
                "policy": {"hot": "alert rep, reply, offer meeting", "warm": "reply and offer meeting", "cold": "reply with resources, no meeting push",
                           "disqualified": "short polite reply, no meeting, no alert", "spam": "do not reply"}[sc["tier"]]}, s, False

    if not s["scored"]:
        return fail("Call score_lead first.")
    tier = s["scored"]["tier"]

    if name == "get_availability":
        if tier not in ("hot", "warm"):
            return fail(f"Meetings are only offered to hot and warm leads; this lead is {tier}.")
        n = max(1, min(int(args.get("count", 3) or 3), 5))
        return {"ok": True, "rep": REPS[s["rep"]]["name"], "slots": availability(s["rep"], lead.get("timezone", "UTC"), n, [m["start_utc"] for m in s["meetings"]])}, s, False

    if name == "book_meeting":
        if tier not in ("hot", "warm"):
            return fail(f"Meetings can only be booked for hot and warm leads; this lead is {tier}.")
        if s["meetings"]:
            return fail("This lead already has a meeting booked.")
        try:
            start = datetime.fromisoformat(str(args.get("start_utc", "")).replace("Z", "+00:00"))
            if start.tzinfo is None:
                return fail("start_utc must include a UTC offset.")
        except ValueError:
            return fail("start_utc is not a valid ISO 8601 time.")
        why = slot_ok(s["rep"], start, [m["start_utc"] for m in s["meetings"]])
        if why:
            return fail(why)
        mt = {"id": f"MTG-{7000 + len(s['meetings']) + 1}", "start_utc": start.astimezone(ZoneInfo("UTC")).isoformat(), "rep": REPS[s["rep"]]["name"],
              "lead_local": start.astimezone(ZoneInfo(lead.get("timezone", "UTC"))).strftime("%a %d %b, %H:%M"),
              "rep_local": start.astimezone(ZoneInfo(REPS[s["rep"]]["tz"])).strftime("%a %d %b, %H:%M")}
        s["meetings"].append(mt)
        return {"ok": True, **mt}, s, False

    if name == "log_to_crm":
        s["crm"] = {"id": f"CRM-{lead.get('id', 'L')}", "tier": tier, "score": s["scored"]["score"], "rep": REPS[s["rep"]]["name"] if s["rep"] else None,
                    "summary": str(args.get("summary", ""))[:800], "next_step": str(args.get("next_step", ""))[:200]}
        return {"ok": True, "record_id": s["crm"]["id"]}, s, False

    if name == "alert_rep":
        if tier != "hot":
            return fail(f"Instant alerts are only for hot leads; this lead is {tier}.")
        if s["alerts"]:
            return fail("Rep already alerted for this lead.")
        s["alerts"].append({"rep": REPS[s["rep"]]["name"], "reason": str(args.get("reason", ""))[:300]})
        return {"ok": True, "alerted": REPS[s["rep"]]["name"]}, s, False

    return fail(f"Unknown tool {name}")
