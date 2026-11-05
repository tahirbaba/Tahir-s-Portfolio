"use client";

import { useEffect, useState } from "react";
import BehindScenes from "./BehindScenes";
import { scriptClass, type Outcome, type TraceEvent } from "./types";

const TZ = ["Asia/Dubai", "Asia/Riyadh", "Asia/Karachi", "Europe/London", "America/New_York", "America/Chicago", "America/Los_Angeles"];
const SAMPLE = { name: "Hana Al Mansoori", email: "hana@gulfline.example", company: "Gulfline Freight", role: "Director of Operations", country: "AE", timezone: "Asia/Dubai", source: "web_form", message: "Hi, we're comparing shipment-tracking tools and would like a demo this week. Pricing too please." };
const EMPTY: Outcome = { score: null, meetings: [], crm: null, alerts: [], noReply: false };

export default function LiveLab() {
  const [lead, setLead] = useState(SAMPLE);
  const [turns, setTurns] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [reply, setReply] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [outcome, setOutcome] = useState<Outcome>(EMPTY);
  const [meta, setMeta] = useState<{ latencyMs: number; costUsd: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => { fetch("/api/py/health").then((r) => r.json()).then((d) => setLive(!!d.live)).catch(() => setLive(false)); }, []);

  async function send(followup?: string) {
    setBusy(true); setError("");
    const nextTurns = followup ? [...turns, { role: "user" as const, content: followup }] : [];
    try {
      const res = await fetch("/api/py/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead: { ...lead, id: "L-LIVE" }, followups: nextTurns, state: followup ? token : null }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || d.detail?.[0]?.msg || "Something went wrong."); return; }
      setTurns(d.reply ? [...nextTurns, { role: "assistant", content: d.reply }] : nextTurns);
      if (!followup) setTurns(d.reply ? [{ role: "assistant", content: d.reply }] : []);
      setToken(d.state_token); setTrace(d.trace); setMeta({ latencyMs: d.latencyMs, costUsd: d.costUsd });
      setOutcome({ score: d.state.scored, meetings: d.state.meetings, crm: d.state.crm, alerts: d.state.alerts, noReply: d.state.reply_blocked });
      setReply("");
    } catch { setError("Connection lost. Please try again."); } finally { setBusy(false); }
  }

  const field = (k: keyof typeof SAMPLE, label: string, el?: "textarea" | "tz") => (
    <label className="flex flex-col gap-1.5 text-[13px]">
      <span className="text-muted">{label}</span>
      {el === "textarea" ? <textarea rows={4} dir="auto" value={lead[k]} onChange={(e) => setLead({ ...lead, [k]: e.target.value })} className={`resize-none rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px] outline-none focus:border-ice ${scriptClass(lead[k])}`} />
        : el === "tz" ? <select value={lead[k]} onChange={(e) => setLead({ ...lead, [k]: e.target.value })} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px]">{TZ.map((t) => <option key={t}>{t}</option>)}</select>
        : <input value={lead[k]} onChange={(e) => setLead({ ...lead, [k]: e.target.value })} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px] outline-none focus:border-ice" />}
    </label>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between"><p className="eyebrow">Submit a test lead</p><span className="font-mono text-[11px] text-dim">{live ? "Claude online" : live === false ? "live agent offline (no API key yet)" : "checking…"}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">{field("name", "Name")}{field("email", "Work email")}{field("company", "Company")}{field("role", "Role")}{field("timezone", "Time zone", "tz")}{field("country", "Country code")}</div>
          {field("message", "Message (any language)", "textarea")}
          <button type="button" disabled={busy} onClick={() => send()} className="btn btn-coral self-start disabled:opacity-50">{busy ? "Leadline is working…" : "Send lead"}</button>
          {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
          <p className="text-[12px] text-dim">Try a company from the enrichment set (gulfline, souqcart, indusmart, brightloom, harbourway, peakparcel .example), a personal Gmail, or a spammy message.</p>
        </div>
        {turns.length > 0 && (
          <div className="panel flex flex-col gap-3 p-5">
            {turns.map((t, i) => <div key={i} dir="auto" className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${t.role === "assistant" ? "self-start bg-panel-2" : "self-end bg-fg text-ink"} ${scriptClass(t.content)}`}>{t.content}</div>)}
            <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) send(reply.trim()); }} className="flex gap-2">
              <input dir="auto" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as the lead, e.g. pick a time" className="min-w-0 flex-1 rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px] outline-none focus:border-ice" />
              <button disabled={busy} className="btn btn-primary !py-2 disabled:opacity-50">Reply</button>
            </form>
            {meta && <p className="font-mono text-[11px] text-dim">last turn: {(meta.latencyMs / 1000).toFixed(1)}s · ${meta.costUsd.toFixed(4)}</p>}
          </div>
        )}
      </div>
      <BehindScenes trace={trace} outcome={outcome} done={!!outcome.score} kind="recorded" model="live" />
    </div>
  );
}
