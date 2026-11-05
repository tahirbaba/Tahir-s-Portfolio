import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import HeroDemo from "@/components/landing/HeroDemo";
import RoiCalculator from "@/components/landing/RoiCalculator";
import type { Replay } from "@/components/demo/types";
import replaysJson from "@/data/replays.json";
import rules from "@/evals/results/rules.json";
import dataset from "@/evals/dataset.json";

const replays = replaysJson as Replay[];
const heroReplays = ["approval", "late", "address"].map((id) => replays.find((r) => r.id === id)!).filter(Boolean);

const PROBLEMS = [
  { t: "Customers wait, then leave", b: "Simple questions sit in the same queue as hard ones, overnight and on weekends." },
  { t: "Bots promise what they can't do", b: "A chatbot that offers a refund your policy doesn't allow creates a second, angrier ticket." },
  { t: "One language isn't enough", b: "Your customers write in English, Arabic, Urdu and Roman Urdu, often in the same day." },
];
const STEPS = [
  { t: "Verify", b: "Matches the order number with the customer's email before sharing anything." },
  { t: "Check policy", b: "Looks up your refund, return and shipping rules for this exact case." },
  { t: "Act within limits", b: "Refunds, returns and address changes go through only if the rules allow them." },
  { t: "Hand off", b: "Big refunds go to your approval inbox. Hard cases go to a person with a summary." },
];
const FEATURES = [
  { t: "Speaks their language", b: "English, Arabic, Urdu in Nastaliq script, and Roman Urdu, with proper right-to-left layout." },
  { t: "Rules live in code", b: "Refund limits, 30-day windows and identity checks are enforced by the system, not by a prompt." },
  { t: "You approve the big ones", b: "Refunds above your limit land in an approval inbox with the case already written up." },
  { t: "People when it matters", b: "Legal threats, chargebacks and requests for a human are escalated, never argued with." },
  { t: "Private by design", b: "Emails, phones and card numbers are masked in logs; sessions are signed against tampering." },
  { t: "Measured, not guessed", b: `A ${dataset.length}-case eval suite in four languages, including prompt-injection attacks.` },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="gutter relative overflow-hidden">
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,#000_10%,transparent_70%)]" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="flex flex-col gap-6">
              <p className="eyebrow">AI support agent · English · <span className="arabic normal-case tracking-normal">العربية</span> · <span className="urdu normal-case tracking-normal">اردو</span></p>
              <h1 className="text-[clamp(38px,4.8vw,64px)] font-extrabold leading-[1.02]">
                Support that speaks your customers' language <span className="text-ice">and follows your rules.</span>
              </h1>
              <p className="max-w-[56ch] text-[18px] leading-relaxed text-muted">
                Relay answers on chat and on your website, verifies every customer, refunds within your limits, sends bigger refunds to your approval inbox, and hands hard cases to your team with a summary.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/demo" className="btn btn-coral">Watch it work →</Link>
                <Link href="/case-study" className="btn btn-ghost">Read the case study</Link>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 font-mono text-[12.5px] text-muted">
                <li><span className="text-ok">●</span> {rules.passed}/{rules.total} rule tests passing</li>
                <li><span className="text-ice">●</span> {dataset.length}-case eval suite</li>
                <li><span className="text-amber">●</span> Human approval above 100 USD</li>
              </ul>
            </div>
            <HeroDemo replays={heroReplays} />
          </div>
        </section>

        {/* Problem */}
        <section className="gutter border-y border-line bg-panel">
          <div className="mx-auto grid max-w-[1240px] gap-px py-2 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="flex flex-col gap-2 px-2 py-8 md:px-8">
                <h2 className="text-[20px] font-bold">{p.t}</h2>
                <p className="text-[15px] leading-relaxed text-muted">{p.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="gutter">
          <div className="mx-auto max-w-[1240px] py-20 sm:py-28">
            <p className="eyebrow">How Relay handles every conversation</p>
            <h2 className="mt-3 max-w-[22ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Four steps, every time, in any language.</h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="panel relative flex flex-col gap-3 p-6">
                  <span className="font-mono text-[12px] text-ice">0{i + 1}</span>
                  <h3 className="text-[20px] font-bold">{s.t}</h3>
                  <p className="text-[14.5px] leading-relaxed text-muted">{s.b}</p>
                  {i < STEPS.length - 1 && <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink text-[12px] text-muted md:grid">→</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="gutter dark-zone bg-ink">
          <div className="mx-auto max-w-[1240px] py-20 sm:py-28">
            <p className="eyebrow">Built for real operations</p>
            <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">The parts most chatbots skip.</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.t} className="flex flex-col gap-2 bg-ink p-7 transition-colors hover:bg-panel">
                  <h3 className="text-[19px] font-bold">{f.t}</h3>
                  <p className="text-[14.5px] leading-relaxed text-muted">{f.b}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn btn-ghost">See the manager dashboard</Link>
              <Link href="/evals" className="btn btn-ghost">See how it's tested</Link>
            </div>
          </div>
        </section>

        {/* ROI */}
        <section className="gutter" id="roi">
          <div className="mx-auto max-w-[1240px] py-20 sm:py-28">
            <p className="eyebrow">Estimate your savings</p>
            <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">What would Relay free up for your team?</h2>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-muted">Move the sliders to match your store. Every number comes from your inputs.</p>
            <div className="mt-10"><RoiCalculator /></div>
          </div>
        </section>

        {/* CTA */}
        <section className="gutter border-t border-line bg-panel">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 py-20">
            <h2 className="max-w-[20ch] text-[clamp(32px,5vw,60px)] font-extrabold leading-[1]">Want an agent like this in your business?</h2>
            <p className="max-w-[60ch] text-[16px] leading-relaxed text-muted">Relay is a portfolio project by Muhammad Tahir Hasni, a Forward Deployed Engineer who builds and deploys AI agents for support, sales, finance and operations teams.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="btn btn-coral">Try the live demo</Link>
              <Link href="/case-study" className="btn btn-ghost">How it was built</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
