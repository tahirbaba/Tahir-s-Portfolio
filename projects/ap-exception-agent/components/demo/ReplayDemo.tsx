"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Controls, { ExtractionTable } from "./Controls";
import { scriptClass, type Replay } from "./types";

export function InvoiceDoc({ doc, scanning }: { doc: string; scanning?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e7e2d6] bg-[#fffdf8] p-5 text-[#2b2a26] shadow-[0_30px_60px_-35px_#0c1a2155]">
      <pre dir="auto" className="overflow-x-auto whitespace-pre font-mono text-[11px] leading-[1.7]">{doc}</pre>
      {scanning && <motion.div aria-hidden className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#86efac55] to-transparent" initial={{ top: "-10%" }} animate={{ top: "105%" }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} />}
    </div>
  );
}

export default function ReplayDemo({ replays }: { replays: Replay[] }) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(0); // 0 reading, 1 extracted, 2 controls, 3 outcome
  const [playing, setPlaying] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const r = replays[i];
  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(3); return; }
    setStage(0);
    [1800, 3600, 6200].forEach((t, k) => timers.current.push(setTimeout(() => setStage(k + 1), t)));
    if (playing) timers.current.push(setTimeout(() => setI((x) => (x + 1) % replays.length), 13000));
    return () => timers.current.forEach(clearTimeout);
  }, [i, playing, replays.length]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{replays.map((x, k) => <button key={x.id} type="button" onClick={() => setI(k)} className={`shrink-0 rounded-xl border px-3.5 py-2 text-left text-[13px] font-medium ${k === i ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60"}`}>{x.title}</button>)}</div>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">{playing ? "❚❚ Pause" : "▶ Resume"}</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-3"><p className="font-mono text-[11.5px] text-muted">The invoice as it arrived</p><div className="rounded-3xl border border-line bg-gradient-to-br from-teal-soft/70 to-panel p-5 sm:p-7"><InvoiceDoc doc={r.doc} scanning={stage === 0} /></div></div>
        <div className="flex min-w-0 flex-col gap-3"><p className="font-mono text-[11.5px] text-muted">What Ledger does</p>
          <div className="dark-zone flex min-h-[560px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">
            <div className="flex items-center justify-between"><span className="font-mono text-[12px] text-muted">{stage === 0 ? "Claude is reading the document…" : "ledger · AP controls"}</span><span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${r.kind === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>{r.kind === "recorded" ? `recorded run · ${r.model}` : "replay · scripted reading, real controls"}</span></div>
            <AnimatePresence mode="wait">
              <motion.div key={r.id} className="flex flex-col gap-4">
                {stage >= 1 && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-dim">Extracted fields</p><ExtractionTable f={r.fields} /></motion.div>}
                {stage >= 2 && <div><p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-dim">Controls (Python)</p><Controls d={r.decision} /></div>}
                {stage >= 3 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                    {r.posted && <p className="text-[13px] text-ok">ERP entry {r.posted.erp_id} created.</p>}
                    {r.exception && <div className="rounded-xl border border-line bg-panel p-3.5"><p className="font-mono text-[11px] text-dim">{r.exception.queue_id} · note for the AP clerk</p><p className="mt-1 text-[13px] leading-relaxed">{r.exception.clerk_note}</p>
                      {r.exception.vendor_message ? <><p className="mt-3 font-mono text-[11px] text-dim">Draft to vendor</p><p dir="auto" className={`mt-1 text-[13px] leading-relaxed text-muted ${scriptClass(r.exception.vendor_message)}`}>{r.exception.vendor_message}</p></> : <p className="mt-2 text-[12px] text-amber">No vendor message drafted on purpose.</p>}</div>}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {r.kind === "scripted" && <p className="text-[12.5px] text-dim">Replays use scripted document reading so watching costs nothing. Every control result and decision came from the real Python rules.</p>}
    </div>
  );
}
