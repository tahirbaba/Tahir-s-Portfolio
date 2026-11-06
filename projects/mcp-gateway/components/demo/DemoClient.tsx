"use client";

import { useState } from "react";
import LiveAgent from "./LiveAgent";
import Playground from "./Playground";
import ReplayDemo from "./ReplayDemo";
import type { Replay } from "./types";

const TABS = [["replay", "Watch agents meet the gateway"], ["play", "Attack it yourself"], ["live", "Live Claude agent"]] as const;
export default function DemoClient({ replays }: { replays: Replay[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("replay");
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="inline-flex flex-wrap self-start rounded-xl border border-line bg-panel p-1">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-[14px] font-medium ${tab === k ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}>{l}</button>)}
      </div>
      {tab === "replay" && <><ReplayDemo replays={replays} /><p className="text-[12.5px] text-dim">In replays the agent's words are scripted; every allow, block and hold was decided by the real gateway code. The “Attack it yourself” tab calls the live gateway directly.</p></>}
      {tab === "play" && <Playground />}
      {tab === "live" && <LiveAgent />}
    </div>
  );
}
