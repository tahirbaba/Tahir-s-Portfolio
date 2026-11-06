import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";

export const metadata: Metadata = { title: "Knowledge dashboard" };
/* SIMULATED month for illustration only. */
const TOPICS = [["Leave and holidays", 412], ["Travel and expenses", 336], ["IT and security", 251], ["On-call and incidents", 140], ["Performance reviews", 96], ["Pricing and discounts", 71]] as const;
const GAPS = [["Office wifi and guest access", 38], ["Remote work from abroad", 27], ["Parking at the Dubai office", 19], ["Gym membership benefit", 14]] as const;
const DENIED = [["Salary bands", 61, "HR only"], ["Pricing and discounts", 24, "Finance and managers"], ["Month-end close", 9, "Finance only"]] as const;
export default function Dashboard() {
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-6 py-10">
        <div className="flex flex-col gap-3"><p className="eyebrow">Knowledge dashboard</p><h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">See what people ask, and what your documents are missing.</h1></div>
        <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber"><strong className="font-semibold">Sample data.</strong> A simulated month that shows what a knowledge owner sees.</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">{[["Questions this month", "1,404"], ["Answered with sources", "86%"], ["‘Not found’ (content gaps)", "9%"], ["Blocked by permissions", "94"]].map(([k, v]) => <div key={k} className="bg-panel p-5"><div className="font-display text-[28px] font-bold">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>)}</div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-6"><h2 className="mb-4 text-[18px] font-bold">Top topics</h2><ul className="flex flex-col gap-2">{TOPICS.map(([l, v]) => <li key={l} className="flex items-center gap-3 text-[13px]"><span className="w-[160px] shrink-0">{l}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-ice" style={{ width: `${(100 * v) / TOPICS[0][1]}%` }} /></span><span className="w-10 text-right font-mono text-muted">{v}</span></li>)}</ul></section>
          <section className="panel p-6"><h2 className="mb-1 text-[18px] font-bold">Content gaps</h2><p className="mb-4 text-[13px] text-muted">Questions with no answer in any document. Write these next.</p><ul className="flex flex-col gap-2">{GAPS.map(([l, v]) => <li key={l} className="flex justify-between rounded-xl border border-line px-3 py-2 text-[13.5px]"><span>{l}</span><span className="font-mono text-coral">{v} asks</span></li>)}</ul></section>
        </div>
        <section className="panel overflow-hidden"><h2 className="border-b border-line px-6 py-4 text-[18px] font-bold">Permission blocks</h2>
          <div className="overflow-x-auto"><table className="w-full text-left text-[13px]"><thead className="text-muted"><tr><th className="px-6 py-2 font-medium">Document</th><th className="font-medium">Blocked questions</th><th className="pr-6 font-medium">Who can read it</th></tr></thead><tbody>{DENIED.map(([d, n, w]) => <tr key={d} className="border-t border-line"><td className="px-6 py-3">{d}</td><td className="font-mono">{n}</td><td className="pr-6 text-muted">{w}</td></tr>)}</tbody></table></div>
        </section>
      </div></main>
      <Footer />
    </>
  );
}
