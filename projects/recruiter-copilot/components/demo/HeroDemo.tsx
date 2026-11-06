"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CvDoc } from "./ReplayDemo";
import type { Replay } from "./types";

export default function HeroDemo({ a, b }: { a: Replay; b: Replay }) {
  const [red, setRed] = useState(false);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setRed(true); return; } const t = setInterval(() => setRed((x) => !x), 3200); return () => clearInterval(t); }, []);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {[a, b].map((c) => (
          <AnimatePresence key={c.id} mode="wait"><motion.div key={c.id + red} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0 }} className="max-h-[300px] overflow-hidden text-[10px] [&_pre]:text-[10px]"><CvDoc text={(red ? c.redacted : c.cv).split("\n").slice(0, 8).join("\n")} /></motion.div></AnimatePresence>
        ))}
      </div>
      <div className="dark-zone flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-ink px-4 py-3">
        <span className="font-mono text-[12px] text-muted">{red ? "What the AI sees: identical" : "Two applications, different names and genders"}</span>
        <span className="font-mono text-[13px] text-ok">{a.result.score.total} = {b.result.score.total}</span>
      </div>
    </div>
  );
}
