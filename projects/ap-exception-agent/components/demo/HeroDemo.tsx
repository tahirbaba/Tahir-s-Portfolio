"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { InvoiceDoc } from "./ReplayDemo";
import { DECISION, type Replay } from "./types";

export default function HeroDemo({ replays }: { replays: Replay[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const t = setInterval(() => setI((x) => (x + 1) % replays.length), 3600); return () => clearInterval(t); }, [replays.length]);
  const r = replays[i];
  return (
    <div className="relative">
      <AnimatePresence mode="wait"><motion.div key={r.id} initial={{ opacity: 0, rotate: -1, y: 10 }} animate={{ opacity: 1, rotate: 0, y: 0 }} exit={{ opacity: 0, y: -10 }}><InvoiceDoc doc={r.doc} /></motion.div></AnimatePresence>
      <AnimatePresence mode="wait"><motion.div key={r.id + "s"} initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: -6 }} transition={{ delay: 0.7, type: "spring" }}
        className={`absolute -bottom-5 right-4 rounded-xl border-2 px-4 py-2 font-mono text-[13px] font-bold shadow-xl backdrop-blur ${DECISION[r.decision.decision].cls}`}>{DECISION[r.decision.decision].label}</motion.div></AnimatePresence>
    </div>
  );
}
