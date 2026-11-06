import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import Queue from "@/components/demo/Queue";

export const metadata: Metadata = { title: "AP dashboard" };
/* SIMULATED month for illustration only. */
const OUTCOMES = [["Posted automatically", 812, "var(--color-ok)"], ["Controller approval", 64, "var(--color-amber)"], ["Exceptions", 118, "var(--color-coral)"], ["Duplicates rejected", 19, "var(--color-dim)"], ["Payment holds", 6, "var(--color-rose)"]] as const;
const TYPES = [["Price above PO", 41], ["Not yet received", 33], ["Wrong VAT/GST", 22], ["Arithmetic", 12], ["Unknown PO", 10]] as const;
const VENDORS = [["Gulf Packaging LLC", 214, "96%"], ["Riyadh Office Supplies", 188, "88%"], ["Indus Logistics", 172, "91%"], ["Northline IT Services", 61, "79%"]] as const;

export default function Dashboard() {
  const total = OUTCOMES.reduce((a, o) => a + o[1], 0);
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-6 py-10">
        <div className="flex flex-col gap-3"><p className="eyebrow">AP dashboard</p><h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">Month-end without the month-end panic.</h1></div>
        <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber"><strong className="font-semibold">Sample data.</strong> A simulated month that shows what an AP manager sees. The exception queue below is interactive.</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[["Invoices processed", total.toLocaleString()], ["Posted without a person", `${Math.round((100 * OUTCOMES[0][1]) / total)}%`], ["Exceptions explained", OUTCOMES[2][1]], ["Held for bank checks", `${OUTCOMES[4][1]} · 2.1M PKR`]].map(([k, v]) => <div key={k} className="bg-panel p-5"><div className="font-display text-[28px] font-bold tabular-nums">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-6"><h2 className="mb-4 text-[18px] font-bold">Where invoices ended up</h2>
            <div className="flex h-4 overflow-hidden rounded-full">{OUTCOMES.map(([l, v, c]) => <div key={l} style={{ width: `${(100 * v) / total}%`, background: c }} />)}</div>
            <ul className="mt-4 flex flex-col gap-2">{OUTCOMES.map(([l, v, c]) => <li key={l} className="flex items-center gap-2 text-[13.5px]"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}<span className="ml-auto font-mono text-muted">{v} · {((100 * v) / total).toFixed(1)}%</span></li>)}</ul>
          </section>
          <section className="panel p-6"><h2 className="mb-4 text-[18px] font-bold">Exception types</h2>
            <ul className="flex flex-col gap-2.5">{TYPES.map(([l, v]) => <li key={l} className="flex items-center gap-3 text-[13px]"><span className="w-[140px] shrink-0">{l}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-coral" style={{ width: `${(100 * v) / TYPES[0][1]}%` }} /></span><span className="w-8 text-right font-mono text-muted">{v}</span></li>)}</ul>
            <h2 className="mb-3 mt-7 text-[18px] font-bold">Vendors · first-time match rate</h2>
            <ul className="flex flex-col gap-1.5 text-[13px]">{VENDORS.map(([n, c, r]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="font-mono text-muted">{c} invoices · {r}</span></li>)}</ul>
          </section>
        </div>
        <Queue />
      </div></main>
      <Footer />
    </>
  );
}
