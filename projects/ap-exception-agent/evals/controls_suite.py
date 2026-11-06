"""Deterministic AP controls suite: mutated invoices with the decision a controller expects.
No model needed.   python evals/controls_suite.py  -> evals/results/controls.json"""
import copy, json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.invoices import INVOICES  # noqa: E402
from _lib.rules import decide  # noqa: E402

base = {i["id"]: i["fields"] for i in INVOICES}


def mut(src, **kw):
    f = copy.deepcopy(base[src]); f.update(kw); return f


def lines(src, *edits):
    f = copy.deepcopy(base[src])
    for idx, k, v in edits:
        f["lines"][idx][k] = v
    return f


def retotal(f, rate):
    f["subtotal"] = round(sum(l["qty"] * l["unit_price"] for l in f["lines"]), 2); f["tax"] = round(f["subtotal"] * rate, 2); f["total"] = round(f["subtotal"] + f["tax"], 2); return f


CASES = [(f"DEMO-{i['id']}", "Demo invoices", i["fields"], i["expect"]) for i in INVOICES] + [
    ("PRICE-1", "Price tolerance", retotal(lines("clean", (0, "unit_price", 3.26)), 0.05), "post"),        # +1.9% within 2%
    ("PRICE-2", "Price tolerance", retotal(lines("clean", (0, "unit_price", 3.27)), 0.05), "exception"),   # +2.2%
    ("PRICE-3", "Price tolerance", retotal(lines("clean", (1, "unit_price", 6.20)), 0.05), "exception"),   # under-billing beyond tolerance is flagged too
    ("QTY-1", "Quantities", retotal(lines("clean", (0, "qty", 2100)), 0.05), "exception"),
    ("QTY-2", "Quantities", retotal(lines("clean", (0, "qty", 1500)), 0.05), "post"),                     # partial billing is fine
    ("QTY-3", "Quantities", retotal(lines("partial", (1, "qty", 14)), 0.15), "post"),                     # bills only what arrived
    ("PO-1", "Purchase order", mut("clean", po_number="PO-9999"), "exception"),
    ("PO-2", "Purchase order", mut("clean", po_number="PO-5002"), "exception"),                           # another vendor's PO
    ("PO-3", "Purchase order", retotal(dict(mut("clean"), lines=base["clean"]["lines"] + [{"description": "Bubble wrap rolls", "qty": 10, "unit_price": 40.0}]), 0.05), "exception"),
    ("CUR-1", "Currency", mut("clean", currency="USD"), "exception"),
    ("MATH-1", "Arithmetic", mut("clean", subtotal=8530.00), "exception"),
    ("MATH-2", "Arithmetic", mut("clean", total=8776.50), "exception"),
    ("TAX-1", "Tax", mut("clean", tax=0.0, total=8350.0), "exception"),
    ("TAX-2", "Tax", retotal(copy.deepcopy(base["partial"]), 0.05) | {"lines": [{"description": "A4 paper, 5-ream box", "qty": 120, "unit_price": 85.0}], "subtotal": 10200.0, "tax": 510.0, "total": 10710.0}, "exception"),
    ("DUP-1", "Duplicates", mut("clean", invoice_number="gp-2291 "), "reject"),
    ("DUP-2", "Duplicates", mut("duplicate", invoice_number="GP-2291-B", invoice_date="2026-10-16"), "reject"),  # same amount within 7 days
    ("DUP-3", "Duplicates", mut("duplicate", invoice_number="GP-2399", invoice_date="2026-10-25"), "post"),      # same amount, 13 days later
    ("BANK-1", "Bank details", mut("clean", bank_iban="AE070331234567890123457"), "hold"),
    ("BANK-2", "Bank details", mut("clean", bank_iban="ae07 0331 2345 6789 0123 456"), "post"),               # formatting differences are fine
    ("BANK-3", "Bank details", mut("duplicate", bank_iban="AE990000000000000000001"), "hold"),               # fraud beats duplicate
    ("VEND-1", "Vendor master", mut("clean", vendor_tax_id="999999999999999"), "exception"),
    ("LIMIT-1", "Approval limits", retotal(lines("clean", (0, "qty", 2000)), 0.05) | {"lines": [{"description": "Corrugated boxes, large", "qty": 2000, "unit_price": 3.2}, {"description": "Packing tape 48mm", "qty": 300, "unit_price": 6.5}]}, "post"),
    ("LIMIT-2", "Approval limits", retotal(copy.deepcopy(base["approval"]) | {"lines": [{"description": "Laptop setup", "qty": 8, "unit_price": 95.0}]}, 0.20), "post"),  # 912 GBP, under the 5,000 limit
]


def main():
    results = []
    for cid, cat, fields, expect in CASES:
        t = time.perf_counter(); d = decide(fields); ms = (time.perf_counter() - t) * 1000
        results.append({"id": cid, "category": cat, "expected": expect, "got": d["decision"], "type": d["type"], "reason": d["reasons"][0], "pass": d["decision"] == expect, "ms": round(ms, 3)})
    out = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "total": len(results), "passed": sum(r["pass"] for r in results), "results": results}
    os.makedirs(os.path.join(os.path.dirname(__file__), "results"), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "controls.json"), "w"), indent=2)
    print(f"{out['passed']}/{out['total']} control cases pass")
    for r in results:
        if not r["pass"]:
            print("FAIL", r["id"], r["expected"], "->", r["got"], r["reason"])


if __name__ == "__main__":
    main()
