"use client";

import { useState } from "react";
import Checker from "./Checker";
import LiveAgent from "./LiveAgent";
import ReplayDemo from "./ReplayDemo";
import type { Replay } from "./types";

const TABS = [["replay", "Watch candidates screened"], ["check", "Change the claims yourself"], ["live", "Live Claude screening"]] as const;
export default function DemoClient({ replays }: { replays: Replay[] }) {
  const [t, setT] = useState<(typeof TABS)[number][0]>("replay");
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="inline-flex flex-wrap self-start rounded-xl border border-line bg-panel p-1">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={t === k} type="button" onClick={() => setT(k)} className={`rounded-lg px-4 py-2 text-[14px] font-medium ${t === k ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}>{l}</button>)}</div>
      {t === "replay" && <ReplayDemo replays={replays} />}
      {t === "check" && <Checker replays={replays.filter((r) => r.id !== "amina_twin")} />}
      {t === "live" && <LiveAgent sample={replays[0].cv} sampleName={replays[0].name} />}
    </div>
  );
}
