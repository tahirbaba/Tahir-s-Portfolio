"use client";

import { motion } from "motion/react";
import type { Search } from "./types";

export default function Retrieval({ s, i = 0 }: { s: Search; i?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} className="flex flex-col gap-2">
      {s.query && <p className="font-mono text-[12px] text-muted">search_docs(“<span className="text-fg">{s.query}</span>”)</p>}
      <div className="flex flex-wrap gap-1.5 font-mono text-[10.5px]">
        <span className="rounded-full border border-coral/40 px-2 py-0.5 text-coral">🔒 {s.hidden_by_access} hidden by permissions</span>
        <span className="rounded-full border border-line-2 px-2 py-0.5 text-muted">🗄 {s.hidden_as_outdated} outdated skipped</span>
      </div>
      {s.hits.length === 0 ? <p className="rounded-xl border border-line px-3 py-2 text-[12.5px] text-muted">No sections this role can read match the question.</p> : (
        <ol className="flex flex-col gap-1.5">{s.hits.map((h) => (
          <li key={h.id} className="rounded-xl border border-line bg-panel px-3 py-2">
            <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11.5px] text-ice">{h.id}</span><span className="font-mono text-[10.5px] text-dim">score {h.score}</span></div>
            <p className="text-[12px] text-muted"><span className="text-fg">{h.title} · {h.heading}.</span> {h.text.slice(0, 120)}{h.text.length > 120 ? "…" : ""}</p>
          </li>))}</ol>)}
    </motion.div>
  );
}
