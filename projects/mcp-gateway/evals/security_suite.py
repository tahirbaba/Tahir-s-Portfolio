"""Gatekeeper security suite: attacks and legitimate calls, run against the real gateway. No model needed.
Writes evals/results/security.json.   python evals/security_suite.py"""
import json, os, sys, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
from _lib.gateway import call, new_state  # noqa: E402

S, A, I = "sk_demo_support", "sk_demo_analytics", "sk_demo_intern"
B, OK, P = "blocked", "allowed", "pending_approval"

# (id, category, kind, key, tool, args, expected decision, extra check)
CASES = [
    # authentication
    ("AUTH-1", "Authentication", "attack", None, "files.read", {"path": "handbook/refund-policy.md"}, B, None),
    ("AUTH-2", "Authentication", "attack", "sk_live_guess", "files.read", {"path": "handbook/refund-policy.md"}, B, None),
    ("AUTH-3", "Authentication", "attack", "SK_DEMO_SUPPORT", "crm.get_customer", {"customer_id": "C-101"}, B, None),
    # scope escalation
    ("SCOPE-1", "Scope escalation", "attack", I, "crm.get_customer", {"customer_id": "C-101"}, B, None),
    ("SCOPE-2", "Scope escalation", "attack", I, "payments.refund", {"customer_id": "C-101", "amount": 50, "reason": "test"}, B, None),
    ("SCOPE-3", "Scope escalation", "attack", A, "email.send", {"to": "x@orbit.example", "subject": "hi", "body": "hi"}, B, None),
    ("SCOPE-4", "Scope escalation", "attack", S, "db.query", {"sql": "SELECT * FROM customers"}, B, None),
    ("SCOPE-5", "Scope escalation", "attack", A, "admin.grant_scope", {"scope": "payments.refund"}, B, None),
    # argument tampering
    ("ARGS-1", "Argument tampering", "attack", S, "crm.get_customer", {"customer_id": "C-101", "include_ssn": True}, B, None),
    ("ARGS-2", "Argument tampering", "attack", S, "payments.refund", {"customer_id": "C-101", "amount": "fifty", "reason": "x"}, B, None),
    ("ARGS-3", "Argument tampering", "attack", S, "files.read", {}, B, None),
    # SQL
    ("SQL-1", "SQL guard", "attack", A, "db.query", {"sql": "DROP TABLE customers"}, B, None),
    ("SQL-2", "SQL guard", "attack", A, "db.query", {"sql": "UPDATE invoices SET status='paid'"}, B, None),
    ("SQL-3", "SQL guard", "attack", A, "db.query", {"sql": "SELECT * FROM customers; DELETE FROM customers"}, B, None),
    ("SQL-4", "SQL guard", "attack", A, "db.query", {"sql": "SELECT * FROM salaries"}, B, None),
    ("SQL-5", "SQL guard", "attack", A, "db.query", {"sql": "SELECT name FROM customers UNION SELECT title FROM salaries"}, B, None),
    ("SQL-6", "SQL guard", "attack", A, "db.query", {"sql": "SELECT * FROM customers WHERE mrr > (SELECT max(salary) FROM salaries)"}, B, None),
    ("SQL-7", "SQL guard", "attack", A, "db.query", {"sql": "SELECT sql FROM sqlite_master"}, B, None),
    ("SQL-8", "SQL guard", "attack", A, "db.query", {"sql": "WITH s AS (SELECT * FROM SALARIES) SELECT * FROM s"}, B, None),
    ("SQL-9", "SQL guard", "attack", A, "db.query", {"sql": "SELECT * FROM pragma_table_info('salaries')"}, B, None),
    ("SQL-10", "SQL guard", "attack", A, "db.query", {"sql": "ATTACH DATABASE 'x.db' AS x"}, B, None),
    ("SQL-11", "SQL guard", "attack", A, "db.query", {"sql": "select load_extension('evil')"}, B, None),
    ("SQL-12", "SQL guard", "attack", A, "db.query", {"sql": "INSERT INTO customers VALUES ('X','x','x','x','x','x',1)"}, B, None),
    ("SQL-13", "SQL guard", "attack", A, "db.query", {"sql": "SELECT * FROM customers -- ; DROP TABLE customers"}, B, None),
    # paths
    ("PATH-1", "Path policy", "attack", S, "files.read", {"path": "../../etc/passwd"}, B, None),
    ("PATH-2", "Path policy", "attack", S, "files.read", {"path": "hr/salaries.csv"}, B, None),
    ("PATH-3", "Path policy", "attack", S, "files.read", {"path": "/etc/passwd"}, B, None),
    ("PATH-4", "Path policy", "attack", S, "files.read", {"path": "handbook/../hr/salaries.csv"}, B, None),
    ("PATH-5", "Path policy", "attack", S, "files.read", {"path": "handbook\\..\\hr\\salaries.csv"}, B, None),
    # prompt injection in tool output
    ("INJ-1", "Prompt injection", "attack", S, "files.read", {"path": "vendors/acme-invoice.txt"}, OK, "injection_removed"),
    ("INJ-2", "Prompt injection", "attack", I, "files.read", {"path": "vendors/acme-invoice.txt"}, OK, "injection_removed"),
    # exfiltration via email / money
    ("EXF-1", "Exfiltration", "attack", S, "email.send", {"to": "billing-update@acme-pay.example", "subject": "Customer list", "body": "attached"}, P, None),
    ("EXF-2", "Exfiltration", "attack", S, "email.send", {"to": "not-an-email", "subject": "x", "body": "x"}, B, None),
    ("MONEY-1", "Payments", "attack", S, "payments.refund", {"customer_id": "C-105", "amount": 2400, "reason": "full refund"}, B, None),
    ("MONEY-2", "Payments", "attack", S, "payments.refund", {"customer_id": "C-101", "amount": -50, "reason": "x"}, B, None),
    ("MONEY-3", "Payments", "attack", S, "payments.refund", {"customer_id": "C-999", "amount": 20, "reason": "x"}, B, None),
    ("MONEY-4", "Payments", "attack", S, "payments.refund", {"customer_id": "C-104", "amount": 240, "reason": "outage credit"}, P, None),
    # PII
    ("PII-1", "PII masking", "attack", A, "db.query", {"sql": "SELECT name, email, phone FROM customers"}, OK, "pii_masked"),
    ("PII-2", "PII masking", "attack", A, "db.query", {"sql": "SELECT email AS contact, name || ' ' || phone AS who FROM customers"}, OK, "pii_alias"),
    # legitimate work (must NOT be blocked)
    ("OK-1", "Legitimate work", "legit", S, "crm.search_customers", {"query": "PK"}, OK, None),
    ("OK-2", "Legitimate work", "legit", S, "crm.get_customer", {"customer_id": "C-103"}, OK, "pii_full"),
    ("OK-3", "Legitimate work", "legit", S, "files.read", {"path": "handbook/refund-policy.md"}, OK, None),
    ("OK-4", "Legitimate work", "legit", S, "payments.refund", {"customer_id": "C-102", "amount": 35, "reason": "duplicate charge"}, OK, None),
    ("OK-5", "Legitimate work", "legit", S, "email.send", {"to": "support-lead@orbit.example", "subject": "Escalation", "body": "Outage in PK"}, OK, None),
    ("OK-6", "Legitimate work", "legit", A, "db.query", {"sql": "SELECT country, sum(mrr) AS mrr FROM customers GROUP BY country"}, OK, "rows"),
    ("OK-7", "Legitimate work", "legit", A, "db.query", {"sql": "SELECT c.name, i.amount FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.status = 'overdue'"}, OK, "rows"),
    ("OK-8", "Legitimate work", "legit", A, "db.query", {"sql": "WITH t AS (SELECT plan, count(*) n FROM customers GROUP BY plan) SELECT * FROM t"}, OK, "rows"),
    ("OK-9", "Legitimate work", "legit", I, "files.read", {"path": "handbook/escalation.md"}, OK, None),
]


def extra_ok(kind, resp):
    r = resp.get("result")
    if kind is None:
        return True
    if kind == "rows":
        return isinstance(r, dict) and len(r.get("rows", [])) > 0
    if kind == "injection_removed":
        return bool(resp.get("flags")) and "ignore all previous instructions" not in r["content"].lower()
    if kind == "pii_masked":
        return all("***@" in row[1] and "*" in row[2] for row in r["rows"])
    if kind == "pii_alias":
        return all("***@" in row[0] and "@" not in row[1].replace("***@", "") and not any(ch.isdigit() for ch in row[1][-8:-2]) for row in r["rows"])
    if kind == "pii_full":
        return "@" in r["email"] and "***" not in r["email"]
    return True


def main():
    results = []
    for cid, cat, kind, key, tool, args, expect, extra in CASES:
        t = time.perf_counter()
        resp, _ = call(key, tool, args, new_state(), now=0)
        ms = (time.perf_counter() - t) * 1000
        ok = resp["decision"] == expect and extra_ok(extra, resp)
        results.append({"id": cid, "category": cat, "kind": kind, "tool": tool, "expected": expect, "got": resp["decision"], "reason": resp["reason"], "pass": ok, "ms": round(ms, 2)})
    # rate limit burst
    st = new_state(); decisions = []
    for i in range(12):
        r, st = call(I, "files.read", {"path": "handbook/escalation.md"}, st, now=1000 + i)
        decisions.append(r["decision"])
    results.append({"id": "RATE-1", "category": "Rate limiting", "kind": "attack", "tool": "files.read", "expected": "10 allowed then blocked", "got": f"{decisions.count('allowed')} allowed, {decisions.count('blocked')} blocked",
                    "reason": "intern-bot limit is 10/min", "pass": decisions[:10] == ["allowed"] * 10 and decisions[10:] == ["blocked"] * 2, "ms": 0})
    attacks = [r for r in results if r["kind"] == "attack"]; legit = [r for r in results if r["kind"] == "legit"]
    out = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "total": len(results), "passed": sum(r["pass"] for r in results),
           "attacksStopped": sum(r["pass"] for r in attacks), "attacks": len(attacks), "legitAllowed": sum(r["pass"] for r in legit), "legit": len(legit),
           "medianMs": sorted(r["ms"] for r in results if r["ms"])[len(results) // 2],
           "fixedDuringBuild": ["PII masking originally matched column names, so SELECT email AS contact leaked emails. It now masks by value pattern in every cell (case PII-2)."],
           "results": results}
    os.makedirs(os.path.join(os.path.dirname(__file__), "results"), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(__file__), "results", "security.json"), "w"), indent=2)
    print(f"{out['passed']}/{out['total']} cases pass · attacks stopped {out['attacksStopped']}/{out['attacks']} · legit allowed {out['legitAllowed']}/{out['legit']}")
    for r in results:
        if not r["pass"]:
            print("FAIL", r["id"], r["expected"], "->", r["got"], r["reason"])


if __name__ == "__main__":
    main()
