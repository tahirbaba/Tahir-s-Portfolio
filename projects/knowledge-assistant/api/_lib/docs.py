"""Synthetic company knowledge base for Compass (company: Halcyon Logistics). Each section is a chunk.
access = roles allowed to read it. superseded_by = newer document id (older versions are never retrieved)."""

ROLES = ["employee", "manager", "hr", "finance"]
ALL = ROLES

DOCS = [
    {"id": "HR-LEAVE", "title": "Leave policy", "updated": "2026-01-10", "access": ALL, "sections": [
        ("Annual leave", "Full-time employees get 24 days of paid annual leave per calendar year, plus public holidays. Up to 5 unused days can be carried over to the next year and must be used by 31 March."),
        ("Sick leave", "Employees get 12 days of paid sick leave per year. A doctor's note is required for absences longer than 2 consecutive days."),
        ("Parental leave", "Birthing parents get 16 weeks of fully paid parental leave. Other parents get 6 weeks of fully paid leave, which can be taken within the first year."),
        ("Requesting leave", "Request leave in the HR portal at least 2 weeks in advance for absences of 3 days or more. Your manager approves it within 3 working days."),
    ]},
    {"id": "IT-SEC", "title": "IT security policy", "updated": "2026-03-02", "access": ALL, "sections": [
        ("Passwords and MFA", "Use a password manager. Multi-factor authentication is mandatory for email, the VPN and all finance systems. Passwords must be at least 14 characters."),
        ("Lost or stolen devices", "Report a lost or stolen laptop or phone to the IT service desk within 1 hour on extension 4357 or it-help@halcyon.example. IT will wipe the device remotely."),
        ("Phishing", "Forward suspicious emails to phish@halcyon.example and delete them. Never approve an MFA prompt you did not start."),
        ("AI tools", "Do not paste customer data, contracts or source code into public AI tools. Use the company's approved AI assistant, which keeps data inside Halcyon."),
    ]},
    {"id": "FIN-TRAVEL-2024", "title": "Travel and expenses policy (2024)", "updated": "2024-02-01", "access": ALL, "superseded_by": "FIN-TRAVEL-2026", "sections": [
        ("Hotels", "Hotel stays are reimbursed up to 120 USD per night."),
        ("Meals", "Meals are reimbursed up to 40 USD per day while travelling."),
    ]},
    {"id": "FIN-TRAVEL-2026", "title": "Travel and expenses policy (2026)", "updated": "2026-02-15", "access": ALL, "sections": [
        ("Hotels", "Hotel stays are reimbursed up to 180 USD per night in Dubai, London and New York, and up to 140 USD per night elsewhere."),
        ("Meals", "Meals are reimbursed up to 60 USD per day while travelling, with receipts."),
        ("Flights", "Book economy class for flights under 6 hours. Business class is allowed for flights over 6 hours with director approval."),
        ("Submitting expenses", "Submit expenses in the finance portal within 30 days of the trip. Claims are paid in the next monthly payroll run."),
    ]},
    {"id": "ENG-ONCALL", "title": "On-call runbook: shipment tracking API", "updated": "2026-09-20", "access": ALL, "sections": [
        ("Severity levels", "SEV1 means customers cannot track any shipments; page the on-call engineer immediately and open an incident channel. SEV2 means degraded tracking for one region; respond within 30 minutes."),
        ("First steps", "Check the tracking API dashboard for error rate and latency, then check the carrier webhook queue. If the queue backlog is above 50,000 messages, scale the consumers to 12 replicas."),
        ("Escalation", "If a SEV1 is not mitigated within 45 minutes, escalate to the engineering manager on duty and notify customer support."),
    ]},
    {"id": "MGR-PERF", "title": "Manager guide: performance reviews", "updated": "2026-05-12", "access": ["manager", "hr"], "sections": [
        ("Review cycle", "Performance reviews run twice a year, in June and December. Managers submit ratings in the HR portal by the 15th of the month."),
        ("Ratings", "Use the five-point scale. No more than 15% of a team may be rated 5 (exceptional) without HR calibration."),
        ("Underperformance", "Before starting a performance improvement plan, managers must hold two documented coaching conversations and involve their HR partner."),
    ]},
    {"id": "HR-BANDS", "title": "Salary bands 2026", "updated": "2026-01-05", "access": ["hr"], "sections": [
        ("Engineering bands", "Software Engineer II: 70,000 to 92,000 USD. Senior Software Engineer: 95,000 to 128,000 USD. Staff Engineer: 130,000 to 165,000 USD."),
        ("Operations bands", "Operations Coordinator: 38,000 to 50,000 USD. Operations Manager: 62,000 to 84,000 USD."),
    ]},
    {"id": "FIN-PRICING", "title": "Enterprise pricing and discount authority", "updated": "2026-07-01", "access": ["finance", "manager"], "sections": [
        ("List price", "Enterprise tracking is priced at 0.42 USD per shipment for the first 1 million shipments a month, then 0.31 USD."),
        ("Discount authority", "Account managers may discount up to 10%. Sales managers may approve up to 20%. Anything above 20% needs CFO approval."),
    ]},
    {"id": "FIN-CLOSE", "title": "Month-end close calendar", "updated": "2026-08-01", "access": ["finance"], "sections": [
        ("Close timeline", "Accruals are due on working day 2, intercompany reconciliations on working day 3, and the close is locked on working day 5."),
    ]},
]


def chunks() -> list[dict]:
    out = []
    for d in DOCS:
        for i, (heading, text) in enumerate(d["sections"], 1):
            out.append({"id": f"{d['id']}#{i}", "doc": d["id"], "title": d["title"], "heading": heading, "text": text, "access": d["access"],
                        "updated": d["updated"], "superseded_by": d.get("superseded_by")})
    return out
