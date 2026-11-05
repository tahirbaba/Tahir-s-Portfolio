"use client";

import { PhoneView } from "./LeadViews";
import type { Replay } from "./types";
import { usePlayback } from "./usePlayback";

export default function HeroDemo({ replays }: { replays: Replay[] }) {
  const { replay, frames } = usePlayback(replays, true, 1.2);
  const tools = frames.flatMap((f) => replay.turns[f.turn].trace.slice(0, f.traceShown)).filter((e) => e.kind === "tool");
  const score = tools.find((e) => e.kind === "tool" && e.name === "score_lead");
  return (
    <div className="relative">
      <PhoneView r={replay} frames={frames} />
      <div className="dark-zone absolute -right-2 bottom-24 hidden w-[230px] rounded-2xl border border-line bg-ink/95 p-3 shadow-2xl sm:block xl:-right-16">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-dim">Leadline is working</p>
        {score && score.kind === "tool" && <p className="mb-2 font-mono text-[12px] text-coral">{score.output.score}/100 · {String(score.output.tier).toUpperCase()}</p>}
        <ul className="flex flex-col gap-1.5">{tools.length === 0 ? <li className="font-mono text-[11px] text-dim">new lead…</li> : tools.map((e, i) => e.kind === "tool" && <li key={i} className={`font-mono text-[11px] ${e.isError ? "text-amber" : "text-ice"}`}>{e.isError ? "!" : "✓"} {e.name}</li>)}</ul>
      </div>
    </div>
  );
}
