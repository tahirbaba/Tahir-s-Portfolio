import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import bias from "@/evals/results/bias.json";
import integrity from "@/evals/results/integrity.json";

export const metadata: Metadata = { title: "Governance" };

type Row = [string, string, string, string];
const AI_ACT: Row[] = [
  ["Art. 9 · Risk management", "Identify and reduce risks across the lifecycle", "Risks and mitigations listed in the DPIA below; integrity suite re-run on every change", "Client-specific risk register and review cycle"],
  ["Art. 10 · Data governance", "Relevant, representative data; examine possible bias", `Protected attributes removed before the model; bias audit on ${bias.cohort.toLocaleString()} + ${bias.realistic_cohort} counterfactual screenings`, "Test on the client's own consented historical applications"],
  ["Art. 12 · Record-keeping", "Automatic logs over the system's lifetime", "Audit record for every screening: time, rules version, model, what was hidden", "Store in the client's database with tamper-evident retention"],
  ["Art. 13 · Transparency to deployers", "Instructions for use, capabilities and limits", "Model card and known limits below; case study; open source code", "Client-specific instructions for recruiters"],
  ["Art. 14 · Human oversight", "People can understand, override and stop the system", "No reject button: every outcome is a recommendation; verification checklist; recruiter decides", "Track override rates in production"],
  ["Art. 15 · Accuracy and robustness", "Appropriate accuracy, resilience to errors and manipulation", "Every extracted fact checked against the CV; evidence must be quoted verbatim; CV text treated as untrusted", "Live accuracy run against hand-labelled CVs (script ready, needs the API key)"],
  ["Art. 26 and 86 · Deployer duties, explanation", "Inform people; explain decisions on request", "Applicant notice and consent before screening; plain-language explanation for the candidate", "Client's process for review requests"],
];
const GDPR: Row[] = [
  ["Art. 5 · Minimisation, storage limits", "Collect only what's needed; keep it only as long as needed", "Personal details dropped, not just hidden; nothing stored by Verity", "Retention schedule agreed with the client's DPO"],
  ["Art. 6 · Lawful basis", "A valid legal basis for processing", "Applicant notice makes the purpose explicit", "Client chooses the basis (usually legitimate interests) with their DPO"],
  ["Art. 9 · Special-category data", "Extra protection for health, religion and similar", "Religion and health or family reasons for career breaks removed before the model reads the CV", "Review patterns for the client's languages"],
  ["Art. 13 · Information to candidates", "Tell people how their data is used", "Notice covers AI use, what is hidden, what is analysed, reuse and security", "Add to the client's careers-site privacy notice"],
  ["Art. 22 · Automated decisions", "No solely automated decisions with significant effects", "A recruiter makes every decision; the system can't reject anyone", "Keep it that way in configuration"],
  ["Art. 28 and 35 · Processors, DPIA", "Contracts with processors; impact assessment for high risk", "DPIA summary below; Anthropic named as processor; Zero Data Retention available", "Signed DPA; full DPIA by the client"],
];
const OTHER: Row[] = [
  ["Saudi PDPL", "Notice, purpose limitation, minimisation, cross-border transfer rules", "Notice and consent; minimisation; nothing stored", "Assess transfer to the AI provider's region, or use an in-region deployment"],
  ["NYC Local Law 144", "Independent bias audit of hiring tools, published yearly; notice to candidates", "Impact-ratio audit by gender, age and intersections (four-fifths rule)", "An independent auditor and real outcome data are required"],
];
const DPIA = [
  ["Purpose", "Help recruiters screen applications for one role consistently, with evidence, faster."],
  ["Data", "CV text and application-form answers. Identity, contact details, photo, gender, age, marital status, religion, nationality, hobbies and health or family reasons are removed before the AI reads anything."],
  ["Recipients", "The recruiter. The AI provider (Anthropic) processes the redacted CV only; it does not train on API data by default."],
  ["Retention", "Verity stores nothing. A deployment keeps results only for the agreed period (for example 30 days)."],
];
const RISKS = [
  ["Bias against a group", "Redaction before the model; identical-score tests; impact-ratio audit", "Low for the rules; model-level fairness still to be measured live"],
  ["Re-identification from employers or schools", "Contact line, city and links removed; remaining names flagged and never scored", "Medium: names are needed for verification"],
  ["Wrong or invented AI output", "Every extracted fact checked against the CV; unverified facts ignored and flagged", "Low"],
  ["Over-reliance on the recommendation", "No reject button; checklist; explanation for the candidate; recruiter decides", "Medium: depends on recruiter training"],
  ["Data breach", "Nothing stored; encrypted in transit; audit log without CV text", "Low"],
];

function Table({ title, rows, head }: { title: string; rows: Row[]; head: [string, string, string, string] }) {
  return (
    <section className="flex flex-col gap-3"><h2 className="text-[24px] font-extrabold">{title}</h2>
      <div className="panel overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]">
        <thead className="bg-panel-2 text-muted"><tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-line align-top">{r.map((c, i) => <td key={i} className={`px-4 py-2.5 ${i === 0 ? "font-semibold" : i === 3 ? "text-amber" : "text-muted"}`}>{c}</td>)}</tr>)}</tbody>
      </table></div>
    </section>
  );
}

export default function Governance() {
  const head: [string, string, string, string] = ["Requirement", "What it asks", "How Verity addresses it", "Still needed in a deployment"];
  return (
    <>
      <Nav active="/governance" />
      <main className="gutter"><article className="mx-auto flex max-w-[1100px] flex-col gap-12 py-12">
        <header className="flex flex-col gap-4"><p className="eyebrow">Governance · v1.3</p>
          <h1 className="text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1.02]">How Verity maps to the rules for AI in hiring.</h1>
          <p className="max-w-[70ch] text-[16px] leading-relaxed text-muted">Recruitment AI is high-risk under the EU AI Act, and CVs are personal data under GDPR and Saudi PDPL. This page shows each requirement, what Verity does about it, and what a real deployment still needs. It is a design document, not legal advice or a certification: a deployment needs the client's DPO and legal review, and an independent audit.</p>
          <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-[13.5px] text-amber">The amber column is the honest part: what can only be proven with a real client, real data and an independent reviewer.</div>
        </header>
        <Table title="EU AI Act (high-risk: employment, Annex III)" rows={AI_ACT} head={head} />
        <Table title="GDPR / UK GDPR" rows={GDPR} head={head} />
        <Table title="Other regimes" rows={OTHER} head={head} />
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-6"><h2 className="text-[22px] font-extrabold">DPIA summary</h2>
            <dl className="mt-4 flex flex-col gap-3 text-[14px]">{DPIA.map(([k, v]) => <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted">{v}</dd></div>)}</dl></div>
          <div className="panel p-6"><h2 className="text-[22px] font-extrabold">Risks and mitigations</h2>
            <ul className="mt-4 flex flex-col gap-3 text-[13.5px]">{RISKS.map(([r, m, res]) => <li key={r}><p className="font-semibold">{r}</p><p className="text-muted">{m}</p><p className="font-mono text-[11.5px] text-dim">Residual: {res}</p></li>)}</ul></div>
        </section>
        <section className="panel p-6"><h2 className="text-[22px] font-extrabold">Model card</h2>
          <div className="mt-4 grid gap-5 text-[14px] md:grid-cols-2">
            <div><p className="font-semibold">Intended use</p><p className="text-muted">Help a recruiter screen applications for one defined role against an agreed rubric, with verified evidence and a checklist of claims to confirm.</p>
              <p className="mt-3 font-semibold">Not intended for</p><p className="text-muted">Rejecting candidates automatically; ranking people across different roles; judging personality, culture fit or writing style; any use without a recruiter reviewing the result.</p>
              <p className="mt-3 font-semibold">How it works</p><p className="text-muted">Claude (via the Anthropic API) reads the redacted CV and extracts facts with verbatim quotes. Python code then checks those facts against the CV, scores the rubric, computes experience from dates and compares the CV, application form and public profile.</p></div>
            <div><p className="font-semibold">Measured</p><ul className="text-muted">
                <li>Integrity, fairness and privacy cases: {integrity.passed}/{integrity.total}</li>
                <li>Counterfactual screenings: {bias.cohort.toLocaleString()} demographic + {bias.realistic_cohort} realistic variations, impact ratio 1.00 for every group</li>
                <li>Live accuracy and model-level fairness: script ready (<code className="font-mono text-[12px]">evals/live_validation.py</code>), awaiting the first run</li></ul>
              <p className="mt-3 font-semibold">Known limits</p><ul className="flex list-disc flex-col gap-1 pl-5 text-muted">{bias.known_limits.map((k) => <li key={k}>{k}</li>)}<li>The demo uses seven fictional candidates; real-world performance must be measured on the client's own data.</li></ul></div>
          </div>
        </section>
      </article></main>
      <Footer />
    </>
  );
}
