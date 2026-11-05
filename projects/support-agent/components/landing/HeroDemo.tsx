"use client";

import { PhoneChat } from "@/components/demo/CustomerViews";
import type { Replay } from "@/components/demo/types";
import { useReplay } from "@/components/demo/useReplay";

export default function HeroDemo({ replays }: { replays: Replay[] }) {
  const { view } = useReplay(replays, { playing: true, speed: 1.15 });
  const last = view.replay.trace.filter((e) => e.kind === "tool").slice(0, Math.max(0, view.traceShown));
  return (
    <div className="relative">
      <PhoneChat v={view} />
      <div className="dark-zone absolute -right-2 bottom-24 hidden w-[220px] rounded-2xl border border-line bg-ink/95 p-3 shadow-2xl backdrop-blur sm:block  xl:-right-16">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-dim">Relay is working</p>
        <ul className="flex flex-col gap-1.5">
          {last.length === 0 && <li className="font-mono text-[11px] text-dim">listening…</li>}
          {last.map((e, i) => e.kind === "tool" && (
            <li key={i} className={`flex items-center gap-2 font-mono text-[11px] ${e.isError ? "text-amber" : "text-ice"}`}>
              <span>{e.isError ? "!" : "✓"}</span>{e.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
