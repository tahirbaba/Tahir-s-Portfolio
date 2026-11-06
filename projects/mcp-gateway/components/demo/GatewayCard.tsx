"use client";

import { motion } from "motion/react";
import { DECISION_LABEL, DECISION_STYLE, type Check } from "./types";

export default function GatewayCard({ tool, args, decision, reason, checks, result, flags }: { tool: string; args: Record<string, unknown>; decision: string; reason: string; checks: Check[]; result: any; flags?: string[] | null }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="font-mono text-[13px] text-ice">{tool}</code>
        <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] ${DECISION_STYLE[decision]}`}>{DECISION_LABEL[decision]}</span>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted">{JSON.stringify(args)}</pre>
      <ol className="mt-3 flex flex-wrap items-center gap-1.5">
        {checks.map((c, i) => (
          <motion.li key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 }} title={c.detail}
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10.5px] ${c.ok ? "border-ok/30 text-ok" : "border-coral/40 text-coral"}`}>
            {c.ok ? "✓" : "✗"} {c.check}
          </motion.li>
        ))}
      </ol>
      <p className={`mt-2 text-[12.5px] ${decision === "allowed" ? "text-muted" : decision === "blocked" ? "text-coral" : "text-amber"}`}>{checks.find((c) => !c.ok)?.detail ?? reason}</p>
      {flags && flags.length > 0 && <p className="mt-2 rounded-lg border border-amber/30 bg-amber/5 px-2.5 py-1.5 text-[12px] text-amber">Removed from the document: “{flags[0].slice(0, 120)}”</p>}
      {result && decision === "allowed" && (
        <details className="mt-2"><summary className="cursor-pointer font-mono text-[11px] text-dim">result</summary>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink p-2 font-mono text-[10.5px] text-muted">{JSON.stringify(result, null, 1)}</pre></details>
      )}
    </motion.div>
  );
}
