"""Builds evals/dataset.json: inbound leads in four languages with the behaviour the business expects.
The expected tier comes from the deterministic scorer, so the eval tests whether the agent follows policy."""
import json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.rules import route, score_lead  # noqa: E402

MSG = {
    "demo": {"en": "We'd like a demo this month and pricing for {company}.", "ar": "نرغب في عرض توضيحي هذا الشهر ومعرفة السعر لشركة {company}.",
             "ur": "ہمیں اس مہینے {company} کے لیے ڈیمو اور قیمت کی معلومات چاہیے۔", "roman_ur": "Humein is mahine {company} ke liye demo aur price ki maloomat chahiye."},
    "curious": {"en": "What exactly does your product do?", "ar": "ما الذي يفعله منتجكم بالضبط؟", "ur": "آپ کا پروڈکٹ اصل میں کیا کرتا ہے؟", "roman_ur": "Aap ka product asal mein kya karta hai?"},
    "student": {"en": "I'm a student working on my thesis about logistics software, can you share data?", "ar": "I'm a student working on my thesis, can you help?", "ur": "I'm a student working on my thesis, can you help?", "roman_ur": "Main student hoon, thesis ke liye help chahiye. I'm a student."},
    "spam": {"en": "SEO services and backlinks for your site, guest post only $40", "ar": "SEO services and backlinks, guest post $40", "ur": "SEO services and backlinks, guest post $40", "roman_ur": "SEO services aur backlinks, guest post sirf $40"},
}
PEOPLE = [
    ("Hana", "hana@gulfline.example", "Gulfline Freight", "Director of Operations", "AE", "Asia/Dubai"),
    ("Faisal", "faisal@souqcart.example", "SouqCart", "Head of Logistics", "SA", "Asia/Riyadh"),
    ("Sana", "sana@indusmart.example", "Indus Mart", "Supply Chain Manager", "PK", "Asia/Karachi"),
    ("Oliver", "oliver@harbourway.example", "Harbourway Logistics", "COO", "GB", "Europe/London"),
    ("Priya", "priya@peakparcel.example", "PeakParcel", "VP Supply Chain", "US", "America/Los_Angeles"),
    ("Tom", "tom@cornerbakery.example", "Corner Bakery Co", "Owner", "US", "America/New_York"),
    ("Jess", "jess@pixelpets.example", "Pixel Pets", "Marketing Assistant", "GB", "Europe/London"),
    ("Alex", "alex@routewise.example", "RouteWise", "Product Analyst", "GB", "Europe/London"),
]
cases = []
for lang in ("en", "ar", "ur", "roman_ur"):
    for name, email, company, role, country, tz in PEOPLE:
        kind = "curious" if company in ("Corner Bakery Co", "Pixel Pets", "Indus Mart", "Harbourway Logistics") else "demo"
        lead = {"id": f"E{len(cases)+1:03d}", "name": name, "email": email, "company": company, "role": role, "source": "web_form", "country": country, "timezone": tz,
                "message": MSG[kind][lang].format(company=company)}
        cases.append({"lead": lead, "language": lang, "category": kind if company != "RouteWise" else "competitor"})
    for kind in ("student", "spam"):
        lead = {"id": f"E{len(cases)+1:03d}", "name": "Visitor", "email": "visitor@gmail.com", "company": "", "role": "", "source": "web_form", "country": "", "timezone": "UTC", "message": MSG[kind][lang]}
        cases.append({"lead": lead, "language": lang, "category": kind})
    # booking follow-up: valid and invalid proposed times
    lead = {"id": f"E{len(cases)+1:03d}", "name": "Hana", "email": "hana@gulfline.example", "company": "Gulfline Freight", "role": "Director of Operations", "source": "web_form", "country": "AE", "timezone": "Asia/Dubai", "message": MSG["demo"][lang].format(company="Gulfline Freight")}
    cases.append({"lead": lead, "language": lang, "category": "booking_valid", "followup": {"en": "Wednesday 4 November at 10:00 Dubai time works.", "ar": "الأربعاء 4 نوفمبر الساعة 10:00 بتوقيت دبي مناسب.", "ur": "بدھ 4 نومبر صبح 10 بجے دبئی وقت ٹھیک ہے۔", "roman_ur": "Budh 4 November subah 10 baje Dubai time theek hai."}[lang]})
    cases.append({"lead": {**lead, "id": f"E{len(cases)+1:03d}"}, "language": lang, "category": "booking_invalid", "followup": {"en": "Can we do Wednesday at 8pm Dubai time?", "ar": "هل يمكن يوم الأربعاء الساعة 8 مساءً بتوقيت دبي؟", "ur": "کیا بدھ رات 8 بجے دبئی وقت ہو سکتا ہے؟", "roman_ur": "Kya Budh raat 8 baje Dubai time ho sakta hai?"}[lang]})

for c in cases:
    sc = score_lead(c["lead"])
    c["expect"] = {"tier": sc["tier"], "rep": route(c["lead"]) if sc["tier"] in ("hot", "warm", "cold") else None,
                   "alert": sc["tier"] == "hot", "offer_slots": sc["tier"] in ("hot", "warm"), "reply": sc["tier"] != "spam",
                   "meeting": c["category"] == "booking_valid", "crm": sc["tier"] != "spam"}

with open(os.path.join(os.path.dirname(__file__), "dataset.json"), "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
from collections import Counter  # noqa: E402
print(len(cases), "cases", Counter(c["expect"]["tier"] for c in cases), Counter(c["category"] for c in cases))
