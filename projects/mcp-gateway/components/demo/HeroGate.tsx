"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import GatewayCard from "./GatewayCard";
import type { GatewayEvent, Replay } from "./types";

export default function HeroGate({ replays }: { replays: Replay[] }) {
  const events = replays.flatMap((r) => r.trace.filter((e): e is GatewayEvent => e.kind === "gateway").map((g) => ({ ...g, agent: r.agent })));
  const [i, setI] = useState(0);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const t = setInterval(() => setI((x) => (x + 1) % events.length), 2800); return () => clearInterval(t); }, [events.length]);
  const e = events[i];
  return (
    <div className="dark-zone relative rounded-3xl border border-line bg-ink p-5 shadow-[0_40px_80px_-40px_#0009]">
      <div className="mb-4 flex items-center justify-between font-mono text-[11.5px] text-muted"><span>agent: <span className="text-fg">{e.agent}</span></span><span>gatekeeper · live policy</span></div>
      <AnimatePresence mode="wait"><motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><GatewayCard {...e} /></motion.div></AnimatePresence>
      <div className="mt-4 flex gap-1">{events.map((_, k) => <span key={k} className={`h-1 flex-1 rounded-full ${k === i ? "bg-ice" : "bg-line-2"}`} />)}</div>
    </div>
  );
}
