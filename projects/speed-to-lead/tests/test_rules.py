from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from _lib.rules import availability, empty_state, execute, route, score_lead, slot_ok
from _lib.session import sign, verify
from _lib.pii import redact

UTC = timezone.utc


def lead(**kw):
    base = {"id": "L1", "name": "Test", "email": "ops@gulfline.example", "company": "", "role": "Head of Operations", "source": "web_form",
            "country": "AE", "timezone": "Asia/Dubai", "message": "We'd like a demo and pricing this quarter."}
    base.update(kw)
    return base


def test_ideal_lead_is_hot_with_reasons():
    s = score_lead(lead())
    assert s["tier"] == "hot" and s["score"] >= 75 and len(s["reasons"]) >= 4


def test_small_off_target_company_is_cold():
    assert score_lead(lead(email="owner@cornerbakery.example", role="Owner", message="Just curious what you do.", country="US"))["tier"] == "cold"


def test_personal_email_is_penalised():
    a = score_lead(lead(email="x@gulfline.example"))["score"]
    b = score_lead(lead(email="x@gmail.com"))["score"]
    assert b < a


def test_competitor_is_disqualified():
    assert score_lead(lead(email="analyst@routewise.example"))["tier"] == "disqualified"


def test_student_is_disqualified():
    assert score_lead(lead(message="I'm a student writing my thesis on logistics software"))["tier"] == "disqualified"


def test_spam_is_detected():
    assert score_lead(lead(message="We offer SEO services and backlinks, cheap!"))["tier"] == "spam"


def test_intent_raises_score_and_is_capped():
    low = score_lead(lead(message="Hello."))["score"]
    high = score_lead(lead(message="demo pricing budget quote asap urgent this quarter contract"))["score"]
    assert high > low and high - low <= 20


def test_multilingual_intent_terms_count():
    assert score_lead(lead(message="ہمیں ڈیمو چاہیے"))["score"] > score_lead(lead(message="سلام"))["score"]


def test_routing_by_region():
    assert route(lead(email="a@souqcart.example")) == "sara"
    assert route(lead(email="a@indusmart.example")) == "ayesha"
    assert route(lead(email="a@peakparcel.example")) == "daniel"


def test_slots_are_in_rep_hours_and_shown_in_lead_timezone():
    slots = availability("daniel", "Asia/Karachi", 3)
    assert len(slots) == 3
    for s in slots:
        start = datetime.fromisoformat(s["start_utc"])
        ny = start.astimezone(ZoneInfo("America/New_York"))
        assert 9 <= ny.hour < 17 and ny.weekday() < 5
        assert s["lead_local"] == start.astimezone(ZoneInfo("Asia/Karachi")).strftime("%a %d %b, %H:%M")


def test_slot_rules():
    # 03:00 New York is outside hours
    assert "working hours" in slot_ok("daniel", datetime(2026, 11, 4, 8, 0, tzinfo=UTC), [])
    # busy block 09:00-10:30 New York on 3 Nov
    assert slot_ok("daniel", datetime(2026, 11, 3, 14, 30, tzinfo=UTC), []) == "Rep is busy at that time"
    # weekend
    assert "weekend" in slot_ok("sara", datetime(2026, 11, 7, 8, 0, tzinfo=UTC), [])
    # in the past
    assert "past" in slot_ok("sara", datetime(2026, 11, 2, 8, 0, tzinfo=UTC), [])
    # a valid one: Wed 4 Nov 10:00 Dubai = 06:00 UTC
    assert slot_ok("sara", datetime(2026, 11, 4, 6, 0, tzinfo=UTC), []) is None


def test_tools_require_scoring_first():
    out, st, err = execute("book_meeting", {"start_utc": "2026-11-04T06:00:00+00:00"}, lead(), empty_state())
    assert err and not st["meetings"]


def test_booking_flow_and_no_double_booking():
    _, st, _ = execute("score_lead", {}, lead(), empty_state())
    out, st, err = execute("book_meeting", {"start_utc": "2026-11-04T06:00:00+00:00"}, lead(), st)
    assert not err and out["rep"] == "Sara Haddad" and st["meetings"]
    out, st, err = execute("book_meeting", {"start_utc": "2026-11-04T07:00:00+00:00"}, lead(), st)
    assert err


def test_booking_rejects_naive_times_and_bad_hours():
    _, st, _ = execute("score_lead", {}, lead(), empty_state())
    assert execute("book_meeting", {"start_utc": "2026-11-04T06:00:00"}, lead(), st)[2]
    assert execute("book_meeting", {"start_utc": "2026-11-04T16:00:00+00:00"}, lead(), st)[2]  # 20:00 Dubai


def test_cold_leads_get_no_meetings_and_no_alerts():
    cold = lead(email="owner@cornerbakery.example", role="Owner", message="Just curious.", country="US")
    _, st, _ = execute("score_lead", {}, cold, empty_state())
    assert execute("get_availability", {"count": 3}, cold, st)[2]
    assert execute("alert_rep", {"reason": "x"}, cold, st)[2]


def test_alert_only_for_hot_and_only_once():
    _, st, _ = execute("score_lead", {}, lead(), empty_state())
    _, st, err = execute("alert_rep", {"reason": "Demo request"}, lead(), st)
    assert not err and len(st["alerts"]) == 1
    assert execute("alert_rep", {"reason": "again"}, lead(), st)[2]


def test_spam_blocks_reply():
    spam = lead(message="crypto loan offer, guest post backlinks")
    _, st, _ = execute("score_lead", {}, spam, empty_state())
    assert st["reply_blocked"] is True


def test_signed_state_round_trip_and_tamper_detection():
    tok = sign({"meetings": []})
    assert verify(tok) == {"meetings": []}
    body, mac = tok.split(".")
    assert verify(body + "x." + mac) is False


def test_pii_redaction():
    r = redact({"email": "sara.k@souqcart.example", "phone": "+971 50 123 4567"})
    assert "sara.k@" not in r["email"] and "[phone]" in r["phone"]


def test_late_night_slot_rejected_across_midnight():
    # 23:30 Dubai = 19:30 UTC; ends at 00:00 next day
    assert "working hours" in slot_ok("sara", datetime(2026, 11, 3, 19, 30, tzinfo=UTC), [])
    assert "working hours" in slot_ok("sara", datetime(2026, 11, 4, 13, 0, tzinfo=UTC), [])  # 17:00 start


def test_every_suggested_slot_is_valid():
    for rep in ("sara", "ayesha", "daniel"):
        for s in availability(rep, "UTC", 5):
            assert slot_ok(rep, datetime.fromisoformat(s["start_utc"]), []) is None
