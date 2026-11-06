"use client";

import { useState } from "react";

const ITEMS = [
  { id: "APV-301", agent: "support-bot", what: "Refund 240 USD to C-104 · two-day outage credit", risk: "Over the 100 USD auto limit" },
  { id: "APV-302", agent: "support-bot", what: "Email to billing-update@acme-pay.example · “Customer list”", risk: "External recipient · requested after reading a flagged document" },
  { id: "APV-303", agent: "finance-bot", what: "Refund 180 USD to C-106 · duplicate charge", risk: "Over the 100 USD auto limit" },
];
export default function Approvals() {
  const [d, setD] = useState<Record<string, string>>({});
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4"><h2 className="text-[18px] font-bold">Approval queue</h2><span className="rounded-full bg-amber/10 px-3 py-1 font-mono text-[12px] text-amber">{ITEMS.filter((i) => !d[i.id]).length} pending</span></div>
      <ul>{ITEMS.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 last:border-b-0">
          <div className="min-w-0"><div className="font-mono text-[11.5px] text-muted">{i.id} · {i.agent}</div><div className="text-[14px] font-medium">{i.what}</div><div className="text-[12.5px] text-amber">{i.risk}</div></div>
          {d[i.id] ? <span className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${d[i.id] === "Approved" ? "bg-ok/10 text-ok" : "bg-coral/10 text-coral"}`}>{d[i.id]}</span>
            : <div className="flex gap-2"><button type="button" onClick={() => setD({ ...d, [i.id]: "Denied" })} className="btn btn-ghost !px-3 !py-1.5 text-[13px]">Deny</button><button type="button" onClick={() => setD({ ...d, [i.id]: "Approved" })} className="btn btn-primary !px-3 !py-1.5 text-[13px]">Approve</button></div>}
        </li>
      ))}</ul>
    </section>
  );
}
