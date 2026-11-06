import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import integrity from "@/evals/results/integrity.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Fairness and integrity tests" };
export default function Evals() {
  const cats = Array.from(new Set(integrity.results.map((r) => r.category)));
  return (
    <>
      <Nav active="/evals" />
      <main className="gutter"><div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
        <section><p className="eyebrow">Evaluation</p><h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-extrabold">Fairness and integrity, tested.</h1>
          <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">{integrity.total} checks run against the real screening code with no model: recommendations, consistency checks, evidence grounding and counterfactual fairness, where the same CV is screened under different names, genders, ages and marital statuses. Reproduce with <code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/integrity_suite.py</code>.</p></section>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">{cats.map((c) => { const rs = integrity.results.filter((r) => r.category === c); return <div key={c} className="bg-panel p-5"><div className="font-display text-[28px] font-bold">{rs.filter((r) => r.pass).length}/{rs.length}</div><div className="text-[12.5px] text-muted">{c}</div></div>; })}</div>
        {cats.map((c) => (
          <section key={c} className="panel p-6"><p className="eyebrow">{c}</p>
            <ul className="mt-3 flex flex-col gap-1.5">{integrity.results.filter((r) => r.category === c).map((r) => <li key={r.id} className="flex gap-3 text-[13.5px]"><span className={r.pass ? "text-ok" : "text-coral"}>{r.pass ? "✓" : "✗"}</span><span className="w-[110px] shrink-0 font-mono text-[12px] text-dim">{r.id}</span><span className="text-muted">{r.detail}</span></li>)}</ul>
          </section>
        ))}
        <section className="panel p-6"><p className="eyebrow">Claude reading eval</p><h2 className="mt-1 text-[22px] font-bold">Awaiting first run</h2><p className="mt-2 text-[14.5px] text-muted">With an API key, the replay recorder (<code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/replays.py --live</code>) runs Claude on every CV; extraction quality is visible in each replay. No numbers are shown until measured.</p></section>
        <section className="panel p-6"><p className="eyebrow">Unit tests · pytest</p><h2 className="mt-1 text-[22px] font-bold">{rules.passed} / {rules.total} passing</h2><ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{rules.tests.map((t) => <li key={t.name} className="flex gap-2 text-[13px]"><span className={t.pass ? "text-ok" : "text-coral"}>{t.pass ? "✓" : "✗"}</span><span className="text-muted">{t.name}</span></li>)}</ul></section>
      </div></main>
      <Footer />
    </>
  );
}
