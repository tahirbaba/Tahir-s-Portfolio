import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import HeroDemo from "@/components/demo/HeroDemo";
import type { Replay } from "@/components/demo/types";
import replays from "@/data/replays.json";
import integrity from "@/evals/results/integrity.json";
import rules from "@/evals/results/rules.json";

const PROBLEMS = [
  { t: "Hundreds of polished CVs", b: "AI writing tools make every application look strong. Recruiters can't tell real experience from well-written claims." },
  { t: "Claims that don't add up", b: "Eight years claimed, six by the dates. A ‘Lead’ title the public profile calls ‘Engineer’. Two full-time jobs at once." },
  { t: "Screening tools that add bias", b: "Black-box scores that react to names, gender or gaps create legal risk and miss good people." },
];
const HOW = [
  ["Blind by default", "Names, contact details, gender, age and marital status are removed before the AI reads anything."],
  ["Evidence or nothing", "A rubric point counts only if the quote behind it appears word for word in the CV."],
  ["Dates, not claims", "Experience is computed from the CV's own dates, with overlaps counted once."],
  ["Consistency checks", "CV vs application form vs public profile: years, titles, overlapping roles, degree years, certificate IDs."],
  ["A checklist, not a verdict", "Every flag becomes a concrete verification step. Career gaps are noted, never penalised."],
  ["People decide", "Verity recommends; it never rejects. The recruiter owns every decision."],
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
              <p className="eyebrow">Recruiter integrity copilot · Python + Claude</p>
              <h1 className="text-[clamp(38px,4.8vw,64px)] font-extrabold leading-[1.02]">Screen the evidence, <span className="text-ice">not the name.</span></h1>
              <p className="max-w-[56ch] text-[18px] leading-relaxed text-muted">Verity reads CVs blind, scores only what the CV can prove, and checks every claim against the application form and public profile. Recruiters get an explained recommendation and a verification checklist, and make the call themselves.</p>
              <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch it work →</Link><Link href="/evals" className="btn btn-ghost">See the fairness tests</Link></div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 font-mono text-[12.5px] text-muted"><li><span className="text-ok">●</span> {integrity.passed}/{integrity.total} integrity and fairness cases</li><li><span className="text-ok">●</span> {rules.passed}/{rules.total} unit tests</li><li><span className="text-coral">●</span> no auto-rejection</li></ul>
            </div>
            <HeroDemo a={r[0]} b={r[r.length - 1]} />
          </div>
        </section>
        <section className="gutter border-y border-line bg-panel"><div className="mx-auto grid max-w-[1240px] md:grid-cols-3">{PROBLEMS.map((p) => <div key={p.t} className="flex flex-col gap-2 px-2 py-8 md:px-8"><h2 className="text-[20px] font-bold">{p.t}</h2><p className="text-[15px] leading-relaxed text-muted">{p.b}</p></div>)}</div></section>
        <section className="gutter"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">How Verity screens</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Faster screening that's harder to fool and fairer to people.</h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{HOW.map(([t, b]) => <li key={t} className="panel flex flex-col gap-2 p-6"><h3 className="text-[19px] font-bold">{t}</h3><p className="text-[14.5px] leading-relaxed text-muted">{b}</p></li>)}</ol>
        </div></section>
        <section className="gutter dark-zone bg-ink"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">What it won't do</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">No ‘AI-written CV’ detector. No auto-reject.</h2>
          <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-muted">Detectors that guess whether text was AI-written are unreliable and punish good writers. Verity checks facts that can be verified instead, and leaves every decision to a person.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn btn-ghost">See the hiring dashboard</Link><Link href="/case-study" className="btn btn-ghost">How it was built</Link></div>
        </div></section>
        <section className="gutter border-t border-line bg-panel"><div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 py-20">
          <h2 className="max-w-[20ch] text-[clamp(32px,5vw,60px)] font-extrabold leading-[1]">Hiring through a flood of applications?</h2>
          <p className="max-w-[60ch] text-[16px] leading-relaxed text-muted">Verity is a portfolio project by Muhammad Tahir Hasni, a Forward Deployed Engineer who builds and deploys responsible AI agents for HR, finance, sales and support teams.</p>
          <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Try the demo</Link><Link href="/case-study" className="btn btn-ghost">Read the case study</Link></div>
        </div></section>
      </main>
      <Footer />
    </>
  );
}
