"""Extraction + decision eval: the agent reads each demo invoice document; we compare its extracted fields
with ground truth and check it reached the controller's decision.   ANTHROPIC_API_KEY=... python evals/run.py"""
import json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.agent import MODEL, get_client, run_agent  # noqa: E402
from _lib.invoices import INVOICES  # noqa: E402

client = get_client()
if not client:
    sys.exit("ANTHROPIC_API_KEY is not set.")
KEYS = ["vendor_tax_id", "invoice_number", "invoice_date", "po_number", "currency", "subtotal", "tax", "total", "bank_iban"]
results = []
for inv in INVOICES:
    r = run_agent(inv["doc"], client)
    got, truth = r["state"]["invoice"] or {}, inv["fields"]
    field_ok = {k: str(got.get(k, "")).replace(" ", "").upper() == str(truth[k]).replace(" ", "").upper() if not isinstance(truth[k], float) else abs(float(got.get(k, -1)) - truth[k]) < 0.01 for k in KEYS}
    lines_ok = len(got.get("lines", [])) == len(truth["lines"]) and all(abs(a["qty"] - b["qty"]) < 1e-6 and abs(a["unit_price"] - b["unit_price"]) < 0.01 for a, b in zip(got.get("lines", []), truth["lines"]))
    dec = (r["state"]["decision"] or {}).get("decision")
    acted = (dec == "post" and bool(r["state"]["posted"])) or (dec != "post" and bool(r["state"]["exception"]))
    results.append({"id": inv["id"], "fieldAccuracy": round(sum(field_ok.values()) / len(KEYS), 3), "linesOk": lines_ok, "decision": dec, "expected": inv["expect"],
                    "decisionOk": dec == inv["expect"], "actedOk": acted, "latencyMs": r["latencyMs"], "costUsd": r["costUsd"], "wrongFields": [k for k, v in field_ok.items() if not v]})
    print(inv["id"], results[-1])
summary = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "model": MODEL, "cases": len(results),
           "metrics": {"fieldAccuracy": round(100 * sum(r["fieldAccuracy"] for r in results) / len(results), 1), "lineItemsExact": round(100 * sum(r["linesOk"] for r in results) / len(results), 1),
                       "correctDecision": round(100 * sum(r["decisionOk"] for r in results) / len(results), 1), "correctAction": round(100 * sum(r["actedOk"] for r in results) / len(results), 1),
                       "avgCostPerInvoice": round(sum(r["costUsd"] for r in results) / len(results), 4), "avgLatencyMs": int(sum(r["latencyMs"] for r in results) / len(results))},
           "results": results}
json.dump(summary, open(os.path.join(os.path.dirname(__file__), "results", "latest.json"), "w"), indent=2)
print(json.dumps(summary["metrics"], indent=2))
