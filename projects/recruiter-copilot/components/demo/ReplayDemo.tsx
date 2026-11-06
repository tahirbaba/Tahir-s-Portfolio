"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Assessment from "./Assessment";
import type { Replay } from "./types";

export function CvDoc({ text, redacted }: { text: string; redacted?: boolean }) {
  const parts = text.split(/(\[candidate\]|\[email\]|\[phone\]|\[removed\])/g);
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 text-[#1f2937] shadow-[0_30px_60px_-35px_#0c1a2155]">
      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[1.7]">
        {parts.map((p, i) => (/^\[(candidate|email|phone|removed)\]$/.test(p) ? <mark key={i} className="rounded bg-[#0c1a21] px-1 text-[#67e8f9]">{p}</mark> : <span key={i}>{p}</span>))}
      </pre>
      {redacted && <p className="mt-3 font-mono text-[10.5px] text-[#64748b]">This is all the AI sees.</p>}
    </div>
  );
}

export default function ReplayDemo({ replays }: { replays: Replay[] }) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(0);
  const [view, setView] = useState<"original" | "redacted">("original");
  const [playing, setPlaying] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const r = replays[i];
  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(2); setView("redacted"); return; }
    setStage(0); setView("original");
    timers.current.push(setTimeout(() => setView("redacted"), 1600), setTimeout(() => setStage(1), 3000), setTimeout(() => setStage(2), 5200));
    if (playing) timers.current.push(setTimeout(() => setI((x) => (x + 1) % replays.length), 14000));
    return () => timers.current.forEach(clearTimeout);
  }, [i, playing, replays.length]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{replays.map((x, k) => <button key={x.id} type="button" onClick={() => setI(k)} className={`shrink-0 rounded-xl border px-3.5 py-2 text-left text-[13px] font-medium ${k === i ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60"}`}>{x.title}</button>)}</div>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">{playing ? "❚❚ Pause" : "▶ Resume"}</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between"><p className="font-mono text-[11.5px] text-muted">The application</p>
            <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-[12px]">{(["original", "redacted"] as const).map((v) => <button key={v} type="button" onClick={() => { setView(v); setPlaying(false); }} className={`rounded-md px-2.5 py-1 ${view === v ? "bg-fg text-ink" : "text-muted"}`}>{v === "original" ? "Original CV" : "What the AI sees"}</button>)}</div></div>
          <div className="rounded-3xl border border-line bg-gradient-to-br from-teal-soft/70 to-panel p-5 sm:p-7">
            <AnimatePresence mode="wait"><motion.div key={r.id + view} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0 }}><CvDoc text={view === "original" ? r.cv : r.redacted} redacted={view === "redacted"} /></motion.div></AnimatePresence>
            <div className="mt-4 grid gap-2 text-[12px] sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-panel p-3"><p className="font-mono text-[10.5px] text-dim">Application form</p><p>Claims {r.form.claimed_years} years · degree {r.form.degree_year}</p></div>
              <div className="rounded-xl border border-line bg-panel p-3"><p className="font-mono text-[10.5px] text-dim">Public profile</p>{r.public.roles.map((x) => <p key={x.company}>{x.title} · {x.company}</p>)}</div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3"><p className="font-mono text-[11.5px] text-muted">What Verity finds</p>
          <div className="dark-zone flex min-h-[600px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">
            <div className="flex items-center justify-between"><span className="font-mono text-[12px] text-muted">{stage === 0 ? "removing protected attributes…" : "verity · checks"}</span><span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${r.kind === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>{r.kind === "recorded" ? `recorded run · ${r.model}` : "replay · scripted reading, real checks"}</span></div>
            {stage >= 1 && <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Assessment r={r.result} delay={0.3} /></motion.div>}
            {stage >= 2 && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ice/30 bg-panel p-3.5 text-[13.5px] leading-relaxed">{r.reply}</motion.p>}
          </div>
        </div>
      </div>
      {r.kind === "scripted" && <p className="text-[12.5px] text-dim">Replays use scripted CV reading so watching costs nothing. Redaction, scoring, evidence checks and consistency flags all ran in the real Python code.</p>}
    </div>
  );
}
