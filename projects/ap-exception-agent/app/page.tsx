import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import HeroDemo from "@/components/demo/HeroDemo";
import type { Replay } from "@/components/demo/types";
import replays from "@/data/replays.json";
import controls from "@/evals/results/controls.json";
import rules from "@/evals/results/rules.json";

const PROBLEMS = [
  { t: "Invoices keyed in by hand", b: "PDFs and emails in three languages, retyped into the ERP line by line, with mistakes that surface at month-end." },
  { t: "Exceptions eat the week", b: "Price creep, short deliveries and wrong VAT are found late, and nobody writes down why an invoice is stuck." },
  { t: "Fraud hides in a bank change", b: "One ‘please note our new account’ line can send a large payment to a criminal." },
];
const CONTROLS = [
  ["3-way match", "Invoice vs purchase order vs goods receipt, line by line, with a 2% price tolerance."], ["Duplicates", "Same invoice number, or same vendor and amount within 7 days."],
  ["Bank details", "Any IBAN that differs from the vendor master puts payment on hold."], ["Tax", "VAT and GST checked at 5% UAE, 15% KSA, 18% Pakistan, 20% UK."],
  ["Arithmetic", "Lines, subtotal, tax and total must add up exactly."], ["Approval limits", "Clean invoices above the limit wait for the controller."],
];

export default function Home() {
  const r = replays as Replay[];
  return (
    <>
      <Nav />
      <main>
        <section className="gutter relative overflow-hidden">
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,#000_10%,transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div className="flex flex-col gap-6">
              <p className="eyebrow">Accounts payable agent · Python + Claude</p>
              <h1 className="text-[clamp(38px,4.8vw,64px)] font-extrabold leading-[1.02]">Post the clean invoices. <span className="text-ice">Explain the rest.</span></h1>
              <p className="max-w-[56ch] text-[18px] leading-relaxed text-muted">Ledger reads supplier invoices in English, Arabic and Urdu, matches them to purchase orders and goods receipts, and catches duplicates, wrong tax and bank-detail fraud. Clean invoices post themselves; every exception comes with the numbers and a draft to the vendor.</p>
              <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch it work →</Link><Link href="/evals" className="btn btn-ghost">See the control results</Link></div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 font-mono text-[12.5px] text-muted"><li><span className="text-ok">●</span> {controls.passed}/{controls.total} control cases correct</li><li><span className="text-ok">●</span> {rules.passed}/{rules.total} unit tests</li><li><span className="text-coral">●</span> FastAPI + Next.js</li></ul>
            </div>
            <div className="pb-6"><HeroDemo replays={r} /></div>
          </div>
        </section>
        <section className="gutter border-y border-line bg-panel"><div className="mx-auto grid max-w-[1240px] md:grid-cols-3">{PROBLEMS.map((p) => <div key={p.t} className="flex flex-col gap-2 px-2 py-8 md:px-8"><h2 className="text-[20px] font-bold">{p.t}</h2><p className="text-[15px] leading-relaxed text-muted">{p.b}</p></div>)}</div></section>
        <section className="gutter"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">Controls that run on every invoice</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">The AI reads. The rules decide.</h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{CONTROLS.map(([t, b]) => <li key={t} className="panel flex flex-col gap-2 p-6"><h3 className="text-[19px] font-bold">{t}</h3><p className="text-[14.5px] leading-relaxed text-muted">{b}</p></li>)}</ol>
        </div></section>
        <section className="gutter dark-zone bg-ink"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">Five outcomes, never a guess</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Every invoice ends somewhere clear.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {[["Posted", "Matched, correct, under the limit."], ["Approval", "Clean but above the auto-post limit."], ["Exception", "Match, tax or arithmetic problem, explained."], ["Rejected", "Already paid: a duplicate."], ["Payment hold", "Bank details changed: verify by phone."]].map(([t, b]) => <div key={t} className="bg-ink p-6"><h3 className="text-[18px] font-bold">{t}</h3><p className="mt-1 text-[14px] text-muted">{b}</p></div>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn btn-ghost">See the AP dashboard</Link><Link href="/case-study" className="btn btn-ghost">How it was built</Link></div>
        </div></section>
        <section className="gutter border-t border-line bg-panel"><div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 py-20">
          <h2 className="max-w-[20ch] text-[clamp(32px,5vw,60px)] font-extrabold leading-[1]">Want your AP team doing analysis, not data entry?</h2>
          <p className="max-w-[60ch] text-[16px] leading-relaxed text-muted">Ledger is a portfolio project by Muhammad Tahir Hasni, a Forward Deployed Engineer who builds and deploys AI agents for finance, sales, support and operations teams.</p>
          <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Try the demo</Link><Link href="/case-study" className="btn btn-ghost">Read the case study</Link></div>
        </div></section>
      </main>
      <Footer />
    </>
  );
}
