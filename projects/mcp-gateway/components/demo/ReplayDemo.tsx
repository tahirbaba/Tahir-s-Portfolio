"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import GatewayCard from "./GatewayCard";
import { AGENT_INFO, DECISION_STYLE, type GatewayEvent, type Replay } from "./types";

export default function ReplayDemo({ replays, compact = false }: { replays: Replay[]; compact?: boolean }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [replyShown, setReplyShown] = useState(false);
  const [playing, setPlaying] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const r = replays[i];
  const gw = r.trace.filter((e): e is GatewayEvent => e.kind === "gateway");

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(gw.length); setReplyShown(true); return; }
    setShown(0); setReplyShown(false);
    let t = 900;
    gw.forEach((_, k) => { t += 1500; timers.current.push(setTimeout(() => setShown(k + 1), t)); });
    t += 1200; timers.current.push(setTimeout(() => setReplyShown(true), t));
    if (playing) timers.current.push(setTimeout(() => setI((x) => (x + 1) % replays.length), t + 5500));
    return () => timers.current.forEach(clearTimeout);
  }, [i, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const info = AGENT_INFO[r.agent];
  return (
    <div className="flex flex-col gap-5">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {replays.map((x, k) => (
              <button key={x.id} type="button" onClick={() => setI(k)} className={`shrink-0 rounded-xl border px-3.5 py-2 text-left ${k === i ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60"}`}>
                <span className="block text-[13px] font-medium">{x.title}</span><span className="font-mono text-[10.5px] text-dim">{AGENT_INFO[x.agent].name}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">{playing ? "❚❚ Pause" : "▶ Resume"}</button>
        </div>
      )}
      <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"}`}>
        <div className="flex min-w-0 flex-col gap-3">
          {!compact && <p className="font-mono text-[11.5px] text-muted">The AI agent</p>}
          <div className="panel flex flex-1 flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-fg px-2.5 py-1 font-mono text-[11.5px] text-ink">{r.agent}</span>
              {info.scopes.map((s) => <span key={s} className="rounded-md border border-line-2 px-2 py-0.5 font-mono text-[10.5px] text-muted">{s}</span>)}
              <span className="rounded-md border border-line-2 px-2 py-0.5 font-mono text-[10.5px] text-muted">pii: {info.pii}</span>
            </div>
            <div className="rounded-2xl bg-panel-2 p-4"><p className="font-mono text-[11px] text-dim">Task from a user</p><p className="mt-1 text-[15px] leading-relaxed">{r.task}</p></div>
            <ul className="flex flex-col gap-1.5">
              {gw.slice(0, shown).map((g, k) => (
                <motion.li key={`${r.id}${k}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between gap-2 font-mono text-[12px]">
                  <span className="truncate text-muted">→ calls <span className="text-fg">{g.tool}</span></span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${DECISION_STYLE[g.decision]}`}>{g.decision.replace("_", " ")}</span>
                </motion.li>
              ))}
              {shown < gw.length && <li className="typing flex gap-1 text-dim"><span /><span /><span /></li>}
            </ul>
            <AnimatePresence>{replyShown && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-auto rounded-2xl border border-ice/30 bg-teal-soft/40 p-4 text-[14.5px] leading-relaxed">{r.reply}</motion.div>}</AnimatePresence>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          {!compact && <p className="font-mono text-[11.5px] text-muted">What the gateway decides</p>}
          <div className="dark-zone flex min-h-[520px] flex-1 flex-col gap-3 rounded-3xl border border-line bg-ink p-5">
            <div className="flex items-center justify-between"><span className="font-mono text-[12px] text-muted">gatekeeper · MCP</span><span className={`rounded-md px-2 py-0.5 font-mono text-[10.5px] ${r.kind === "recorded" ? "bg-ok/15 text-ok" : "bg-amber/15 text-amber"}`}>{r.kind === "recorded" ? `recorded run · ${r.model}` : "replay · scripted agent, real gateway"}</span></div>
            {gw.slice(0, shown).map((g, k) => <GatewayCard key={`${r.id}${k}`} {...g} />)}
            {shown === 0 && <p className="m-auto font-mono text-[12px] text-dim">waiting for a tool call…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
