"use client";

import { useState } from "react";

const ITEMS = [
  { id: "EXC-4411", inv: "IL-8890 · Indus Logistics", amt: "1,091,500.00 PKR", type: "Payment hold", note: "New bank account requested on the invoice. Call the vendor on the number in the master file.", tone: "text-rose" },
  { id: "EXC-4552", inv: "ROS-77810 · Riyadh Office Supplies", amt: "21,160.00 SAR", type: "Not yet received", note: "20 toner billed, 14 received. Bilingual note to vendor drafted.", tone: "text-coral" },
  { id: "EXC-4486", inv: "NIT-1193 · Northline IT", amt: "6,768.00 GBP", type: "Price above PO", note: "Laptop setup £105 vs PO £95 (+10.5%).", tone: "text-coral" },
  { id: "EXC-4403", inv: "GP-2355 · Gulf Packaging", amt: "16,720.00 AED", type: "Wrong VAT", note: "10% charged; UAE VAT is 5%. Overstated by 760 AED.", tone: "text-coral" },
];
export default function Queue() {
  const [done, setDone] = useState<Record<string, string>>({});
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4"><div><h2 className="text-[18px] font-bold">Exception queue</h2><p className="text-[13px] text-muted">Every item arrives with the reason and the numbers.</p></div><span className="rounded-full bg-coral/10 px-3 py-1 font-mono text-[12px] text-coral">{ITEMS.filter((i) => !done[i.id]).length} open</span></div>
      <ul>{ITEMS.map((i) => (
        <li key={i.id} className={`grid gap-3 border-b border-line px-6 py-4 last:border-b-0 md:grid-cols-[1fr_auto] ${done[i.id] ? "opacity-60" : ""}`}>
          <div className="min-w-0"><div className="font-mono text-[11.5px] text-muted">{i.id} · {i.inv}</div><div className="mt-0.5 flex flex-wrap items-baseline gap-x-3"><span className="font-display text-[19px] font-bold">{i.amt}</span><span className={`text-[13.5px] font-medium ${i.tone}`}>{i.type}</span></div><p className="text-[13px] text-muted">{i.note}</p></div>
          <div className="flex items-center gap-2">{done[i.id] ? <span className="rounded-lg bg-ok/10 px-3 py-1.5 text-[13px] font-semibold text-ok">{done[i.id]}</span> : <><button type="button" onClick={() => setDone({ ...done, [i.id]: "Sent to vendor" })} className="btn btn-ghost !px-3 !py-1.5 text-[13px]">Send vendor note</button><button type="button" onClick={() => setDone({ ...done, [i.id]: "Resolved" })} className="btn btn-primary !px-3 !py-1.5 text-[13px]">Resolve</button></>}</div>
        </li>
      ))}</ul>
    </section>
  );
}
