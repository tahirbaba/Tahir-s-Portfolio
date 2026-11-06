import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import controls from "@/evals/results/controls.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Case study" };
const DECISIONS = [
  { q: "Why let the model read but not decide?", a: "Reading messy, bilingual invoices is where language models shine. Deciding whether to pay is where finance needs certainty. Claude extracts the fields; Python runs the controls and makes the call." },
  { q: "Why extract exactly what is printed?", a: "If the model silently ‘fixes’ a wrong VAT figure, the control never fires. The prompt and the tool contract both say: copy the document, mistakes included." },
  { q: "Why does fraud beat everything?", a: "A changed bank account on a duplicate invoice is still a fraud signal first. The decision order is bank change, duplicate, arithmetic, match, tax, limit." },
  { q: "Why no vendor message on a bank change?", a: "Replying to a possibly compromised mailbox warns the fraudster. The clerk is told to call the number in the vendor master instead." },
  { q: "What did the tests catch?", a: "The duplicate check missed a re-sent invoice because the posted amount in the ERP data didn't match the document. The controls suite surfaced it before launch." },
];
export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter"><article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
        <header className="flex flex-col gap-4"><p className="eyebrow">Case study</p>
          <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">Taking invoice data entry off a finance team's plate, without losing control.</h1>
          <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">An accounts-payable agent for a distributor buying from suppliers in the UAE, Saudi Arabia, Pakistan and the UK. The company and invoices are fictional; the controls are the ones auditors expect.</p>
          <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">{[["Role", "Design, build, controls"], ["Backend", "Python · FastAPI"], ["Reading", "Claude · structured tools"], ["Controls", `${controls.passed}/${controls.total} correct`]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>)}</dl>
        </header>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">The flow</h2>
          <div className="dark-zone rounded-3xl border border-line bg-ink p-6"><ol className="flex flex-wrap items-center gap-2 font-mono text-[12.5px]">{["invoice (PDF / email)", "Claude reads → submit_extraction", "arithmetic", "bank details", "duplicates", "3-way match", "tax", "limit", "post · approve · exception · reject · hold"].map((s, i, a) => <li key={s} className="flex items-center gap-2"><span className={`rounded-lg border px-3 py-1.5 ${i === 1 ? "border-ice/50 text-ice" : i === a.length - 1 ? "border-coral/50 text-coral" : "border-line-2"}`}>{s}</span>{i < a.length - 1 && <span className="text-dim">→</span>}</li>)}</ol></div>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Key decisions</h2><div className="grid gap-4 md:grid-cols-2">{DECISIONS.map((d) => <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>)}</div></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">Results</h2>
          <div className="grid gap-4 md:grid-cols-3">{[["Control cases correct", `${controls.passed}/${controls.total}`], ["Unit tests", `${rules.passed}/${rules.total}`], ["Reading eval", "after first run"]].map(([k, v]) => <div key={k} className="panel p-6"><p className="font-display text-[36px] font-extrabold">{v}</p><p className="text-[14px] text-muted">{k}</p></div>)}</div>
          <Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">See every case →</Link>
        </section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
          <ol>{[["Week 0", "Embed", "Sit with AP, pull three months of invoices and exceptions, agree tolerances and approval limits with the controller."], ["Week 1", "Shadow", "Ledger reads and decides; clerks still key. Compare every field and decision."], ["Week 2", "Exceptions first", "Route exceptions with explanations while posting stays manual."], ["Weeks 3–4", "Auto-post", "Turn on posting for vendors with high match rates; keep holds and approvals human."], ["Week 6", "Hand over", "Dashboard, audit trail and a runbook owned by finance."]].map(([w, t, b]) => <li key={w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_180px_1fr] sm:gap-6"><span className="font-mono text-[12.5px] text-ice">{w}</span><span className="text-[16px] font-bold">{t}</span><span className="text-[14.5px] leading-relaxed text-muted">{b}</span></li>)}</ol>
        </section>
        <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8"><h2 className="text-[28px] font-extrabold">See it for yourself</h2><div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch the demo</Link><a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/ap-exception-agent" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a></div></section>
      </article></main>
      <Footer />
    </>
  );
}
