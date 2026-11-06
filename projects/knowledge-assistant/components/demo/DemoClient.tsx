"use client";

import { useState } from "react";
import LiveAsk from "./LiveAsk";
import ReplayDemo from "./ReplayDemo";
import SearchPlay from "./SearchPlay";
import type { Replay } from "./types";

const TABS = [["replay", "Watch questions answered"], ["search", "Compare roles yourself"], ["live", "Live Claude answers"]] as const;
export default function DemoClient({ replays }: { replays: Replay[] }) {
  const [t, setT] = useState<(typeof TABS)[number][0]>("replay");
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="inline-flex flex-wrap self-start rounded-xl border border-line bg-panel p-1">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={t === k} type="button" onClick={() => setT(k)} className={`rounded-lg px-4 py-2 text-[14px] font-medium ${t === k ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}>{l}</button>)}</div>
      {t === "replay" && <ReplayDemo replays={replays} />}
      {t === "search" && <SearchPlay />}
      {t === "live" && <LiveAsk />}
    </div>
  );
}
