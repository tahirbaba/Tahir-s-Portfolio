"use client";

import { useState } from "react";
import Console from "@/components/Console";
import BehindScenes from "./BehindScenes";
import { PhoneChat, WebWidget } from "./CustomerViews";
import type { Replay } from "./types";
import { useReplay } from "./useReplay";

export default function DemoClient({ replays }: { replays: Replay[] }) {
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [playing, setPlaying] = useState(true);
  const { view, index, setIndex } = useReplay(replays, { playing });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Demo mode" className="inline-flex rounded-xl border border-line bg-panel p-1">
          {(["replay", "live"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-2 text-[14px] font-medium transition-colors ${mode === m ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}>
              {m === "replay" ? "Watch replays" : "Talk to it live"}
            </button>
          ))}
        </div>
        {mode === "replay" && (
          <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">
            {playing ? "❚❚ Pause auto-play" : "▶ Resume auto-play"}
          </button>
        )}
      </div>

      {mode === "replay" ? (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Scenarios">
            {replays.map((r, i) => (
              <button key={r.id} role="tab" aria-selected={i === index} type="button" onClick={() => setIndex(i)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition-all ${i === index ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60 hover:border-line-2"}`}>
                <span className="block text-[13px] font-medium">{r.title}</span>
                <span className="font-mono text-[10.5px] text-dim">{r.lang} · {r.channel === "chat" ? "chat app" : "website"}</span>
              </button>
            ))}
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-mono text-[11.5px] text-muted">What {view.replay.name} sees · {view.replay.channel === "chat" ? "chat app" : "store website"}</p>
              <div className="flex flex-1 items-center rounded-3xl border border-line bg-gradient-to-br from-teal-soft/60 to-panel p-5 sm:p-8">
                {view.replay.channel === "chat" ? <PhoneChat v={view} /> : <WebWidget v={view} />}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-mono text-[11.5px] text-muted">What Relay does</p>
              <BehindScenes trace={view.replay.trace} shown={view.traceShown} actions={view.replay.actions} done={view.done} source={view.replay.source} model={view.replay.model} />
            </div>
          </div>
          {view.replay.source === "scripted" && (
            <p className="text-[12.5px] text-dim">These replays use scripted replies so watching costs nothing. Every tool call ran the real rules: refunds, approvals and blocks were decided by the code. Switch to “Talk to it live” for the real Claude agent.</p>
          )}
        </>
      ) : (
        <div className="dark-zone gutter -mx-[18px] rounded-3xl bg-ink sm:mx-0 sm:px-4">
          <Console />
        </div>
      )}
    </div>
  );
}
