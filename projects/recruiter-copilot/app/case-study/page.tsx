import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import integrity from "@/evals/results/integrity.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Case study" };
const DECISIONS = [
  { q: "Why redact before the model reads anything?", a: "If the model never sees a name, gender or age, it can't be influenced by them. The fairness suite proves the redacted text is byte-for-byte identical across name and gender swaps." },
  { q: "Why demand verbatim quotes?", a: "Language models can describe skills a CV never mentions. Requiring an exact quote, checked in code, means every point on the rubric can be traced back to the candidate's own words." },
  { q: "Why compute years from dates?", a: "‘8 years’ on a form is a claim; the dates on a CV are evidence. Overlapping roles are merged so moonlighting isn't double-counted." },
  { q: "Why no AI-writing detector?", a: "They are unreliable and penalise strong writers and non-native speakers. Checkable facts are a better signal than guessing who wrote the words." },
  { q: "Why never auto-reject?", a: "Hiring decisions carry legal and human weight. Verity explains and recommends; the recruiter decides, and the output says so." },
];
const PRIVACY = [
  ["Data minimisation", "Name, email, phone, city, LinkedIn/GitHub links, gender, age and marital status are masked the moment a CV arrives, before the model sees anything."],
  ["Re-identification risk", "Employer and university names must stay so recruiters can verify them. Verity lists them as a re-identification risk and never scores them."],
  ["Audit log", "Every screening records when it ran, the rules version, the model used and exactly what was hidden. Tested in the integrity suite."],
  ["Retention", "The demo stores nothing: CVs are processed in memory and discarded. In a deployment, retention is a client setting (for example, delete after 30 days), agreed with the DPO."],
  ["Human in the loop", "There is no reject button. Every outcome is a recommendation that waits for a recruiter, who can always override it."],
  ["Collect less, not just hide", "Date of birth, nationality, religion, photos and hobby sections are dropped from the text entirely, because they are never needed to judge skills."],
  ["Applicant notice", "Before screening, the applicant is told that AI is used, what is hidden, what is analysed and whether data is reused. The API refuses to screen without it."],
  ["Third-party AI", "CVs go to Anthropic's API over TLS. Anthropic doesn't train on API data by default, and Zero Data Retention is available for enterprise deployments. Verity itself keeps nothing at rest."],
  ["Periodic bias audit", "The dashboard shows selection rate and impact ratio by gender, age and marital status (four-fifths rule). Today it runs on 1,008 counterfactual screenings; in a deployment, monthly on real outcomes."],
  ["Structural bias", "Career gaps are noted but never scored, and the checklist tells recruiters not to ask why: family and health reasons are private."],
];
export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter"><article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
        <header className="flex flex-col gap-4"><p className="eyebrow">Case study</p>
          <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">Helping recruiters screen faster without screening unfairly.</h1>
          <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">A screening copilot for a healthcare company hiring a Senior Data Engineer. The company and candidates are fictional; the problems are what recruiters face in 2026.</p>
          <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">{[["Role", "Design, build, fairness tests"], ["Backend", "Python · FastAPI"], ["Reading", "Claude · strict tools"], ["Integrity suite", `${integrity.passed}/${integrity.total}`]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>)}</dl>
        </header>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">The flow</h2>
          <div className="dark-zone rounded-3xl border border-line bg-ink p-6"><ol className="flex flex-wrap items-center gap-2 font-mono text-[12.5px]">{["CV + form + public profile", "redact protected attributes", "Claude → submit_profile (verbatim quotes)", "verify quotes", "compute years", "consistency checks", "recommendation + checklist", "recruiter decides"].map((s, i, a) => <li key={s} className="flex items-center gap-2"><span className={`rounded-lg border px-3 py-1.5 ${i === 2 ? "border-ice/50 text-ice" : i === a.length - 1 ? "border-coral/50 text-coral" : "border-line-2"}`}>{s}</span>{i < a.length - 1 && <span className="text-dim">→</span>}</li>)}</ol></div>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Key decisions</h2><div className="grid gap-4 md:grid-cols-2">{DECISIONS.map((d) => <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>)}</div></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">Results</h2><div className="grid gap-4 md:grid-cols-2">{[["Integrity and fairness cases", `${integrity.passed}/${integrity.total}`], ["Unit tests", `${rules.passed}/${rules.total}`]].map(([k, v]) => <div key={k} className="panel p-6"><p className="font-display text-[40px] font-extrabold">{v}</p><p className="text-[14px] text-muted">{k}</p></div>)}</div><Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">See every case →</Link></section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Privacy and governance</h2>
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">Recruitment AI counts as high-risk under the EU AI Act, and CVs are personal data under GDPR and Saudi PDPL. Versions 1.1 and 1.2 added these controls after an independent privacy and governance review.</p>
          <div className="grid gap-4 md:grid-cols-2">{PRIVACY.map(([t, b]) => <div key={t} className="panel p-6"><h3 className="text-[17px] font-bold">{t}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{b}</p></div>)}</div></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
          <ol>{[["Week 0", "Embed", "Sit with recruiters, agree the rubric with hiring managers, and review data-protection and local hiring rules."], ["Week 1", "Shadow", "Verity screens in parallel; compare its flags and recommendations with recruiters' own."], ["Week 2", "Checklists live", "Recruiters use the verification checklist on real pipelines; nothing is automated."], ["Weeks 3–4", "Fairness audit", "Run counterfactual tests on real (consented) data; publish the results internally."], ["Week 6", "Hand over", "Dashboard, audit log and a quarterly fairness review owned by HR."]].map(([w, t, b]) => <li key={w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_180px_1fr] sm:gap-6"><span className="font-mono text-[12.5px] text-ice">{w}</span><span className="text-[16px] font-bold">{t}</span><span className="text-[14.5px] leading-relaxed text-muted">{b}</span></li>)}</ol>
        </section>
        <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8"><h2 className="text-[28px] font-extrabold">See it for yourself</h2><div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch the demo</Link><a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/recruiter-copilot" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a></div></section>
      </article></main>
      <Footer />
    </>
  );
}
