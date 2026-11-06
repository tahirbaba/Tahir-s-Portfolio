"use client";

import { useState } from "react";
import Retrieval from "./Retrieval";
import { ROLE_LABEL, type Search } from "./types";

export default function SearchPlay() {
  const [q, setQ] = useState("What is the salary band for a Senior Software Engineer?");
  const [results, setResults] = useState<Record<string, Search>>({});
  const [err, setErr] = useState("");
  async function run() {
    setErr("");
    try {
      const out: Record<string, Search> = {};
      for (const role of Object.keys(ROLE_LABEL)) {
        const res = await fetch("/api/py/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, role }) });
        const d = await res.json(); if (!res.ok) { setErr(d.error || "Invalid question"); return; } out[role] = d;
      }
      setResults(out);
    } catch { setErr("Search could not be reached."); }
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="panel flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between"><p className="eyebrow">Ask once, see what each role gets</p><span className="font-mono text-[11px] text-ok">● live search · no AI needed</span></div>
        <div className="flex flex-col gap-2 sm:flex-row"><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Question" className="min-w-0 flex-1 rounded-xl border border-line-2 bg-panel px-3.5 py-2.5 text-[14.5px] outline-none focus:border-ice" /><button type="button" onClick={run} className="btn btn-primary">Search as every role</button></div>
        <div className="flex flex-wrap gap-1.5">{["What is the salary band for a Senior Software Engineer?", "How much discount can a sales manager approve?", "What is the hotel limit per night?", "When is the month-end close locked?"].map((x) => <button key={x} type="button" onClick={() => setQ(x)} className="rounded-lg border border-line-2 px-2.5 py-1 text-[12px] hover:border-ice hover:text-ice">{x}</button>)}</div>
        {err && <p role="alert" className="text-[13px] text-coral">{err}</p>}
      </div>
      {Object.keys(results).length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Object.entries(results).map(([role, s]) => <div key={role} className="dark-zone rounded-2xl border border-line bg-ink p-4"><p className="mb-3 font-mono text-[12px] text-fg">as {ROLE_LABEL[role]}</p><Retrieval s={s} /></div>)}</div>}
    </div>
  );
}
