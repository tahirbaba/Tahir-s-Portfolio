import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import retrieval from "@/evals/results/retrieval.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Case study" };
const DECISIONS = [
  { q: "Why filter permissions before ranking?", a: "If restricted text reaches the model, a clever prompt can get it out. Removing it before search means there is nothing to leak; the user only learns that something was hidden." },
  { q: "Why check citations in code?", a: "Models can cite sources they didn't read. Every id in the answer must match a section that was retrieved for this user, or the answer becomes ‘not found’." },
  { q: "Why keep lexical search?", a: "It is transparent, cheap and easy to audit for a first deployment. The evals show where it struggles, and the answer step covers it. Embeddings are the next step when the corpus grows." },
  { q: "What did we try and undo?", a: "A term-coverage gate removed two loose matches on unanswerable questions but cut recall@3 from 100% to 84.6%. It was reverted and the citation guard handles those cases instead." },
  { q: "Why ask the model to search in English?", a: "The documents are in English. Translating the query and answering in the user's language serves Urdu, Roman Urdu and Arabic speakers without duplicating content." },
];
export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter"><article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
        <header className="flex flex-col gap-4"><p className="eyebrow">Case study</p>
          <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">An internal assistant people can trust, and security can sign off.</h1>
          <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">A knowledge assistant for a logistics company with offices in Dubai, Karachi and London. The company and documents are fictional; the requirements are what IT and HR ask for before any rollout.</p>
          <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">{[["Role", "Design, build, evals"], ["Backend", "Python · FastAPI · BM25"], ["Answers", "Claude · cited"], ["Permission leaks", String(retrieval.metrics.accessLeaks)]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>)}</dl>
        </header>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">The flow</h2>
          <div className="dark-zone rounded-3xl border border-line bg-ink p-6"><ol className="flex flex-wrap items-center gap-2 font-mono text-[12.5px]">{["question + role", "Claude → search_docs (English)", "drop sections the role can't read", "drop superseded policies", "rank (BM25)", "Claude answers with [ids]", "verify every citation", "answer or ‘not found’"].map((s, i, a) => <li key={s} className="flex items-center gap-2"><span className={`rounded-lg border px-3 py-1.5 ${i === 1 || i === 5 ? "border-ice/50 text-ice" : i === 6 ? "border-coral/50 text-coral" : "border-line-2"}`}>{s}</span>{i < a.length - 1 && <span className="text-dim">→</span>}</li>)}</ol></div>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Key decisions</h2><div className="grid gap-4 md:grid-cols-2">{DECISIONS.map((d) => <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>)}</div></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">Results</h2><div className="grid gap-4 md:grid-cols-3">{[["Recall@3", `${retrieval.metrics.recallAt3}%`], ["Permission leaks", String(retrieval.metrics.accessLeaks)], ["Unit tests", `${rules.passed}/${rules.total}`]].map(([k, v]) => <div key={k} className="panel p-6"><p className="font-display text-[40px] font-extrabold">{v}</p><p className="text-[14px] text-muted">{k}</p></div>)}</div><Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">See every question →</Link></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
          <ol>{[["Week 0", "Inventory", "Collect the handbooks, policies and runbooks people actually use; map owners and who may read what."], ["Week 1", "Build the index", "Chunk by section, attach access lists from the existing identity system, mark superseded versions."], ["Week 2", "Pilot", "One department, with a feedback button on every answer and weekly review of ‘not found’ questions."], ["Weeks 3–4", "Widen", "Add departments and languages; publish the retrieval evals to IT and HR."], ["Week 6", "Hand over", "Content-gap dashboard and an owner for each document."]].map(([w, t, b]) => <li key={w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_180px_1fr] sm:gap-6"><span className="font-mono text-[12.5px] text-ice">{w}</span><span className="text-[16px] font-bold">{t}</span><span className="text-[14.5px] leading-relaxed text-muted">{b}</span></li>)}</ol>
        </section>
        <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8"><h2 className="text-[28px] font-extrabold">See it for yourself</h2><div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch the demo</Link><a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/knowledge-assistant" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a></div></section>
      </article></main>
      <Footer />
    </>
  );
}
