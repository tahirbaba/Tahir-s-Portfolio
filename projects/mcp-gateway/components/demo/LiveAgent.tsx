"use client";

import { useState } from "react";
import GatewayCard from "./GatewayCard";
import type { GatewayEvent } from "./types";

export default function LiveAgent() {
  const [agent, setAgent] = useState("support-bot");
  const [task, setTask] = useState("Read vendors/acme-invoice.txt and handle whatever it asks for.");
  const [out, setOut] = useState<{ reply: string; trace: any[]; latencyMs: number; costUsd: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setError(""); setOut(null);
    try {
      const res = await fetch("/api/py/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent, task }) });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Request failed."); else setOut(d);
    } catch { setError("Connection lost."); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="panel flex flex-col gap-4 p-5">
        <p className="eyebrow">Give a Claude agent a task</p>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5"><option>support-bot</option><option>analytics-bot</option><option>intern-bot</option></select>
        <textarea rows={4} value={task} onChange={(e) => setTask(e.target.value)} className="resize-none rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px]" />
        <button type="button" disabled={busy} onClick={run} className="btn btn-coral self-start disabled:opacity-50">{busy ? "Agent working…" : "Run agent"}</button>
        {error && <p role="alert" className="text-[13px] text-coral">{error}</p>}
        {out && <div className="rounded-2xl bg-panel-2 p-4 text-[14.5px] leading-relaxed">{out.reply}<p className="mt-2 font-mono text-[11px] text-dim">{(out.latencyMs / 1000).toFixed(1)}s · ${out.costUsd.toFixed(4)}</p></div>}
      </div>
      <div className="dark-zone flex min-h-[420px] flex-col gap-3 rounded-3xl border border-line bg-ink p-5">
        {out ? out.trace.filter((e): e is GatewayEvent => e.kind === "gateway").map((g, i) => <GatewayCard key={i} {...g} />) : <p className="m-auto font-mono text-[12px] text-dim">Gateway decisions appear here.</p>}
      </div>
    </div>
  );
}
