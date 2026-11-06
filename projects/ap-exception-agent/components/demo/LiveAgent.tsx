"use client";

import { useState } from "react";
import Controls from "./Controls";
import { scriptClass, type Replay } from "./types";

export default function LiveAgent({ sample }: { sample: string }) {
  const [doc, setDoc] = useState(sample);
  const [out, setOut] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setError(""); setOut(null);
    try { const res = await fetch("/api/py/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document: doc }) }); const d = await res.json(); if (!res.ok) setError(d.error || "Request failed."); else setOut(d); }
    catch { setError("Connection lost."); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel flex flex-col gap-3 p-5"><p className="eyebrow">Paste any invoice text</p>
        <textarea dir="auto" rows={16} value={doc} onChange={(e) => setDoc(e.target.value)} className={`resize-none rounded-xl border border-line-2 bg-[#fffdf8] p-3 font-mono text-[12px] text-[#2b2a26] ${scriptClass(doc)}`} />
        <button type="button" disabled={busy} onClick={run} className="btn btn-coral self-start disabled:opacity-50">{busy ? "Claude is reading…" : "Process with Claude"}</button>
        {error && <p role="alert" className="text-[13px] text-coral">{error}</p>}
      </div>
      <div className="dark-zone flex min-h-[420px] flex-col gap-3 rounded-3xl border border-line bg-ink p-5">
        {out ? <>{out.state.decision && <Controls d={out.state.decision} />}<p className="text-[13.5px] leading-relaxed">{out.reply}</p><p className="font-mono text-[11px] text-dim">{(out.latencyMs / 1000).toFixed(1)}s · ${out.costUsd.toFixed(4)}</p></> : <p className="m-auto font-mono text-[12px] text-dim">Extraction and controls appear here.</p>}
      </div>
    </div>
  );
}
export type { Replay };
