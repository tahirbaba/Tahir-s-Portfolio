import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import rules from "@/evals/results/rules.json";
import dataset from "@/evals/dataset.json";

export const metadata: Metadata = { title: "Case study" };
const Box = ({ t, items, tone = "border-line" }: { t: string; items: string[]; tone?: string }) => (
  <div className={`rounded-2xl border bg-panel p-4 ${tone}`}><div className="text-[14px] font-bold">{t}</div><ul className="mt-2 flex flex-col gap-1">{items.map((i) => <li key={i} className="font-mono text-[11.5px] text-muted">{i}</li>)}</ul></div>
);
const DECISIONS = [
  { q: "Why score in code, not with the model?", a: "Sales leaders need to know why a lead is hot. A transparent points model (industry, size, region, seniority, intent) is auditable and stable; the model explains and writes, it doesn't decide the tier." },
  { q: "Why Python for the backend?", a: "Most data and RevOps teams run Python. FastAPI gives typed request validation, and zoneinfo handles daylight-saving and time-zone maths correctly." },
  { q: "Why validate every booking?", a: "The model may propose a time the lead suggested. Before confirming, the code checks working hours, weekends, conflicts, the one-hour buffer and midnight wrap-around. The test suite caught a real midnight bug while building." },
  { q: "Why never reply to spam?", a: "Replying confirms the address is live and wastes rep attention. Spam is classified in code and the agent is told not to answer." },
];
const ROLLOUT = [
  { w: "Week 0", t: "Embed", b: "Pull 90 days of inbound leads, agree the ICP weights with sales leadership and measure today's response time." },
  { w: "Week 1", t: "Shadow", b: "Leadline scores and drafts; reps send. Compare its tiers with the reps' own calls." },
  { w: "Week 2", t: "Go live on forms", b: "Automatic first replies for website leads; meetings booked into real calendars." },
  { w: "Weeks 3–4", t: "WhatsApp and missed calls", b: "Add channels, tune intent terms per language, review every disqualified lead weekly." },
  { w: "Week 6", t: "Hand over", b: "Dashboard, alert rules and a playbook owned by RevOps." },
];

export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter"><article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
        <header className="flex flex-col gap-4">
          <p className="eyebrow">Case study</p>
          <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">Turning inbound leads into booked meetings, in seconds.</h1>
          <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">A speed-to-lead agent for a B2B software company selling into the Gulf, Pakistan, the UK and the US. The company, reps and leads are fictional; the problems are the ones every sales team has.</p>
          <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[["Role", "Design, build, evals"], ["Backend", "Python · FastAPI"], ["Frontend", "Next.js · TypeScript"], ["Tests", `${rules.passed}/${rules.total} passing`]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>)}
          </dl>
        </header>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">The problem</h2><p className="max-w-[68ch] text-[16px] leading-relaxed text-muted">Inbound leads arrive at all hours on three channels. The first company to reply usually gets the meeting, but reps are in calls, asleep in another time zone, or busy with leads that were never going to buy.</p></section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Architecture</h2>
          <div className="dark-zone rounded-3xl border border-line bg-ink p-5 sm:p-8" role="img" aria-label="Architecture: channels to a Next.js front end, a FastAPI backend running the Claude agent loop, and Python rules for scoring, routing and scheduling, writing to CRM, calendar and alerts.">
            <div className="grid gap-3 lg:grid-cols-4">
              <Box t="Channels" items={["Website form", "WhatsApp", "Missed calls", "EN · AR · UR · Roman UR"]} />
              <Box t="Next.js front end" items={["Demo + live lab", "Sales dashboard", "Evals page"]} />
              <Box t="FastAPI · Claude loop" items={["Pydantic validation", "Signed session state", "Tool use · prompt caching", "Refusal fallback"]} tone="border-ice/50" />
              <Box t="Python rules" items={["ICP scoring with reasons", "Region routing", "zoneinfo scheduler", "Spam + competitor filter"]} tone="border-coral/50" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><Box t="CRM" items={["Tier, score, owner", "Summary + next step"]} /><Box t="Calendar" items={["Rep hours + busy blocks", "No double booking"]} /><Box t="Alerts" items={["Hot leads only", "One alert per lead"]} /></div>
          </div>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Key decisions</h2><div className="grid gap-4 md:grid-cols-2">{DECISIONS.map((d) => <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>)}</div></section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">How it's measured</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-6"><p className="eyebrow">pytest</p><p className="mt-2 font-display text-[44px] font-extrabold">{rules.passed}/{rules.total}</p><p className="text-[14px] text-muted">Scoring, routing, time zones, booking rules, signed state and the agent loop.</p></div>
            <div className="panel p-6"><p className="eyebrow">Agent eval suite</p><p className="mt-2 font-display text-[44px] font-extrabold">{dataset.length} leads</p><p className="text-[14px] text-muted">Four languages, hot to spam, plus valid and invalid booking follow-ups. Results publish after the first run with an API key.</p></div>
          </div>
          <Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">Open the eval dashboard →</Link>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
          <ol>{ROLLOUT.map((r) => <li key={r.w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_200px_1fr] sm:gap-6"><span className="font-mono text-[12.5px] text-ice">{r.w}</span><span className="text-[16px] font-bold">{r.t}</span><span className="text-[14.5px] leading-relaxed text-muted">{r.b}</span></li>)}</ol>
        </section>
        <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8"><h2 className="text-[28px] font-extrabold">See it for yourself</h2><div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch the demo</Link><a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/speed-to-lead" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a></div></section>
      </article></main>
      <Footer />
    </>
  );
}
