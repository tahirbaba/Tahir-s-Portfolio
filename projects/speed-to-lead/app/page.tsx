import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import HeroDemo from "@/components/demo/HeroDemo";
import type { Replay } from "@/components/demo/types";
import replays from "@/data/replays.json";
import rules from "@/evals/results/rules.json";
import dataset from "@/evals/dataset.json";

const PROBLEMS = [
  { t: "Leads go cold in minutes", b: "Form fills, WhatsApp messages and missed calls wait in a queue while the buyer moves on to the next vendor." },
  { t: "Reps waste time on bad fits", b: "Students, competitors and spam get the same attention as a VP with budget." },
  { t: "Time zones break bookings", b: "‘Tuesday at 10’ means different things in Dubai, Karachi and Chicago, and a wrong invite costs the meeting." },
];
const STEPS = [
  { t: "Score", b: "Fit and intent scored in code against your ideal customer profile, with every reason shown." },
  { t: "Route", b: "The right rep by region; hot leads trigger an instant alert." },
  { t: "Reply", b: "A personal first reply in the lead's language within seconds, across form, WhatsApp and missed calls." },
  { t: "Book", b: "Real calendar slots in the lead's time zone, validated against the rep's hours before anything is confirmed." },
];
const FEATURES = [
  { t: "Scoring you can audit", b: "Industry, size, region, seniority and intent, each with points. No black-box score." },
  { t: "Time-zone safe booking", b: "Slots are checked against working hours, weekends, conflicts and midnight wrap-around in Python." },
  { t: "Multilingual first replies", b: "English, Arabic, Urdu and Roman Urdu, matching how the lead wrote." },
  { t: "Spam and competitors filtered", b: "No replies to spam, short polite answers to competitors and students, nothing pushed to reps." },
  { t: "CRM written for you", b: "Every lead lands in the CRM with tier, score, owner, summary and next step." },
  { t: "Measured", b: `${rules.passed} rule tests and a ${dataset.length}-lead eval suite in four languages.` },
];

export default function Home() {
  const hero = (replays as Replay[]).filter((r) => ["hot_ar", "hot_ur", "warm_ru"].includes(r.id));
  return (
    <>
      <Nav />
      <main>
        <section className="gutter relative overflow-hidden">
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,#000_10%,transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="flex flex-col gap-6">
              <p className="eyebrow">Speed-to-lead agent · Python + Claude</p>
              <h1 className="text-[clamp(38px,4.8vw,64px)] font-extrabold leading-[1.02]">Answer every lead <span className="text-ice">in under a minute.</span> Book the good ones.</h1>
              <p className="max-w-[56ch] text-[18px] leading-relaxed text-muted">Leadline replies to new leads from your website, WhatsApp and missed calls, scores them against your ideal customer, alerts the right rep and books meetings in the buyer's time zone. Everything lands in your CRM.</p>
              <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch it work →</Link><Link href="/case-study" className="btn btn-ghost">Read the case study</Link></div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 font-mono text-[12.5px] text-muted">
                <li><span className="text-ok">●</span> {rules.passed}/{rules.total} rule tests passing</li><li><span className="text-ice">●</span> {dataset.length}-lead eval suite</li><li><span className="text-coral">●</span> FastAPI + Next.js</li>
              </ul>
            </div>
            <HeroDemo replays={hero} />
          </div>
        </section>
        <section className="gutter border-y border-line bg-panel"><div className="mx-auto grid max-w-[1240px] md:grid-cols-3">{PROBLEMS.map((p) => <div key={p.t} className="flex flex-col gap-2 px-2 py-8 md:px-8"><h2 className="text-[20px] font-bold">{p.t}</h2><p className="text-[15px] leading-relaxed text-muted">{p.b}</p></div>)}</div></section>
        <section className="gutter"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">How Leadline handles every lead</p>
          <h2 className="mt-3 max-w-[22ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Score, route, reply, book.</h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-4">{STEPS.map((s, i) => <li key={s.t} className="panel flex flex-col gap-3 p-6"><span className="font-mono text-[12px] text-ice">0{i + 1}</span><h3 className="text-[20px] font-bold">{s.t}</h3><p className="text-[14.5px] leading-relaxed text-muted">{s.b}</p></li>)}</ol>
        </div></section>
        <section className="gutter dark-zone bg-ink"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">Built for real sales teams</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Fast is easy. Fast and right is the work.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map((f) => <div key={f.t} className="flex flex-col gap-2 bg-ink p-7 transition-colors hover:bg-panel"><h3 className="text-[19px] font-bold">{f.t}</h3><p className="text-[14.5px] leading-relaxed text-muted">{f.b}</p></div>)}</div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn btn-ghost">See the sales dashboard</Link><Link href="/evals" className="btn btn-ghost">See how it's tested</Link></div>
        </div></section>
        <section className="gutter border-t border-line bg-panel"><div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 py-20">
          <h2 className="max-w-[20ch] text-[clamp(32px,5vw,60px)] font-extrabold leading-[1]">Want every lead answered while it's still warm?</h2>
          <p className="max-w-[60ch] text-[16px] leading-relaxed text-muted">Leadline is a portfolio project by Muhammad Tahir Hasni, a Forward Deployed Engineer who builds and deploys AI agents for sales, support, finance and operations teams.</p>
          <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Try the demo</Link><Link href="/case-study" className="btn btn-ghost">How it was built</Link></div>
        </div></section>
      </main>
      <Footer />
    </>
  );
}
