"use client";

import { useState } from "react";
import BehindScenes from "./BehindScenes";
import { EmailView, PhoneView } from "./LeadViews";
import LiveLab from "./LiveLab";
import type { Replay } from "./types";
import { usePlayback } from "./usePlayback";

const SOURCE: Record<string, string> = { web_form: "website form", whatsapp: "WhatsApp", missed_call: "missed call" };

export default function DemoClient({ replays }: { replays: Replay[] }) {
  const [mode, setMode] = useState<"replay" | "live">("replay");
  const [playing, setPlaying] = useState(true);
  const { replay, frames, done, index, setIndex } = usePlayback(replays, playing);
  const trace = frames.flatMap((f) => replay.turns[f.turn].trace.slice(0, f.traceShown));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Demo mode" className="inline-flex rounded-xl border border-line bg-panel p-1">
          {(["replay", "live"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => setMode(m)} className={`rounded-lg px-4 py-2 text-[14px] font-medium ${mode === m ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}>{m === "replay" ? "Watch replays" : "Send a lead live"}</button>
          ))}
        </div>
        {mode === "replay" && <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost !py-2 text-[13.5px]">{playing ? "❚❚ Pause auto-play" : "▶ Resume auto-play"}</button>}
      </div>
      {mode === "replay" ? (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Scenarios">
            {replays.map((r, i) => (
              <button key={r.id} role="tab" aria-selected={i === index} type="button" onClick={() => setIndex(i)} className={`shrink-0 rounded-xl border px-3.5 py-2 text-left ${i === index ? "border-fg bg-panel shadow-sm" : "border-line bg-panel/60 hover:border-line-2"}`}>
                <span className="block text-[13px] font-medium">{r.title}</span>
                <span className="font-mono text-[10.5px] text-dim">{r.lang} · {SOURCE[r.source]}</span>
              </button>
            ))}
          </div>
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-mono text-[11.5px] text-muted">What {replay.lead.name} sees · {SOURCE[replay.source]}</p>
              <div className="flex flex-1 items-center rounded-3xl border border-line bg-gradient-to-br from-teal-soft/70 to-panel p-5 sm:p-8">
                {replay.source === "web_form" ? <EmailView r={replay} frames={frames} /> : <PhoneView r={replay} frames={frames} />}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <p className="font-mono text-[11.5px] text-muted">What Leadline does</p>
              <BehindScenes trace={trace} outcome={replay.outcome} done={done} kind={replay.kind} model={replay.model} />
            </div>
          </div>
          {replay.kind === "scripted" && <p className="text-[12.5px] text-dim">Replays use scripted replies so watching costs nothing. Scoring, routing, time-zone checks and bookings ran through the real Python rules. Response times are measured on live runs.</p>}
        </>
      ) : <LiveLab />}
    </div>
  );
}
