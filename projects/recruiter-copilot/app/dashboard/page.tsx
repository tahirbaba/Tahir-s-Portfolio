import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import bias from "@/evals/results/bias.json";
import integrity from "@/evals/results/integrity.json";

export const metadata: Metadata = { title: "Hiring dashboard" };
/* SIMULATED role for illustration only. */
const FUNNEL = [["Applications", 412], ["Meet must-haves", 118], ["No serious flags", 87], ["Interviewed", 24], ["Offers", 2]] as const;
const FLAGS = [["Years don't add up", 31], ["Title differs from profile", 22], ["Role not on public profile", 18], ["Overlapping full-time roles", 9], ["Degree year mismatch", 7], ["Certificate ID format", 5]] as const;
const QUEUE = [["Candidate #A-118", "Interview + verify", "Confirm title with reference"], ["Candidate #A-204", "Verify first", "Timeline: 9 claimed vs 6 by dates"], ["Candidate #A-311", "Advance", "No flags"], ["Candidate #A-327", "Interview + verify", "Check certificate on issuer site"]] as const;
export default function Dashboard() {
  const fair = integrity.results.filter((r) => r.category === "Fairness");
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-6 py-10">
        <div className="flex flex-col gap-3"><p className="eyebrow">Hiring dashboard</p><h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">From 412 applications to a shortlist you can defend.</h1></div>
        <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber"><strong className="font-semibold">Sample data</strong> for one simulated role. The fairness panel shows real results from the test suite.</div>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="panel p-6"><h2 className="mb-5 text-[18px] font-bold">Pipeline</h2>
            <ol className="flex flex-col gap-3">{FUNNEL.map(([l, v], i) => <li key={l}><div className="mb-1 flex justify-between text-[13.5px]"><span>{l}</span><span className="font-mono text-muted">{v}</span></div><div className="h-7 overflow-hidden rounded-lg bg-panel-2"><div className="h-full rounded-lg" style={{ width: `${Math.max(2, (100 * v) / FUNNEL[0][1])}%`, background: i === FUNNEL.length - 1 ? "var(--color-coral)" : "var(--color-ice)", opacity: 1 - i * 0.12 }} /></div></li>)}</ol>
          </section>
          <section className="dark-zone rounded-[20px] border border-line bg-ink p-6"><p className="eyebrow">Fairness monitor · real test results</p>
            <p className="mt-3 font-display text-[44px] font-extrabold text-ok">{fair.filter((r) => r.pass).length}/{fair.length}</p>
            <p className="text-[14px] text-muted">counterfactual checks pass: changing name, gender, age or marital status never changes what the AI sees or the score.</p>
          </section>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-6"><h2 className="mb-4 text-[18px] font-bold">Most common flags</h2><ul className="flex flex-col gap-2">{FLAGS.map(([l, v]) => <li key={l} className="flex items-center gap-3 text-[13px]"><span className="w-[190px] shrink-0">{l}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-coral" style={{ width: `${(100 * v) / FLAGS[0][1]}%` }} /></span><span className="w-8 text-right font-mono text-muted">{v}</span></li>)}</ul></section>
          <section className="panel overflow-hidden"><h2 className="border-b border-line px-6 py-4 text-[18px] font-bold">Recruiter queue</h2><ul>{QUEUE.map(([c, r, n]) => <li key={c} className="flex items-center justify-between gap-3 border-b border-line px-6 py-3 last:border-b-0"><div><div className="font-mono text-[12px] text-muted">{c}</div><div className="text-[13.5px]">{n}</div></div><span className="rounded-full border border-line-2 px-2.5 py-0.5 text-[12px]">{r}</span></li>)}</ul></section>
        </div>
        <section className="panel p-6"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-[18px] font-bold">Bias audit · selection rate by group</h2><span className="font-mono text-[11px] text-ok">real results · {bias.cohort.toLocaleString()} counterfactual screenings</span></div>
          <p className="mt-1 max-w-[80ch] text-[13px] text-muted">{bias.method} Group labels are kept apart from screening and used only here. In a deployment this runs monthly on real outcomes.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">{bias.audits.map((a) => <div key={a.key} className="rounded-xl border border-line p-4"><p className="mb-2 font-mono text-[10.5px] uppercase tracking-wider text-dim">{a.key}</p>
            <ul className="flex flex-col gap-1.5">{a.rows.map((r) => <li key={r.group} className="flex items-center justify-between text-[13px]"><span>{r.group}</span><span className="font-mono"><span className="text-muted">{Math.round(r.rate * 100)}% · </span><span className={r.flag ? "text-coral" : "text-ok"}>{r.impact_ratio.toFixed(2)}</span></span></li>)}</ul>
            <p className={`mt-2 text-[12px] ${a.ok ? "text-ok" : "text-coral"}`}>{a.ok ? "No group below 0.80" : "Flagged for review"}</p></div>)}</div>
        </section>
      </div></main>
      <Footer />
    </>
  );
}
