"use client";

import { motion } from "motion/react";
import { DECISION, money, type Decision, type Fields } from "./types";

const row = (ok: boolean | null, title: string, detail: string, i: number) => (
  <motion.li key={title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className={`rounded-xl border px-3.5 py-2.5 ${ok === false ? "border-coral/40 bg-coral/5" : "border-line bg-panel"}`}>
    <div className="flex items-center gap-2 text-[13.5px] font-medium"><span className={`grid h-5 w-5 place-items-center rounded-md text-[11px] ${ok === false ? "bg-coral/20 text-coral" : "bg-ice/15 text-ice"}`}>{ok === false ? "!" : "✓"}</span>{title}</div>
    <p className={`mt-1 text-[12.5px] leading-snug ${ok === false ? "text-coral" : "text-muted"}`}>{detail}</p>
  </motion.li>
);

export function ExtractionTable({ f }: { f: Fields }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[380px] text-left font-mono text-[11.5px]">
        <tbody>
          {[["Vendor", `${f.vendor_name} · ${f.vendor_tax_id}`], ["Invoice", `${f.invoice_number} · ${f.invoice_date}`], ["PO", f.po_number], ["Total", `${money(f.subtotal)} + ${money(f.tax)} = ${money(f.total)} ${f.currency}`], ["IBAN", f.bank_iban]].map(([k, v]) => (
            <tr key={k} className="border-b border-line last:border-b-0"><td className="w-20 px-3 py-1.5 text-dim">{k}</td><td className="px-3 py-1.5 text-fg">{v}</td></tr>
          ))}
          {f.lines.map((l, i) => <tr key={i} className="border-t border-line"><td className="px-3 py-1.5 text-dim">Line {i + 1}</td><td className="px-3 py-1.5 text-muted">{l.description} · {l.qty} × {money(l.unit_price)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default function Controls({ d }: { d: Decision }) {
  const c = d.checks;
  const items: [boolean | null, string, string][] = [];
  items.push([c.extraction.length === 0, "Arithmetic", c.extraction.length ? c.extraction.join(" · ") : "Lines, subtotal, tax and total add up"]);
  if (c.bank) items.push([c.bank.ok, "Bank details", c.bank.reason]);
  if (c.duplicate) items.push([!c.duplicate.duplicate, "Duplicate check", c.duplicate.reason]);
  if (c.match) items.push([c.match.ok, "3-way match (PO · receipt · invoice)", c.match.ok ? c.match.lines.map((l: any) => `${l.line}: ${l.status}`).join(" · ") : c.match.issues.join(" · ")]);
  if (c.tax) items.push([c.tax.ok, "Tax", c.tax.reason]);
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">{items.map(([ok, t, dt], i) => row(ok, t, dt, i))}</ol>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: items.length * 0.15 + 0.1 }} className={`rounded-xl border px-4 py-3 ${DECISION[d.decision].cls}`}>
        <div className="font-mono text-[11.5px] font-semibold">{DECISION[d.decision].label}</div>
        <div className="mt-0.5 text-[13px]">{d.reasons[0]}</div>
      </motion.div>
    </div>
  );
}
