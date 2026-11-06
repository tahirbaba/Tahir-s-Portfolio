"use client";

import { useState } from "react";
import Answer from "./Answer";
import Retrieval from "./Retrieval";
import { ROLE_LABEL } from "./types";

export default function LiveAsk() {
  const [role, setRole] = useState("employee");
  const [q, setQ] = useState("Mujhe saal mein kitni chuttiyan milti hain?");
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setErr(""); setOut(null);
    try { const res = await fetch("/api/py/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, role }) }); const d = await res.json(); if (!res.ok) setErr(d.error || "Request failed."); else setOut(d); }
    catch { setErr("Connection lost."); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel flex flex-col gap-3 p-5"><p className="eyebrow">Ask Claude, as any role</p>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5">{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <textarea dir="auto" rows={3} value={q} onChange={(e) => setQ(e.target.value)} className="resize-none rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14.5px]" />
        <button type="button" disabled={busy} onClick={run} className="btn btn-coral self-start disabled:opacity-50">{busy ? "Searching and answering…" : "Ask"}</button>
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
        {out && <div className="rounded-2xl bg-panel-2 p-4"><Answer text={out.reply} sources={out.trace.flatMap((t: any) => t.hits)} /><p className="mt-2 font-mono text-[11px] text-dim">{(out.latencyMs / 1000).toFixed(1)}s · ${out.costUsd.toFixed(4)}{out.guarded ? " · citation guard applied" : ""}</p></div>}
      </div>
      <div className="dark-zone flex min-h-[380px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">{out ? out.trace.map((t: any, k: number) => <Retrieval key={k} s={t} i={k} />) : <p className="m-auto font-mono text-[12px] text-dim">Retrieval appears here.</p>}</div>
    </div>
  );
}
