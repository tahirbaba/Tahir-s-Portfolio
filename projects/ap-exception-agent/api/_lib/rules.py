"""Ledger's accounts-payable controls, enforced in code: extraction validation, 3-way match,
duplicate and bank-change detection, tax checks and the final post/route decision."""
from __future__ import annotations

from copy import deepcopy
from datetime import date

from .erp import APPROVAL_LIMITS, POS, POSTED, PRICE_TOLERANCE, RECEIPTS, VENDORS

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "vendor_name": {"type": "string"}, "vendor_tax_id": {"type": "string"}, "invoice_number": {"type": "string"},
        "invoice_date": {"type": "string", "description": "YYYY-MM-DD"}, "po_number": {"type": "string"}, "currency": {"type": "string"},
        "lines": {"type": "array", "items": {"type": "object", "properties": {"description": {"type": "string"}, "qty": {"type": "number"}, "unit_price": {"type": "number"}},
                                              "required": ["description", "qty", "unit_price"], "additionalProperties": False}},
        "subtotal": {"type": "number"}, "tax": {"type": "number"}, "total": {"type": "number"}, "bank_iban": {"type": "string"},
    },
    "required": ["vendor_name", "vendor_tax_id", "invoice_number", "invoice_date", "po_number", "currency", "lines", "subtotal", "tax", "total", "bank_iban"],
    "additionalProperties": False,
}


def r2(x: float) -> float:
    return round(float(x) + 1e-9, 2)


def vendor_for(inv: dict) -> tuple[str | None, dict | None]:
    tid = inv.get("vendor_tax_id", "").replace(" ", "").upper()
    for vid, v in VENDORS.items():
        if v["tax_id"].replace(" ", "").upper() == tid:
            return vid, v
    return None, None


def validate_extraction(inv: dict) -> list[str]:
    """Arithmetic and completeness checks on what was read from the document."""
    issues = []
    if not inv.get("lines"):
        issues.append("No line items were extracted")
    lines_sum = r2(sum(l["qty"] * l["unit_price"] for l in inv.get("lines", [])))
    if abs(lines_sum - r2(inv["subtotal"])) > 0.01:
        issues.append(f"Line items add up to {lines_sum:,.2f}, but the subtotal says {r2(inv['subtotal']):,.2f}")
    if abs(r2(inv["subtotal"] + inv["tax"]) - r2(inv["total"])) > 0.01:
        issues.append(f"Subtotal plus tax is {r2(inv['subtotal'] + inv['tax']):,.2f}, but the total says {r2(inv['total']):,.2f}")
    try:
        date.fromisoformat(inv["invoice_date"])
    except ValueError:
        issues.append("Invoice date is not a valid date")
    return issues


def three_way_match(inv: dict) -> dict:
    po = POS.get(inv["po_number"].strip().upper())
    vid, _ = vendor_for(inv)
    if not po:
        return {"ok": False, "issues": [f"Purchase order {inv['po_number']} does not exist"], "lines": []}
    issues, lines = [], []
    if vid != po["vendor"]:
        issues.append(f"PO {inv['po_number']} belongs to {VENDORS[po['vendor']]['name']}, not this vendor")
    if inv["currency"].upper() != po["currency"]:
        issues.append(f"Invoice currency {inv['currency']} differs from PO currency {po['currency']}")
    received = RECEIPTS.get(inv["po_number"].strip().upper(), {})
    for l in inv["lines"]:
        match = next((p for p in po["lines"] if p[1].lower()[:18] in l["description"].lower() or l["description"].lower()[:18] in p[1].lower()), None)
        if not match:
            issues.append(f"“{l['description']}” is not on the purchase order")
            lines.append({"line": l["description"], "status": "not on PO"})
            continue
        sku, desc, po_qty, po_price = match
        rec = received.get(sku, 0)
        if abs(l["unit_price"] - po_price) > po_price * PRICE_TOLERANCE:
            issues.append(f"{desc}: billed at {l['unit_price']:,.2f}, PO price {po_price:,.2f} ({(l['unit_price'] / po_price - 1) * 100:+.1f}%)")
            lines.append({"line": desc, "status": "price mismatch"})
        elif l["qty"] > rec:
            issues.append(f"{desc}: billed {l['qty']:g}, only {rec:g} received")
            lines.append({"line": desc, "status": "quantity not received"})
        elif l["qty"] > po_qty:
            issues.append(f"{desc}: billed {l['qty']:g}, PO was for {po_qty:g}")
            lines.append({"line": desc, "status": "over PO quantity"})
        else:
            lines.append({"line": desc, "status": "matched"})
    return {"ok": not issues, "issues": issues, "lines": lines}


def check_duplicate(inv: dict) -> dict:
    vid, _ = vendor_for(inv)
    for v, num, total, d in POSTED:
        if v == vid and num.strip().upper() == inv["invoice_number"].strip().upper():
            return {"duplicate": True, "reason": f"Invoice {num} from this vendor was already posted on {d}"}
        if v == vid and abs(total - inv["total"]) < 0.01 and abs((date.fromisoformat(d) - date.fromisoformat(inv["invoice_date"])).days) <= 7:
            return {"duplicate": True, "reason": f"Same vendor and amount ({total:,.2f}) as invoice {num} posted on {d}"}
    return {"duplicate": False, "reason": "No earlier invoice matches"}


def check_bank(inv: dict) -> dict:
    _, v = vendor_for(inv)
    if not v:
        return {"ok": False, "reason": "Vendor tax ID not in the vendor master"}
    if inv["bank_iban"].replace(" ", "").upper() != v["iban"]:
        return {"ok": False, "reason": f"Bank account differs from the one on file (ends {v['iban'][-4:]}). Verify by phone with the vendor before paying."}
    return {"ok": True, "reason": "Matches the bank account on file"}


def check_tax(inv: dict) -> dict:
    _, v = vendor_for(inv)
    if not v:
        return {"ok": False, "reason": "Unknown vendor, tax rate cannot be checked"}
    expected = r2(inv["subtotal"] * v["tax_rate"])
    if abs(expected - r2(inv["tax"])) > max(0.01, expected * 0.005):
        return {"ok": False, "reason": f"Tax should be {expected:,.2f} at {v['tax_rate'] * 100:g}% for {v['country']}, invoice says {r2(inv['tax']):,.2f}"}
    return {"ok": True, "reason": f"{v['tax_rate'] * 100:g}% {v['country']} tax correct"}


def decide(inv: dict) -> dict:
    """The final decision. Order matters: fraud and duplicates beat everything."""
    checks = {"extraction": validate_extraction(inv)}
    vid, vendor = vendor_for(inv)
    if not vendor:
        return {"decision": "exception", "type": "unknown_vendor", "reasons": ["Vendor tax ID is not in the vendor master"], "checks": checks}
    bank, dup = check_bank(inv), check_duplicate(inv)
    match, tax = three_way_match(inv), check_tax(inv)
    checks.update({"bank": bank, "duplicate": dup, "match": match, "tax": tax})
    if not bank["ok"]:
        return {"decision": "hold", "type": "bank_change", "reasons": [bank["reason"]], "checks": checks}
    if dup["duplicate"]:
        return {"decision": "reject", "type": "duplicate", "reasons": [dup["reason"]], "checks": checks}
    if checks["extraction"]:
        return {"decision": "exception", "type": "math_error", "reasons": checks["extraction"], "checks": checks}
    if not match["ok"]:
        return {"decision": "exception", "type": "match_failure", "reasons": match["issues"], "checks": checks}
    if not tax["ok"]:
        return {"decision": "exception", "type": "tax_error", "reasons": [tax["reason"]], "checks": checks}
    limit = APPROVAL_LIMITS[inv["currency"].upper()]
    if inv["total"] > limit:
        return {"decision": "approval", "type": "over_limit", "reasons": [f"Total {inv['total']:,.2f} {inv['currency']} is above the {limit:,} auto-post limit"], "checks": checks}
    return {"decision": "post", "type": "clean", "reasons": ["Matched to PO and receipt, tax correct, bank account verified"], "checks": checks}


# ---------------------------------------------------------------- agent tools

def empty_state() -> dict:
    return {"invoice": None, "decision": None, "posted": None, "exception": None}


TOOLS = [
    {"name": "submit_extraction", "description": "Submit the fields you read from the invoice document. Copy numbers exactly as printed; do not correct them. Returns arithmetic problems if any.",
     "input_schema": EXTRACTION_SCHEMA, "strict": True},
    {"name": "run_controls", "description": "Run the accounts-payable controls on the submitted invoice: 3-way match, duplicates, bank details, tax. Returns the decision and reasons.",
     "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False}, "strict": True},
    {"name": "post_to_erp", "description": "Post the invoice for payment. Only works when the controls decided 'post'.",
     "input_schema": {"type": "object", "properties": {}, "required": [], "additionalProperties": False}, "strict": True},
    {"name": "create_exception", "description": "Send the invoice to the AP exception queue with a clear note for the clerk and a draft message to the vendor.",
     "input_schema": {"type": "object", "properties": {"clerk_note": {"type": "string"}, "vendor_message": {"type": "string"}}, "required": ["clerk_note", "vendor_message"], "additionalProperties": False}, "strict": True},
]


def execute(name: str, args: dict, state: dict) -> tuple[dict, dict, bool]:
    s = deepcopy(state)
    if name == "submit_extraction":
        s["invoice"], s["decision"] = args, None
        issues = validate_extraction(args)
        return {"ok": True, "arithmetic_issues": issues}, s, False
    if not s["invoice"]:
        return {"ok": False, "error": "Submit the extraction first."}, s, True
    if name == "run_controls":
        d = decide(s["invoice"])
        s["decision"] = d
        return {"ok": True, "decision": d["decision"], "type": d["type"], "reasons": d["reasons"]}, s, False
    if not s["decision"]:
        return {"ok": False, "error": "Run the controls first."}, s, True
    if name == "post_to_erp":
        if s["decision"]["decision"] != "post":
            return {"ok": False, "error": f"Cannot post: controls decided '{s['decision']['decision']}' ({s['decision']['type']})."}, s, True
        s["posted"] = {"erp_id": f"AP-{7000 + sum(map(ord, s['invoice']['invoice_number'])) % 900}", "amount": s["invoice"]["total"], "currency": s["invoice"]["currency"]}
        return {"ok": True, **s["posted"]}, s, False
    if name == "create_exception":
        if s["decision"]["decision"] == "post":
            return {"ok": False, "error": "This invoice passed every control; post it instead."}, s, True
        s["exception"] = {"queue_id": f"EXC-{4000 + sum(map(ord, s['invoice']['invoice_number'])) % 900}", "type": s["decision"]["type"], "decision": s["decision"]["decision"],
                          "clerk_note": str(args.get("clerk_note", ""))[:800], "vendor_message": str(args.get("vendor_message", ""))[:1200]}
        return {"ok": True, "queue_id": s["exception"]["queue_id"]}, s, False
    return {"ok": False, "error": f"Unknown tool {name}"}, s, True
