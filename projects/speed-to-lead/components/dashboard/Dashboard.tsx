"use client";

import { motion } from "motion/react";

/* SIMULATED week for illustration only. Not production data. */
const DAYS = [
  { d: "Mon", leads: 41, replied: 41, qualified: 19, booked: 9 }, { d: "Tue", leads: 47, replied: 47, qualified: 22, booked: 11 },
  { d: "Wed", leads: 38, replied: 38, qualified: 17, booked: 8 }, { d: "Thu", leads: 52, replied: 51, qualified: 26, booked: 13 },
  { d: "Fri", leads: 44, replied: 44, qualified: 20, booked: 9 }, { d: "Sat", leads: 17, replied: 17, qualified: 6, booked: 2 }, { d: "Sun", leads: 12, replied: 12, qualified: 4, booked: 1 },
];
const SOURCES = [{ l: "Website form", v: 118 }, { l: "WhatsApp", v: 64 }, { l: "Missed calls", v: 41 }, { l: "LinkedIn", v: 28 }];
const TIERS = [{ l: "Hot", v: 47, c: "var(--color-coral)" }, { l: "Warm", v: 67, c: "var(--color-amber)" }, { l: "Cold", v: 82, c: "var(--color-ice)" }, { l: "Disqualified", v: 31, c: "var(--color-dim)" }, { l: "Spam", v: 24, c: "var(--color-rose)" }];
const REPS = [
  { n: "Sara Haddad", r: "UAE · KSA", hot: 19, mtg: 21, next: "Tue 15:00 · Gulfline Freight" },
  { n: "Ayesha Siddiqui", r: "Pakistan · UK", hot: 16, mtg: 18, next: "Tue 16:00 · Brightloom Textiles" },
  { n: "Daniel Brooks", r: "United States", hot: 12, mtg: 14, next: "Wed 10:30 · PeakParcel" },
];
const ALERTS = [
  { t: "2 min ago", who: "VP Operations · Gulfline Freight", why: "Demo this week + pricing", rep: "Sara" },
  { t: "18 min ago", who: "CEO · Brightloom Textiles", why: "Missed call, decision this month", rep: "Ayesha" },
  { t: "1 h ago", who: "Director of Logistics · PeakParcel", why: "Evaluating vendors this quarter", rep: "Daniel" },
];

export default function Dashboard() {
  const tot = DAYS.reduce((a, d) => ({ leads: a.leads + d.leads, replied: a.replied + d.replied, qualified: a.qualified + d.qualified, booked: a.booked + d.booked }), { leads: 0, replied: 0, qualified: 0, booked: 0 });
  const funnel = [{ l: "Leads in", v: tot.leads }, { l: "Replied", v: tot.replied }, { l: "Qualified (hot + warm)", v: tot.qualified }, { l: "Meetings booked", v: tot.booked }];
  const max = Math.max(...DAYS.map((d) => d.leads));
  const tierTotal = TIERS.reduce((a, t) => a + t.v, 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber"><strong className="font-semibold">Sample data.</strong> A simulated week that shows what a sales manager sees. It is not production traffic.</div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {[["Leads this week", tot.leads], ["Replied automatically", `${Math.round((100 * tot.replied) / tot.leads)}%`], ["Qualified", tot.qualified], ["Meetings booked", tot.booked]].map(([k, v]) => (
          <div key={String(k)} className="bg-panel p-5"><div className="font-display text-[30px] font-bold tabular-nums">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel p-6">
          <h2 className="mb-5 text-[18px] font-bold">Pipeline funnel</h2>
          <ol className="flex flex-col gap-3">
            {funnel.map((f, i) => (
              <li key={f.l}>
                <div className="mb-1 flex justify-between text-[13.5px]"><span>{f.l}</span><span className="font-mono tabular-nums text-muted">{f.v}{i > 0 ? ` · ${Math.round((100 * f.v) / funnel[0].v)}%` : ""}</span></div>
                <div className="h-8 overflow-hidden rounded-lg bg-panel-2"><motion.div initial={{ width: 0 }} animate={{ width: `${(100 * f.v) / funnel[0].v}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-lg" style={{ background: i === 3 ? "var(--color-coral)" : "var(--color-ice)", opacity: 1 - i * 0.12 }} /></div>
              </li>
            ))}
          </ol>
          <h2 className="mb-4 mt-8 text-[18px] font-bold">Leads per day</h2>
          <div className="flex h-[160px] items-end gap-3" role="img" aria-label="Bar chart of daily leads">
            {DAYS.map((d, i) => (
              <div key={d.d} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[11px] text-muted">{d.leads}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.leads / max) * 120}px` }} transition={{ delay: i * 0.05, duration: 0.6 }} className="w-full max-w-[40px] rounded-md bg-ice" />
                <span className="font-mono text-[11px] text-dim">{d.d}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-6">
          <h2 className="mb-4 text-[18px] font-bold">Lead quality</h2>
          <div className="flex h-3 overflow-hidden rounded-full">{TIERS.map((t) => <div key={t.l} style={{ width: `${(100 * t.v) / tierTotal}%`, background: t.c }} />)}</div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-[13px]">{TIERS.map((t) => <li key={t.l} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.c }} />{t.l}<span className="ml-auto font-mono text-muted">{t.v}</span></li>)}</ul>
          <h2 className="mb-3 mt-7 text-[18px] font-bold">Where leads come from</h2>
          <ul className="flex flex-col gap-2">{SOURCES.map((s) => <li key={s.l} className="flex items-center gap-3 text-[13px]"><span className="w-[110px] shrink-0">{s.l}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-fg/70" style={{ width: `${(100 * s.v) / SOURCES[0].v}%` }} /></span><span className="w-8 text-right font-mono text-muted">{s.v}</span></li>)}</ul>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <h2 className="border-b border-line px-6 py-4 text-[18px] font-bold">Hot-lead alerts</h2>
          <ul>{ALERTS.map((a) => <li key={a.who} className="flex items-start justify-between gap-4 border-b border-line px-6 py-4 last:border-b-0"><div><div className="text-[14px] font-medium">⚡ {a.who}</div><div className="text-[13px] text-muted">{a.why}</div></div><div className="text-right font-mono text-[11.5px] text-dim">{a.t}<br />→ {a.rep}</div></li>)}</ul>
        </section>
        <section className="panel overflow-hidden">
          <h2 className="border-b border-line px-6 py-4 text-[18px] font-bold">Rep load</h2>
          <div className="overflow-x-auto"><table className="w-full text-left text-[13px]"><thead className="text-muted"><tr><th className="px-6 py-2 font-medium">Rep</th><th className="font-medium">Hot</th><th className="font-medium">Meetings</th><th className="pr-6 font-medium">Next</th></tr></thead>
            <tbody>{REPS.map((r) => <tr key={r.n} className="border-t border-line"><td className="px-6 py-3"><div className="font-medium">{r.n}</div><div className="text-[12px] text-dim">{r.r}</div></td><td className="font-mono">{r.hot}</td><td className="font-mono">{r.mtg}</td><td className="pr-6 text-[12.5px] text-muted">{r.next}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
