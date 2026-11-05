"use client";

import { AnimatePresence, motion } from "motion/react";
import { TIER_STYLE, type Outcome, type TraceEvent } from "./types";

const LABEL: Record<string, string> = {
  score_lead: "Score against ideal customer", enrich_company: "Enrich company", get_availability: "Find meeting slots",
  book_meeting: "Book meeting", log_to_crm: "Log to CRM", alert_rep: "Alert sales rep",
};

function describe(name: string, o: Record<string, any>, isError: boolean): string {
  if (isError) return String(o.error ?? "Blocked");
  switch (name) {
    case "score_lead": return `${o.score}/100 · ${String(o.tier).toUpperCase()}${o.routed_rep ? ` · routed to ${o.routed_rep}` : ""}`;
    case "enrich_company": return o.found ? `${o.name} · ${o.industry} · ${Number(o.employees).toLocaleString()} staff · ${o.country}` : "Not in enrichment data";
    case "get_availability": return (o.slots ?? []).map((s: any) => s.lead_local).join(" · ");
    case "book_meeting": return `${o.id} · ${o.lead_local} lead time · ${o.rep_local} rep time`;
    case "log_to_crm": return `Record ${o.record_id} saved`;
    case "alert_rep": return `${o.alerted} notified instantly`;
    default: return "ok";
  }
}

export default function BehindScenes({ trace, outcome, done, kind, model }: { trace: TraceEvent[]; outcome: Outcome; done: boolean; kind: string; model: string | null }) {
  return (
    <div className="dark-zone flex h-full min-h-[600px] flex-col overflow-hidden rounded-3xl border border-line bg-ink shadow-[0_40px_80px_-40px_#0009]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[12px] text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-ice" />behind the scenes</span>
        <span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${kind === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>{kind === "recorded" ? `recorded run · ${model}` : "replay · scripted replies, real rules"}</span>
      </div>
      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
        <AnimatePresence initial={false}>
          {trace.map((e, i) => e.kind === "model" ? (
            <motion.li key={`m${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="font-mono text-[11px] text-dim">— Claude reasoning · step {e.step}{e.stop === "end_turn" ? " · writing reply" : ""}</motion.li>
          ) : (
            <motion.li key={`t${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <details className={`group rounded-xl border px-3.5 py-2.5 ${e.isError ? "border-amber/40 bg-amber/5" : "border-line bg-panel"}`}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[13.5px] font-medium"><span className={`grid h-5 w-5 place-items-center rounded-md text-[11px] ${e.isError ? "bg-amber/20 text-amber" : "bg-ice/15 text-ice"}`}>{e.isError ? "!" : "✓"}</span>{LABEL[e.name] ?? e.name}</span>
                    <span className={`mt-1 block text-[12.5px] leading-snug ${e.isError ? "text-amber" : "text-muted"}`}>{e.isError ? `Blocked by rule: ${describe(e.name, e.output, true)}` : describe(e.name, e.output, false)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-dim group-open:text-ice">{e.name}()</span>
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-ink p-2.5 font-mono text-[10.5px] leading-relaxed text-muted">in  {JSON.stringify(e.input)}{"\n"}out {JSON.stringify(e.output)}</pre>
              </details>
            </motion.li>
          ))}
        </AnimatePresence>
        {trace.length === 0 && <li className="m-auto font-mono text-[12px] text-dim">waiting for a lead…</li>}
      </ol>
      <CrmCard outcome={outcome} show={done} />
    </div>
  );
}

export function CrmCard({ outcome, show }: { outcome: Outcome; show: boolean }) {
  const s = outcome.score;
  return (
    <div className="border-t border-line px-5 py-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-dim">CRM record</p>
      <AnimatePresence mode="wait">
        {show && s ? (
          <motion.div key="crm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-14 w-14 shrink-0">
                <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line-2)" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-ice)" strokeWidth="3" strokeDasharray={`${(s.score / 100) * 97.4} 97.4`} strokeLinecap="round" /></svg>
                <span className="absolute inset-0 grid place-items-center font-mono text-[13px] font-semibold">{s.score}</span>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase ${TIER_STYLE[s.tier]}`}>{s.tier}</span>
              {outcome.crm?.rep && <span className="text-[12.5px] text-muted">Owner: {outcome.crm.rep}</span>}
              {outcome.alerts.length > 0 && <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-[11.5px] text-coral">⚡ rep alerted</span>}
              {outcome.meetings[0] && <span className="rounded-full bg-ok/15 px-2.5 py-0.5 text-[11.5px] text-ok">📅 {outcome.meetings[0].lead_local}</span>}
              {outcome.noReply && <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-[11.5px] text-rose">no reply sent</span>}
            </div>
            <ul className="flex flex-wrap gap-1.5">{s.reasons.map((x) => <li key={x} className="rounded-md bg-panel px-2 py-0.5 font-mono text-[10.5px] text-muted">{x}</li>)}</ul>
            {outcome.crm && <p className="text-[12.5px] leading-relaxed text-muted"><span className="text-fg">Next step:</span> {outcome.crm.next_step}</p>}
          </motion.div>
        ) : <motion.span key="wip" className="font-mono text-[12px] text-dim">waiting…</motion.span>}
      </AnimatePresence>
    </div>
  );
}
