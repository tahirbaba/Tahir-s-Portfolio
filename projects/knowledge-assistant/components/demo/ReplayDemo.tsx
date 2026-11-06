"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Answer from "./Answer";
import Retrieval from "./Retrieval";
import { ROLE_LABEL, scriptClass, type Replay } from "./types";

export default function ReplayDemo({ replays }: { replays: Replay[] }) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const r = replays[i];
  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(3); return; }
    setStage(0);
    [900, 2600, 4400].forEach((t, k) => timers.current.push(setTimeout(() => setStage(k + 1), t)));
    if (playing) timers.current.push(setTimeout(() => setI((x) => (x + 1) % replays.length), 11000));
    return () => timers.current.forEach(clearTimeout);
  }, [i, playing, replays.length]);
  const sources = r.trace.flatMap((t) => t.hits);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{replays.map((x, k) => <button key={x.id} type="button" onClick={() => setI(k)} className={`shrink-0 rounded-xl border px-3.5 py-2 text-left ${k === i ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60"}`}><span className="block text-[13px] font-medium">{x.title}</span><span className="font-mono text-[10.5px] text-dim">as {ROLE_LABEL[x.role]}</span></button>)}</div>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">{playing ? "❚❚ Pause" : "▶ Resume"}</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3"><p className="font-mono text-[11.5px] text-muted">What the employee sees</p>
          <div className="panel flex min-h-[520px] flex-col gap-4 p-5">
            <div className="flex items-center justify-between"><span className="font-display text-[16px] font-bold">Compass</span><span className="rounded-full bg-fg px-2.5 py-0.5 font-mono text-[11px] text-ink">signed in as {ROLE_LABEL[r.role]}</span></div>
            <AnimatePresence mode="wait"><motion.div key={r.id} className="flex flex-col gap-3">
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} dir="auto" className={`self-end rounded-2xl rounded-br-md bg-fg px-4 py-2.5 text-[14.5px] text-ink ${scriptClass(r.question)}`}>{r.question}</motion.p>
              {stage > 0 && stage < 3 && <div className="typing flex gap-1 self-start rounded-2xl bg-panel-2 px-3 py-3 text-dim"><span /><span /><span /></div>}
              {stage >= 3 && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="self-start rounded-2xl rounded-bl-md border border-line bg-panel-2 px-4 py-3"><Answer text={r.reply} sources={sources} /></motion.div>}
            </motion.div></AnimatePresence>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3"><p className="font-mono text-[11.5px] text-muted">What Compass does</p>
          <div className="dark-zone flex min-h-[520px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">
            <div className="flex items-center justify-between"><span className="font-mono text-[12px] text-muted">permission-filtered retrieval</span><span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${r.kind === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>{r.kind === "recorded" ? `recorded run · ${r.model}` : "replay · scripted answer, real retrieval"}</span></div>
            {stage >= 1 && r.trace.map((t, k) => <Retrieval key={r.id + k} s={t} i={k} />)}
            {stage >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-xl border px-3.5 py-2.5 text-[12.5px] ${r.guarded ? "border-amber/40 text-amber" : "border-ok/40 text-ok"}`}>
                {r.guarded ? <>Citation guard: the draft answer had no verified source, so it was replaced with “not found”.{r.raw_reply && r.raw_reply !== r.reply && <span className="mt-1 block text-muted">Draft: “{r.raw_reply}”</span>}</> : <>Citations verified: {r.citations.cited.join(", ")} were all retrieved and readable by this role.</>}
              </motion.div>)}
          </div>
        </div>
      </div>
      {r.kind === "scripted" && <p className="text-[12.5px] text-dim">Replays use scripted answers so watching costs nothing. Search, permission filtering, outdated-policy filtering and the citation guard all ran in the real code.</p>}
    </div>
  );
}
