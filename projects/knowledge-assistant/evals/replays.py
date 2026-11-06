"""Builds data/replays.json (scripted model, real permission-filtered retrieval and citation guard).   python evals/replays.py [--live]"""
import json, os, sys
from types import SimpleNamespace as NS

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import get_client, run_agent  # noqa: E402

LIVE = "--live" in sys.argv
S = [
    ("bands_emp", "employee", "Employee asks for salary bands", "What's the salary band for a Senior Software Engineer?", ["salary band senior software engineer"],
     "I couldn't find salary bands in the documents available to you. HR can tell you the band for your role."),
    ("bands_hr", "hr", "HR asks the same question", "What's the salary band for a Senior Software Engineer?", ["salary band senior software engineer"],
     "Senior Software Engineers are banded at 95,000 to 128,000 USD [HR-BANDS#1]."),
    ("hotel", "employee", "Old policy quietly retired", "What's the hotel limit in London?", ["hotel limit London per night"],
     "Hotels in London are reimbursed up to 180 USD per night [FIN-TRAVEL-2026#1]. Submit the claim in the finance portal within 30 days [FIN-TRAVEL-2026#4]."),
    ("leave_ru", "employee", "Roman Urdu question", "Mujhe saal mein kitni chuttiyan milti hain?", ["annual leave days per year"],
     "Aap ko har saal 24 din ki paid annual leave milti hai, aur 5 din agle saal tak carry over ho sakte hain jo 31 March tak use karne hon ge [HR-LEAVE#1]."),
    ("laptop", "employee", "Stolen laptop, urgent", "My laptop was stolen at the airport, what do I do?", ["lost stolen laptop report"],
     "Report it to the IT service desk within 1 hour on extension 4357 or it-help@halcyon.example; IT will wipe it remotely [IT-SEC#2]."),
    ("oncall", "employee", "On-call engineer at 3 a.m.", "Webhook queue backlog is at 80k and tracking is degraded in one region. What now?", ["carrier webhook queue backlog", "severity levels degraded tracking region"],
     "This is a SEV2: respond within 30 minutes [ENG-ONCALL#1]. With a backlog above 50,000, scale the consumers to 12 replicas after checking the dashboard [ENG-ONCALL#2]."),
    ("discount", "manager", "Sales manager checks discount authority", "Can I approve a 25% discount for a big customer?", ["discount authority approval"],
     "No. Sales managers can approve up to 20%; anything above 20% needs CFO approval [FIN-PRICING#2]."),
    ("wifi", "employee", "Not in the documents", "What's the office wifi password?", ["office wifi password"],
     "The wifi password is usually posted in the kitchen."),
]


def scripted(queries, answer):
    steps = [[{"type": "tool_use", "id": f"q{i}", "name": "search_docs", "input": {"query": q}} for i, q in enumerate(queries)], [{"type": "text", "text": answer}]]
    i = {"n": 0}
    z = NS(input_tokens=0, output_tokens=0, cache_read_input_tokens=0, cache_creation_input_tokens=0)

    def create(**_):
        c = steps[i["n"]]; i["n"] += 1
        return NS(stop_reason="end_turn" if i["n"] == 2 else "tool_use", content=c, usage=z)
    return NS(beta=NS(messages=NS(create=create)))


client = get_client() if LIVE else None
if LIVE and not client:
    sys.exit("--live needs ANTHROPIC_API_KEY")
out = []
for sid, role, title, q, queries, ans in S:
    r = run_agent(q, role, client or scripted(queries, ans))
    out.append({"id": sid, "role": role, "title": title, "question": q, "kind": "recorded" if LIVE else "scripted", "model": r["model"] if LIVE else None, **{k: r[k] for k in ("reply", "raw_reply", "guarded", "citations", "trace")}})
    print(sid, "guarded" if r["guarded"] else "ok", r["citations"]["cited"])
json.dump(out, open(os.path.join(os.path.dirname(__file__), "..", "data", "replays.json"), "w"), indent=2, ensure_ascii=False)
