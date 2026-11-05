import type { Metadata } from "next";
import Link from "next/link";
import Architecture from "@/components/site/Architecture";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import rules from "@/evals/results/rules.json";
import dataset from "@/evals/dataset.json";

export const metadata: Metadata = { title: "Case study" };

const DECISIONS = [
  { q: "Why enforce rules in code instead of the prompt?", a: "A prompt is a request; code is a guarantee. The model can ask for any refund, but the tool only executes what policy allows and returns the reason when it refuses. That keeps the agent honest even under prompt injection." },
  { q: "Why an approval inbox instead of a hard ‘no’?", a: "Large refunds are often legitimate. Routing them to a care lead with the case already summarised keeps the customer moving and keeps a person accountable for money." },
  { q: "Why sign the session state?", a: "The demo runs on stateless serverless functions, so state travels with the client. An HMAC signature stops anyone marking an order as verified without the email." },
  { q: "Why four languages from day one?", a: "Stores serving the Gulf and Pakistan get English, Arabic, Urdu and Roman Urdu in the same week. The agent replies in the customer's script, and Urdu renders in Nastaliq." },
  { q: "Why replays on the demo page?", a: "Visitors watching the demo shouldn't cost API calls. Replays show the real tool calls and rule outcomes; the live tab talks to Claude directly." },
];

const ROLLOUT = [
  { w: "Week 0", t: "Embed", b: "Read 300 recent tickets, map the top request types and agree the metric: share resolved without a person, with zero policy violations." },
  { w: "Week 1", t: "Shadow mode", b: "Relay drafts replies; agents send them. Every draft is scored against the eval rubric." },
  { w: "Week 2", t: "First slice live", b: "Order status and address changes go fully automatic. Refunds stay human-approved." },
  { w: "Weeks 3–4", t: "Widen", b: "Refunds under the limit go automatic; weekly review of escalations adds new eval cases." },
  { w: "Week 6", t: "Hand over", b: "Dashboard, alerts and runbook owned by the support team." },
];

export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter">
        <article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
          <header className="flex flex-col gap-4">
            <p className="eyebrow">Case study</p>
            <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">Building a support agent a business can trust with refunds.</h1>
            <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">A multilingual support agent for a home-goods store selling into the UAE, Saudi Arabia, Pakistan, the UK and the US. The store is fictional; the engineering problems are the real ones that stop support bots reaching production.</p>
            <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {[["Role", "Design, build, evals"], ["Stack", "Next.js · TypeScript · Claude"], ["Languages", "EN · AR · UR · Roman UR"], ["Tests", `${rules.passed}/${rules.total} passing`]].map(([k, v]) => (
                <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>
              ))}
            </dl>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-[30px] font-extrabold">The problem</h2>
            <p className="max-w-[68ch] text-[16px] leading-relaxed text-muted">Support teams want automation, but the usual chatbot fails in three ways: it promises refunds policy doesn't allow, it shares order details with whoever asks, and it can't prove how often it gets things right. Customers who write in Arabic or Urdu get the worst of it.</p>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-[30px] font-extrabold">Architecture</h2>
            <Architecture />
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-[30px] font-extrabold">Key decisions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {DECISIONS.map((d) => (
                <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-[30px] font-extrabold">How it's measured</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="panel p-6"><p className="eyebrow">Rule and loop tests</p><p className="mt-2 font-display text-[44px] font-extrabold">{rules.passed}/{rules.total}</p><p className="text-[14px] text-muted">passing, no model involved: identity, limits, windows, PII, agent loop.</p></div>
              <div className="panel p-6"><p className="eyebrow">Agent eval suite</p><p className="mt-2 font-display text-[44px] font-extrabold">{dataset.length} cases</p><p className="text-[14px] text-muted">Four languages, 16 categories including prompt injection. Results publish after the first run with an API key.</p></div>
            </div>
            <Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">Open the eval dashboard →</Link>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
            <ol className="flex flex-col">
              {ROLLOUT.map((r) => (
                <li key={r.w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_180px_1fr] sm:gap-6">
                  <span className="font-mono text-[12.5px] text-ice">{r.w}</span>
                  <span className="text-[16px] font-bold">{r.t}</span>
                  <span className="text-[14.5px] leading-relaxed text-muted">{r.b}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8">
            <h2 className="text-[28px] font-extrabold">See it for yourself</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="btn btn-coral">Watch the demo</Link>
              <a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/support-agent" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
