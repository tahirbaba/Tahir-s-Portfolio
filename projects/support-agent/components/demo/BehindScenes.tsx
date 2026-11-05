"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Action, ToolEvent, TraceEvent } from "./types";

const TOOL_LABEL: Record<string, string> = {
  verify_order: "Verify identity",
  search_policy: "Check policy",
  issue_refund: "Issue refund",
  start_return: "Start return",
  update_address: "Update address",
  cancel_order: "Cancel order",
  escalate_to_human: "Hand off to a person",
};

function describe(e: ToolEvent): string {
  const o = e.output as Record<string, any>;
  if (e.isError) return String(o.error ?? "Blocked");
  switch (e.name) {
    case "verify_order": return `Order ${o.order?.order_id} matched the email · status ${o.order?.status}`;
    case "search_policy": return (o.sections ?? []).map((s: any) => `${s.id} ${s.title}`).join(" · ");
    case "issue_refund": return o.status === "pending_approval" ? `${o.message}` : `Refunded ${o.amount} USD · ${o.refund_id}`;
    case "update_address": return `New address saved · ${o.change_id}`;
    case "start_return": return `Return label issued · ${o.return_id}`;
    case "cancel_order": return `Cancelled · refunded ${o.refunded} USD`;
    case "escalate_to_human": return `Case ${o.case_id} · ${o.message}`;
    default: return "ok";
  }
}

const ACTION_LABEL: Record<string, string> = { refund: "Refund", return: "Return", address_change: "Address change", cancellation: "Cancellation", escalation: "Human handoff" };

export default function BehindScenes({ trace, shown, actions, done, source, model }: { trace: TraceEvent[]; shown: number; actions: Action[]; done: boolean; source: string; model: string | null }) {
  const visible = trace.slice(0, shown);
  return (
    <div className="dark-zone flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl border border-line bg-ink shadow-[0_40px_80px_-40px_#0009]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ice" />
          <span className="font-mono text-[12px] text-muted">behind the scenes</span>
        </div>
        <span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${source === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>
          {source === "recorded" ? `recorded run · ${model}` : "replay · scripted replies, real rules"}
        </span>
      </div>

      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
        <AnimatePresence initial={false}>
          {visible.map((e, i) => e.kind === "model" ? (
            <motion.li key={`m${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 font-mono text-[11.5px] text-dim">
              <span className="h-px w-4 bg-line-2" /> Claude reasoning · step {e.step}{e.stop === "end_turn" ? " · writing reply" : ""}
            </motion.li>
          ) : (
            <motion.li key={`t${i}`} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35 }}>
              <details className={`group rounded-xl border px-3.5 py-2.5 ${e.isError ? "border-amber/40 bg-amber/5" : "border-line bg-panel"}`}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[13.5px] font-medium">
                      <span className={`grid h-5 w-5 place-items-center rounded-md text-[11px] ${e.isError ? "bg-amber/20 text-amber" : "bg-ice/15 text-ice"}`}>{e.isError ? "!" : "✓"}</span>
                      {TOOL_LABEL[e.name] ?? e.name}
                    </span>
                    <span className={`mt-1 block text-[12.5px] leading-snug ${e.isError ? "text-amber" : "text-muted"}`}>{e.isError ? `Blocked by rule: ${describe(e)}` : describe(e)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-dim group-open:text-ice">{e.name}()</span>
                </summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-ink p-2.5 font-mono text-[10.5px] leading-relaxed text-muted">in  {JSON.stringify(e.input)}{"\n"}out {JSON.stringify(e.output)}</pre>
              </details>
            </motion.li>
          ))}
        </AnimatePresence>
        {visible.length === 0 && <li className="m-auto font-mono text-[12px] text-dim">waiting for the customer…</li>}
      </ol>

      <div className="border-t border-line px-5 py-4">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-dim">Outcome</p>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
              {actions.length === 0 && <span className="rounded-lg border border-line-2 px-2.5 py-1 text-[12.5px] text-muted">No action taken: answered within policy</span>}
              {actions.map((a) => (
                <span key={a.id} className={`rounded-lg border px-2.5 py-1 text-[12.5px] ${a.type === "escalation" ? "border-rose/40 text-rose" : a.status === "pending_approval" ? "border-amber/40 text-amber" : "border-ok/40 text-ok"}`}>
                  {ACTION_LABEL[a.type] ?? a.type}{a.amount ? ` ${a.amount} USD` : ""} · {a.status === "pending_approval" ? "awaiting approval" : "done"}
                </span>
              ))}
            </motion.div>
          ) : <motion.span key="wip" className="font-mono text-[12px] text-dim">working…</motion.span>}
        </AnimatePresence>
      </div>
    </div>
  );
}
