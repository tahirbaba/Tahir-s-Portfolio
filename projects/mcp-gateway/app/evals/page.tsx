import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import sec from "@/evals/results/security.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Security results" };
const STYLE: Record<string, string> = { allowed: "text-ok", blocked: "text-coral", pending_approval: "text-amber" };

export default function Evals() {
  const cats = Array.from(new Set(sec.results.map((r) => r.category)));
  return (
    <>
      <Nav active="/evals" />
      <main className="gutter"><div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
        <section><p className="eyebrow">Security results</p><h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-extrabold">Every attack, every result, measured.</h1>
          <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">The security suite sends {sec.total} calls straight at the real gateway code: {sec.attacks} attacks and {sec.legit} pieces of legitimate work that must not be blocked. No model is involved, so these numbers are exact and reproducible with <code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/security_suite.py</code>.</p></section>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[["Attacks stopped", `${sec.attacksStopped}/${sec.attacks}`], ["Legitimate calls allowed", `${sec.legitAllowed}/${sec.legit}`], ["Unit tests", `${rules.passed}/${rules.total}`], ["Median check time", `${sec.medianMs} ms`]].map(([k, v]) => (
            <div key={k} className="bg-panel p-5"><div className="font-display text-[30px] font-bold tabular-nums">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>
          ))}
        </div>
        {sec.fixedDuringBuild.length > 0 && <div className="rounded-2xl border border-ice/30 bg-teal-soft/40 p-5 text-[14px] leading-relaxed"><p className="eyebrow mb-1">Found and fixed while building</p>{sec.fixedDuringBuild.map((f) => <p key={f}>{f}</p>)}</div>}
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead className="bg-panel-2 text-muted"><tr><th className="px-4 py-2.5 font-medium">Case</th><th className="font-medium">Category</th><th className="font-medium">Tool</th><th className="font-medium">Expected</th><th className="font-medium">Got</th><th className="pr-4 font-medium">Reason</th></tr></thead>
              <tbody>
                {cats.flatMap((c) => sec.results.filter((r) => r.category === c)).map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <td className="px-4 py-2 font-mono"><span className={r.pass ? "text-ok" : "text-coral"}>{r.pass ? "✓" : "✗"}</span> {r.id}</td>
                    <td className="py-2 text-muted">{r.category}</td><td className="py-2 font-mono text-[12px]">{r.tool}</td>
                    <td className={`py-2 font-mono text-[12px] ${STYLE[r.expected] ?? ""}`}>{r.expected.replace("_", " ")}</td><td className={`py-2 font-mono text-[12px] ${STYLE[r.got] ?? ""}`}>{r.got.replace("_", " ")}</td>
                    <td className="py-2 pr-4 text-muted">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel p-6"><p className="eyebrow">Unit tests · pytest</p><h2 className="mt-1 text-[22px] font-bold">{rules.passed} / {rules.total} passing</h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{rules.tests.map((t) => <li key={t.name} className="flex gap-2 text-[13px]"><span className={t.pass ? "text-ok" : "text-coral"}>{t.pass ? "✓" : "✗"}</span><span className="text-muted">{t.name}</span></li>)}</ul>
        </section>
      </div></main>
      <Footer />
    </>
  );
}
