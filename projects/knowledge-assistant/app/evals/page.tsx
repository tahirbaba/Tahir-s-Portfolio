import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import retrieval from "@/evals/results/retrieval.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Retrieval results" };
export default function Evals() {
  const m = retrieval.metrics;
  const cats = Array.from(new Set(retrieval.results.map((r) => r.category)));
  return (
    <>
      <Nav active="/evals" />
      <main className="gutter"><div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
        <section><p className="eyebrow">Evaluation</p><h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-extrabold">Retrieval, permissions and freshness, measured.</h1>
          <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">{retrieval.total} questions run against the real search with no model: does the right section come back, does restricted content stay hidden, are outdated policies skipped, and does it stay quiet when the answer isn't there. Reproduce with <code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/retrieval_suite.py</code>.</p></section>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">{[["Recall@1", `${m.recallAt1}%`], ["Recall@3", `${m.recallAt3}%`], ["MRR", m.mrr], ["Permission leaks", m.accessLeaks], ["Outdated policies served", m.staleServed], ["Unanswerable questions with a hit", m.falseAnswers]].map(([k, v]) => <div key={String(k)} className="bg-panel p-5"><div className="font-display text-[28px] font-bold">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>)}</div>
        <div className="rounded-2xl border border-amber/30 bg-amber/5 p-5 text-[14px] leading-relaxed"><p className="eyebrow mb-1 !text-amber">Known limitation, handled downstream</p>{retrieval.notes.map((n) => <p key={n}>{n}</p>)}</div>
        {cats.map((c) => (
          <section key={c} className="panel overflow-hidden"><p className="eyebrow px-6 pt-5">{c}</p>
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[13px]"><tbody>{retrieval.results.filter((r) => r.category === c).map((r) => <tr key={r.id} className="border-t border-line align-top"><td className="w-[90px] px-6 py-2 font-mono"><span className={r.pass ? "text-ok" : "text-coral"}>{r.pass ? "✓" : "✗"}</span> {r.id.split("-")[0]}</td><td className="py-2">{r.question}</td><td className="py-2 font-mono text-[11.5px] text-muted">{r.role}</td><td className="py-2 pr-6 font-mono text-[11.5px] text-muted">{Array.isArray(r.got) ? r.got.join(", ") || "none" : String(r.got)}</td></tr>)}</tbody></table></div>
          </section>
        ))}
        <section className="panel p-6"><p className="eyebrow">Answer eval · Claude</p><h2 className="mt-1 text-[22px] font-bold">Awaiting first run</h2><p className="mt-2 text-[14.5px] text-muted">With an API key, recorded replays show real answers and the citation guard on every run. No numbers are shown until measured.</p></section>
        <section className="panel p-6"><p className="eyebrow">Unit tests · pytest</p><h2 className="mt-1 text-[22px] font-bold">{rules.passed} / {rules.total} passing</h2><ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{rules.tests.map((t) => <li key={t.name} className="flex gap-2 text-[13px]"><span className={t.pass ? "text-ok" : "text-coral"}>{t.pass ? "✓" : "✗"}</span><span className="text-muted">{t.name}</span></li>)}</ul></section>
      </div></main>
      <Footer />
    </>
  );
}
