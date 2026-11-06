"use client";

import { useState } from "react";
import Controls from "./Controls";
import type { Decision, Fields, Replay } from "./types";

export default function Checker({ replays }: { replays: Replay[] }) {
  const [src, setSrc] = useState(replays[0].id);
  const [f, setF] = useState<Fields>(replays[0].fields);
  const [d, setD] = useState<Decision | null>(null);
  const [error, setError] = useState("");
  const set = (k: keyof Fields, v: string) => setF({ ...f, [k]: ["subtotal", "tax", "total"].includes(k) ? Number(v) : v } as Fields);
  async function run() {
    setError("");
    try {
      const res = await fetch("/api/py/controls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await res.json(); if (!res.ok) setError(j.error || j.detail?.[0]?.msg || "Invalid fields"); else setD(j);
    } catch { setError("The controls service could not be reached."); }
  }
  const input = (k: keyof Fields, label: string) => (
    <label className="flex flex-col gap-1 text-[12.5px]"><span className="text-muted">{label}</span><input value={String(f[k])} onChange={(e) => set(k, e.target.value)} className="rounded-lg border border-line-2 bg-panel px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-ice" /></label>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between"><p className="eyebrow">Change an invoice, rerun the controls</p><span className="font-mono text-[11px] text-ok">● live · no AI needed</span></div>
        <select value={src} onChange={(e) => { const r = replays.find((x) => x.id === e.target.value)!; setSrc(r.id); setF(r.fields); setD(null); }} className="rounded-xl border border-line-2 bg-panel px-3 py-2.5 text-[14px]">{replays.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
        <div className="grid gap-3 sm:grid-cols-2">{input("invoice_number", "Invoice number")}{input("invoice_date", "Date")}{input("po_number", "PO")}{input("currency", "Currency")}{input("subtotal", "Subtotal")}{input("tax", "Tax")}{input("total", "Total")}{input("bank_iban", "IBAN")}</div>
        <div className="flex flex-col gap-2"><span className="text-[12.5px] text-muted">Lines (quantity × unit price)</span>
          {f.lines.map((l, i) => <div key={i} className="grid grid-cols-[1fr_80px_100px] gap-2"><span className="truncate py-2 text-[12.5px]">{l.description}</span>
            <input aria-label="quantity" value={l.qty} onChange={(e) => setF({ ...f, lines: f.lines.map((x, k) => (k === i ? { ...x, qty: Number(e.target.value) } : x)) })} className="rounded-lg border border-line-2 bg-panel px-2 py-2 font-mono text-[12.5px]" />
            <input aria-label="unit price" value={l.unit_price} onChange={(e) => setF({ ...f, lines: f.lines.map((x, k) => (k === i ? { ...x, unit_price: Number(e.target.value) } : x)) })} className="rounded-lg border border-line-2 bg-panel px-2 py-2 font-mono text-[12.5px]" /></div>)}
        </div>
        <button type="button" onClick={run} className="btn btn-primary self-start">Run controls</button>
        {error && <p role="alert" className="text-[13px] text-coral">{error}</p>}
        <p className="text-[12px] text-dim">Try: change one IBAN digit, bill more toner than arrived, set the invoice number to GP-2291, or nudge a price up 3%.</p>
      </div>
      <div className="dark-zone flex min-h-[460px] flex-col gap-3 rounded-3xl border border-line bg-ink p-5">{d ? <Controls d={d} /> : <p className="m-auto font-mono text-[12px] text-dim">Results from the live controls appear here.</p>}</div>
    </div>
  );
}
