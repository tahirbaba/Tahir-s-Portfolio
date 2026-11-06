"use client";

import { useState } from "react";
import Assessment from "./Assessment";
import type { Replay, Result } from "./types";

export default function Checker({ replays }: { replays: Replay[] }) {
  const [id, setId] = useState(replays[0].id);
  const c = replays.find((x) => x.id === id)!;
  const [years, setYears] = useState(c.form.claimed_years);
  const [deg, setDeg] = useState(c.form.degree_year);
  const [title, setTitle] = useState(c.public.roles[0]?.title ?? "");
  const [r, setR] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  async function run() {
    setErr("");
    try { const res = await fetch("/api/py/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidate_id: id, claimed_years: years, degree_year: deg, public_title: title || null }) }); const d = await res.json(); if (!res.ok) setErr(d.error || "Invalid input"); else setR(d); }
    catch { setErr("The checks service could not be reached."); }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between"><p className="eyebrow">Change the claims, rerun the checks</p><span className="font-mono text-[11px] text-ok">● live · no AI needed</span></div>
        <select value={id} onChange={(e) => { const n = replays.find((x) => x.id === e.target.value)!; setId(n.id); setYears(n.form.claimed_years); setDeg(n.form.degree_year); setTitle(n.public.roles[0]?.title ?? ""); setR(null); }} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px]">{replays.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
        <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Years of experience claimed on the form</span><input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono" /></label>
        <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Degree year on the form</span><input type="number" value={deg} onChange={(e) => setDeg(Number(e.target.value))} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 font-mono" /></label>
        <label className="flex flex-col gap-1 text-[13px]"><span className="text-muted">Current title on the public profile ({c.public.roles[0]?.company})</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5" /></label>
        <button type="button" onClick={run} className="btn btn-primary self-start">Run checks</button>
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
        <p className="text-[12px] text-dim">Try: claim 12 years for the first candidate, or change Omar's public title to “Lead Data Engineer”.</p>
      </div>
      <div className="dark-zone min-h-[460px] rounded-3xl border border-line bg-ink p-5">{r ? <Assessment r={r} /> : <p className="grid h-full place-items-center font-mono text-[12px] text-dim">Live results appear here.</p>}</div>
    </div>
  );
}
