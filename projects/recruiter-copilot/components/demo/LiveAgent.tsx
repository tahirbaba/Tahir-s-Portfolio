"use client";

import { useState } from "react";
import Assessment from "./Assessment";
import { CvDoc } from "./ReplayDemo";

export default function LiveAgent({ sample, sampleName }: { sample: string; sampleName: string }) {
  const [name, setName] = useState(sampleName);
  const [cv, setCv] = useState(sample);
  const [years, setYears] = useState(7);
  const [deg, setDeg] = useState(2018);
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setErr(""); setOut(null);
    try { const res = await fetch("/api/py/screen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, cv, claimed_years: years, degree_year: deg }) }); const d = await res.json(); if (!res.ok) setErr(d.error || "Request failed."); else setOut(d); }
    catch { setErr("Connection lost."); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel flex flex-col gap-3 p-5"><p className="eyebrow">Screen any CV with Claude</p>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Candidate name" className="rounded-xl border border-line-2 bg-panel px-3 py-2.5" />
        <textarea rows={14} value={cv} onChange={(e) => setCv(e.target.value)} aria-label="CV text" className="resize-none rounded-xl border border-line-2 bg-panel p-3 font-mono text-[12px]" />
        <div className="grid grid-cols-2 gap-3"><input type="number" aria-label="Claimed years" value={years} onChange={(e) => setYears(Number(e.target.value))} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono" /><input type="number" aria-label="Degree year" value={deg} onChange={(e) => setDeg(Number(e.target.value))} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono" /></div>
        <button type="button" disabled={busy} onClick={run} className="btn btn-coral self-start disabled:opacity-50">{busy ? "Screening…" : "Screen with Claude"}</button>
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
      </div>
      <div className="dark-zone flex min-h-[420px] flex-col gap-4 rounded-3xl border border-line bg-ink p-5">
        {out ? <><CvDoc text={out.redacted} redacted />{out.state.result && <Assessment r={out.state.result} />}<p className="text-[13.5px] leading-relaxed">{out.reply}</p></> : <p className="m-auto font-mono text-[12px] text-dim">The redacted CV and assessment appear here.</p>}
      </div>
    </div>
  );
}
