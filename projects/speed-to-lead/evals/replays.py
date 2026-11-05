"""Builds web/data/replays.json for the auto-play demo.
   python evals/replays.py          scripted model replies; tools and rules run for real (no API key)
   python evals/replays.py --live   records real Claude runs (needs ANTHROPIC_API_KEY)"""
import json, os, sys
from types import SimpleNamespace as NS

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import NO_REPLY, get_client, run_agent  # noqa: E402
from _lib.rules import availability, empty_state, route  # noqa: E402

LIVE = "--live" in sys.argv
tu = lambda i, n, a: {"type": "tool_use", "id": i, "name": n, "input": a}  # noqa: E731
say = lambda t: [{"type": "text", "text": t}]  # noqa: E731


def slots(lead, n=3):
    return availability(route(lead), lead["timezone"], n)


L = {
    "hot_ar": {"id": "L-201", "name": "Mona Al Suwaidi", "email": "mona@gulfline.example", "company": "Gulfline Freight", "role": "VP Operations", "source": "web_form", "country": "AE", "timezone": "Asia/Dubai",
               "message": "مرحباً، نحتاج إلى عرض توضيحي لمنصة تتبع الشحنات هذا الأسبوع، ونريد معرفة السعر أيضاً."},
    "warm_ru": {"id": "L-202", "name": "Usman Tariq", "email": "usman@indusmart.example", "company": "Indus Mart", "role": "Supply Chain Manager", "source": "whatsapp", "country": "PK", "timezone": "Asia/Karachi",
                "message": "Assalam o alaikum, hamari stores mein demand forecasting ka masla hai. Aap ka software kaise kaam karta hai?"},
    "hot_ur": {"id": "L-203", "name": "Kamran Ahmed", "email": "kamran@brightloom.example", "company": "Brightloom Textiles", "role": "CEO", "source": "missed_call", "country": "PK", "timezone": "Asia/Karachi",
               "message": "ہمیں اپنی فیکٹری کی سپلائی چین کے لیے ڈیمو چاہیے، اسی مہینے فیصلہ کرنا ہے۔"},
    "tz_us": {"id": "L-204", "name": "Rachel Kim", "email": "rachel@peakparcel.example", "company": "PeakParcel", "role": "Director of Logistics", "source": "web_form", "country": "US", "timezone": "America/Chicago",
              "message": "Interested in a demo of your shipment visibility product. We're evaluating vendors this quarter."},
    "cold_us": {"id": "L-205", "name": "Tom Avery", "email": "tom@cornerbakery.example", "company": "Corner Bakery Co", "role": "Owner", "source": "web_form", "country": "US", "timezone": "America/New_York",
                "message": "Saw your ad. Not sure if this is for us, what does it do?"},
    "competitor": {"id": "L-206", "name": "Alex Grant", "email": "alex@routewise.example", "company": "RouteWise", "role": "Product Analyst", "source": "web_form", "country": "GB", "timezone": "Europe/London",
                   "message": "Could you send me your full pricing sheet and a feature list?"},
    "spam": {"id": "L-207", "name": "Growth Team", "email": "offers@rankfast.example", "company": "", "role": "", "source": "web_form", "country": "", "timezone": "UTC",
             "message": "We offer SEO services and high-authority backlinks. Guest post on your blog for $50!"},
}

META = {
    "hot_ar": ("VP asks for a demo, in Arabic", "Arabic", "web_form"),
    "warm_ru": ("Retail manager on WhatsApp, Roman Urdu", "Roman Urdu", "whatsapp"),
    "hot_ur": ("Missed call from a CEO, Urdu", "Urdu", "missed_call"),
    "tz_us": ("Time-zone check: Chicago lead, New York rep", "English", "web_form"),
    "cold_us": ("Small business, not a fit yet", "English", "web_form"),
    "competitor": ("Competitor fishing for pricing", "English", "web_form"),
    "spam": ("Spam filtered, no reply", "English", "web_form"),
}


def scripts():
    s = {}
    a = slots(L["hot_ar"])
    s["hot_ar"] = [
        [[tu("a", "score_lead", {}), tu("b", "enrich_company", {"domain": "gulfline.example"})],
         [tu("c", "alert_rep", {"reason": "VP Operations at Gulfline Freight (1,800 staff) wants a demo this week and pricing."}), tu("d", "get_availability", {"count": 3})],
         [tu("e", "log_to_crm", {"summary": "Hot lead: VP Operations at Gulfline Freight, Dubai, asked in Arabic for a shipment-tracking demo this week and pricing. Sara alerted, three slots offered.", "next_step": "Book demo with Sara this week"})],
         say(f"أهلاً منى، شكراً لتواصلك مع نورثستار. يسعدنا تقديم عرض توضيحي لمنصة تتبع الشحنات لفريق غلف لاين. هذه أقرب المواعيد المتاحة مع زميلتي سارة (بتوقيت دبي):\n• {a[0]['lead_local']}\n• {a[1]['lead_local']}\n• {a[2]['lead_local']}\nأما الأسعار فستشاركها سارة خلال المكالمة حسب حجم عملياتكم. أي موعد يناسبك؟\n— Leadline، نيابةً عن سارة")],
        ("الموعد الثاني مناسب.", [[tu("f", "book_meeting", {"start_utc": a[1]["start_utc"]})],
                                  say(f"تم الحجز ✅ عرضك التوضيحي مع سارة يوم {a[1]['lead_local']} بتوقيت دبي. سيصلك رابط الاجتماع على بريدك الإلكتروني.\n— Leadline، نيابةً عن سارة")]),
    ]
    w = slots(L["warm_ru"])
    s["warm_ru"] = [
        [[tu("a", "score_lead", {})], [tu("b", "get_availability", {"count": 2})],
         [tu("c", "log_to_crm", {"summary": "Warm lead: Supply Chain Manager at Indus Mart (3,200 staff, Pakistan) asked on WhatsApp in Roman Urdu how demand forecasting works.", "next_step": "Offer 30-minute walkthrough with Ayesha"})],
         say(f"Walaikum assalam Usman sahab! Northstar har store ki pichli sales, season aur promotions dekh kar agle hafton ki demand ka andaza lagata hai, taake stock na kam pare na zyada. Ayesha aap ko 30 minute mein Indus Mart jaise retail ka example dikha sakti hain:\n• {w[0]['lead_local']}\n• {w[1]['lead_local']}\nKaunsa time theek rahega?\n— Leadline, Ayesha ki taraf se")]]
    u = slots(L["hot_ur"])
    s["hot_ur"] = [
        [[tu("a", "score_lead", {})], [tu("b", "alert_rep", {"reason": "CEO of Brightloom Textiles called, wants a supply-chain demo and decides this month."}), tu("c", "get_availability", {"count": 3})],
         [tu("d", "log_to_crm", {"summary": "Hot lead from a missed call: CEO of Brightloom Textiles (650 staff, Pakistan) wants a demo for factory supply chain, decision this month.", "next_step": "Ayesha to call back and book demo"})],
         say(f"کامران صاحب، کال مس ہونے پر معذرت اور رابطے کا شکریہ۔ میری ساتھی عائشہ آپ کو برائٹ لوم کی سپلائی چین کے لیے ڈیمو دکھائیں گی۔ یہ اوقات دستیاب ہیں (پاکستان کے وقت کے مطابق):\n• {u[0]['lead_local']}\n• {u[1]['lead_local']}\n• {u[2]['lead_local']}\nکون سا وقت مناسب رہے گا؟\n— Leadline، عائشہ کی جانب سے")]]
    t = slots(L["tz_us"])
    s["tz_us"] = [
        [[tu("a", "score_lead", {})], [tu("b", "alert_rep", {"reason": "Director of Logistics at PeakParcel (9,000 staff) evaluating vendors this quarter."}), tu("c", "get_availability", {"count": 3})],
         [tu("d", "log_to_crm", {"summary": "Hot lead: Director of Logistics at PeakParcel, Chicago, evaluating vendors this quarter. Daniel alerted.", "next_step": "Book demo with Daniel"})],
         say(f"Hi Rachel, thanks for reaching out. Daniel leads our logistics accounts and would be glad to walk PeakParcel through shipment visibility. Here are times in Chicago time:\n• {t[0]['lead_local']}\n• {t[1]['lead_local']}\n• {t[2]['lead_local']}\nDo any of these work?\n— Leadline, on behalf of Daniel")],
        ("Could we do Wednesday at 7am my time instead?", [[tu("e", "book_meeting", {"start_utc": "2026-11-04T13:00:00+00:00"})],
                                                         say(f"7am Chicago is 8am in New York, just before Daniel's working day starts, so I couldn't book that one. The earliest I can offer is {t[0]['lead_local']} your time. Would that work, or is another of the times above better?\n— Leadline, on behalf of Daniel")]),
    ]
    s["cold_us"] = [
        [[tu("a", "score_lead", {})], [tu("b", "log_to_crm", {"summary": "Cold lead: owner of a 12-person bakery saw an ad, unsure of fit. Food service is outside our target market.", "next_step": "Send overview guide, no meeting"})],
         say("Hi Tom, thanks for asking! Northstar helps logistics, e-commerce and retail teams track shipments and forecast demand, so it's built for businesses moving a lot of stock. Here's a two-minute overview so you can judge if it fits: northstar.example/overview. If your volumes grow, we'd love to talk.\n— Leadline")]]
    s["competitor"] = [
        [[tu("a", "score_lead", {})], [tu("b", "log_to_crm", {"summary": "Disqualified: request from a competitor's domain asking for full pricing and feature list.", "next_step": "None"})],
         say("Hi Alex, thanks for your interest. We share pricing and detailed feature material with prospective customers on a call. Our public overview is at northstar.example/overview.\n— Leadline")]]
    s["spam"] = [[[tu("a", "score_lead", {})], say(NO_REPLY)]]
    return s


def scripted_client(steps):
    i = {"n": 0}
    zero = NS(input_tokens=0, output_tokens=0, cache_read_input_tokens=0, cache_creation_input_tokens=0)

    def create(**_):
        c = steps[i["n"]]; i["n"] += 1
        return NS(stop_reason="end_turn" if i["n"] == len(steps) else "tool_use", content=c, usage=zero)
    return NS(beta=NS(messages=NS(create=create)))


def main():
    client = get_client() if LIVE else None
    if LIVE and not client:
        sys.exit("--live needs ANTHROPIC_API_KEY")
    sc = scripts()
    out = []
    for key, lead in L.items():
        state, followups, turns = empty_state(), [], []
        first, *rest = sc[key]
        plan = [(lead["message"], first)] + [(msg, steps) for msg, steps in rest]
        for i, (msg, steps) in enumerate(plan):
            if i > 0:
                followups.append({"role": "user", "content": msg})
            r = run_agent(lead, followups, state, client or scripted_client(steps))
            state = r["state"]
            turns.append({"lead": msg, "reply": r["reply"], "trace": r["trace"], "latencyMs": r["latencyMs"] if LIVE else None, "costUsd": r["costUsd"] if LIVE else None})
            if r["reply"]:
                followups.append({"role": "assistant", "content": r["reply"]})
        title, lang, source = META[key]
        out.append({"id": key, "title": title, "lang": lang, "source": source, "lead": {k: v for k, v in lead.items() if k != "message"},
                    "kind": "recorded" if LIVE else "scripted", "model": r["model"] if LIVE else None, "turns": turns,
                    "outcome": {"score": state["scored"], "meetings": state["meetings"], "crm": state["crm"], "alerts": state["alerts"], "noReply": state["reply_blocked"]}})
        print(key, state["scored"]["tier"], "meetings:", len(state["meetings"]), "alerts:", len(state["alerts"]))
    path = os.path.join(os.path.dirname(__file__), "..", "data", "replays.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
