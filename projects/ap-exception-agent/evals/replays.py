"""Builds data/replays.json: each demo invoice processed by the agent (scripted model, real controls).
   python evals/replays.py [--live]"""
import json, os, sys
from types import SimpleNamespace as NS

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import get_client, run_agent  # noqa: E402
from _lib.invoices import INVOICES  # noqa: E402

LIVE = "--live" in sys.argv
tu = lambda i, n, a: {"type": "tool_use", "id": i, "name": n, "input": a}  # noqa: E731
NOTES = {
    "clean": None,
    "partial": ("Toner billed 20 but only 14 received on PO-5002. Paper line matches. Hold toner portion until the remaining 6 arrive or ask for a corrected invoice.",
                "مرحباً، استلمنا 14 خرطوشة حبر فقط من أصل 20 في أمر الشراء PO-5002. نرجو إرسال فاتورة معدلة بالكمية المستلمة، أو إشعارنا بموعد توريد الباقي. شكراً. / We received 14 of 20 toner cartridges on PO-5002; please send a corrected invoice or confirm delivery of the remaining 6."),
    "price": ("Laptop setup billed at 105.00 GBP vs PO price 95.00 (+10.5%). IT support line matches. Overcharge is 80.00 GBP plus VAT.",
              "Hi Northline team, invoice NIT-1193 bills laptop setup at £105 per unit, but PO-5004 agreed £95. Could you reissue the invoice at the PO price? Thanks."),
    "duplicate": ("GP-2291 was already posted on 12 Oct. This is a reminder copy; do not pay again.",
                  "Hello Gulf Packaging, invoice GP-2291 was paid in our 12 October run. Please check your records; nothing further is due on it."),
    "bank": ("Invoice asks to pay a NEW bank account (Meezan, ends 0001) instead of the one on file (ends 6702). Classic payment-redirection fraud pattern. Call Indus Logistics on the number in the vendor master, not the one on the invoice, before any change.", ""),
    "approval": ("Clean invoice: matched to PO-5004 and receipts, VAT correct, bank verified. Total 6,672 GBP is over the 5,000 auto-post limit, so it needs controller approval.", ""),
    "tax": ("VAT charged at 10% (1,520 AED); UAE VAT is 5%, so it should be 760 AED. Total overstated by 760 AED.",
            "Hello Gulf Packaging, invoice GP-2355 shows VAT at 10%. UAE VAT is 5% (760.00 AED on 15,200.00). Please send a corrected tax invoice. Thank you."),
}
REPLY = {
    "clean": "GP-2340 from Gulf Packaging matched PO-5001 and the goods receipt, VAT is correct and the bank account is on file, so it was posted for payment (8,767.50 AED).",
    "partial": "ROS-77810 is in the exception queue: 20 toner cartridges were billed but only 14 have been received. A bilingual note to the vendor is drafted.",
    "price": "NIT-1193 is in the exception queue because laptop setup is billed 10.5% above the PO price. A note asking Northline to reissue at £95 is drafted.",
    "duplicate": "GP-2291 was rejected as a duplicate: it was already posted on 12 October. A short note to the vendor is drafted.",
    "bank": "IL-8890 is on hold: it asks for payment to a new bank account. Please verify by calling Indus Logistics on the number in the vendor master. No message was drafted to the vendor on purpose.",
    "approval": "NIT-1201 passed every control but is above the 5,000 GBP auto-post limit, so it is waiting for controller approval.",
    "tax": "GP-2355 is in the exception queue: VAT was charged at 10% instead of the UAE's 5%, overstating the total by 760 AED. A correction request is drafted.",
}


def scripted(inv):
    steps = [[tu("a", "submit_extraction", inv["fields"])], [tu("b", "run_controls", {})]]
    n = NOTES[inv["id"]]
    steps.append([tu("c", "post_to_erp", {})] if n is None else [tu("c", "create_exception", {"clerk_note": n[0], "vendor_message": n[1]})])
    steps.append([{"type": "text", "text": REPLY[inv["id"]]}])
    i = {"n": 0}
    z = NS(input_tokens=0, output_tokens=0, cache_read_input_tokens=0, cache_creation_input_tokens=0)

    def create(**_):
        c = steps[i["n"]]; i["n"] += 1
        return NS(stop_reason="end_turn" if i["n"] == len(steps) else "tool_use", content=c, usage=z)
    return NS(beta=NS(messages=NS(create=create)))


client = get_client() if LIVE else None
if LIVE and not client:
    sys.exit("--live needs ANTHROPIC_API_KEY")
out = []
for inv in INVOICES:
    r = run_agent(inv["doc"], client or scripted(inv))
    st = r["state"]
    out.append({"id": inv["id"], "title": inv["title"], "doc": inv["doc"], "kind": "recorded" if LIVE else "scripted", "model": r["model"] if LIVE else None,
                "reply": r["reply"], "trace": r["trace"], "decision": st["decision"], "posted": st["posted"], "exception": st["exception"], "fields": st["invoice"]})
    print(inv["id"], st["decision"]["decision"], "posted" if st["posted"] else (st["exception"] or {}).get("queue_id"))
json.dump(out, open(os.path.join(os.path.dirname(__file__), "..", "data", "replays.json"), "w"), indent=2, ensure_ascii=False)
