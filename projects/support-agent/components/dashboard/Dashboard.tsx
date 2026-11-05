"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { APPROVALS, MINUTES_PER_TICKET, sampleWeek } from "@/lib/sample-week";

const C = { auto: "var(--color-ice)", approval: "var(--color-amber)", human: "var(--color-coral)" };

export default function Dashboard() {
  const w = useMemo(sampleWeek, []);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const [toast, setToast] = useState("");

  useEffect(() => { try { setDecisions(JSON.parse(localStorage.getItem("relay-approvals") || "{}")); } catch {} }, []);
  function decide(id: string, d: "approved" | "rejected") {
    const next = { ...decisions, [id]: d };
    setDecisions(next);
    try { localStorage.setItem("relay-approvals", JSON.stringify(next)); } catch {}
    setToast(`${id} ${d}. The customer gets an update in their language.`);
    setTimeout(() => setToast(""), 2600);
  }
  const pending = APPROVALS.filter((a) => !decisions[a.id]);
  const max = Math.max(...w.days.map((d) => d.auto + d.approval + d.human));

  const kpis = [
    { label: "Conversations", value: w.total.toLocaleString() },
    { label: "Resolved by Relay", value: `${w.autoRate}%` },
    { label: "Handed to your team", value: String(w.human) },
    { label: "Refunds awaiting approval", value: String(pending.length) },
    { label: `Hours saved (${MINUTES_PER_TICKET} min/ticket)`, value: String(w.hoursSaved) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber">
        <strong className="font-semibold">Sample data.</strong> A simulated week that shows what a support manager sees. It is not production traffic.
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-panel p-5">
            <div className="font-display text-[30px] font-bold tabular-nums tracking-tight">{k.value}</div>
            <div className="text-[12.5px] text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[18px] font-bold">Conversations this week</h2>
            <div className="flex gap-4 text-[12px] text-muted">
              {[["Resolved by Relay", C.auto], ["Approval", C.approval], ["Your team", C.human]].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>
              ))}
            </div>
          </div>
          <div className="flex h-[330px] items-end gap-3" role="img" aria-label="Stacked bar chart of daily conversations by outcome">
            {w.days.map((d, i) => {
              const tot = d.auto + d.approval + d.human;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-mono text-[11px] tabular-nums text-muted">{tot}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(tot / max) * 270}px` }} transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex w-full max-w-[46px] flex-col-reverse overflow-hidden rounded-md">
                    <div style={{ height: `${(d.auto / tot) * 100}%`, background: C.auto }} />
                    <div style={{ height: `${(d.approval / tot) * 100}%`, background: C.approval }} className="border-t-2 border-panel" />
                    <div style={{ height: `${(d.human / tot) * 100}%`, background: C.human }} className="border-t-2 border-panel" />
                  </motion.div>
                  <span className="font-mono text-[11px] text-dim">{d.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="mb-4 text-[18px] font-bold">Languages</h2>
          <ul className="flex flex-col gap-3">
            {w.languages.map((l) => (
              <li key={l.label}>
                <div className="mb-1 flex justify-between text-[13px]"><span>{l.label}</span><span className="font-mono tabular-nums text-muted">{l.value} · {Math.round((100 * l.value) / w.total)}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-panel-2"><motion.div initial={{ width: 0 }} animate={{ width: `${(100 * l.value) / w.total}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-ice" /></div>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-7 text-[18px] font-bold">Top reasons</h2>
          <ul className="flex flex-col gap-2">
            {w.categories.map((c) => (
              <li key={c.label} className="flex items-center gap-3 text-[13px]">
                <span className="w-[150px] shrink-0 truncate">{c.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-fg/70" style={{ width: `${(100 * c.value) / w.categories[0].value}%` }} /></span>
                <span className="w-9 text-right font-mono tabular-nums text-muted">{c.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel overflow-hidden" id="approvals">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[18px] font-bold">Approval inbox</h2>
            <p className="text-[13px] text-muted">Refunds above 100 USD wait here for a care lead. Relay prepared each case.</p>
          </div>
          <span className="rounded-full bg-amber/10 px-3 py-1 font-mono text-[12px] text-amber">{pending.length} pending</span>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {APPROVALS.map((a) => {
              const d = decisions[a.id];
              return (
                <motion.li key={a.id} layout className={`grid gap-4 border-b border-line px-6 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] ${d ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-muted">
                      <span className="text-fg">{a.id}</span><span>·</span><span>{a.order}</span><span>·</span><span>{a.customer}</span><span>·</span><span>{a.lang}</span><span>·</span><span>{a.age} ago</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3">
                      <span className="font-display text-[22px] font-bold tabular-nums">{a.amount.toLocaleString()} USD</span>
                      <span className="text-[14px] font-medium">{a.reason}</span>
                    </div>
                    <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-muted">{a.summary}</p>
                    <p className="mt-1 font-mono text-[11px] text-dim">Policy: {a.policy}</p>
                  </div>
                  <div className="flex items-center gap-2 self-center">
                    {d ? (
                      <span className={`rounded-lg px-3 py-2 text-[13px] font-semibold ${d === "approved" ? "bg-ok/10 text-ok" : "bg-rose/10 text-rose"}`}>{d === "approved" ? "Approved" : "Rejected"}</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => decide(a.id, "rejected")} className="btn btn-ghost !px-4 !py-2 text-[13.5px]">Reject</button>
                        <button type="button" onClick={() => decide(a.id, "approved")} className="btn btn-primary !px-4 !py-2 text-[13.5px]">Approve refund</button>
                      </>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {Object.keys(decisions).length > 0 && (
          <div className="border-t border-line px-6 py-3 text-right">
            <button type="button" onClick={() => { setDecisions({}); try { localStorage.removeItem("relay-approvals"); } catch {} }} className="text-[12.5px] text-muted underline-offset-4 hover:underline">Reset demo inbox</button>
          </div>
        )}
      </section>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-full bg-fg px-4 py-2 text-[13px] text-ink shadow-lg">{toast}</motion.div>}</AnimatePresence>
      </div>
    </div>
  );
}
