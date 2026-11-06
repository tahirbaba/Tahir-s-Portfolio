import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import ReplayDemo from "@/components/demo/ReplayDemo";
import type { Replay } from "@/components/demo/types";
import replays from "@/data/replays.json";
import retrieval from "@/evals/results/retrieval.json";
import rules from "@/evals/results/rules.json";

const PROBLEMS = [
  { t: "Answers buried in fifty documents", b: "People ask the same questions in chat every day because the handbook, the wiki and the policy PDFs don't answer them quickly." },
  { t: "Chatbots that leak", b: "A bot that has read salary bands and pricing sheets can be talked into sharing them with anyone." },
  { t: "Last year's policy, confidently", b: "Old versions sit next to new ones, and the assistant quotes whichever it finds first." },
];
const HOW = [
  ["Permissions before search", "Each section carries its access list. Sections a person can't read are removed before ranking, so the AI never sees them."],
  ["Current policy only", "Superseded versions are skipped automatically, and every answer shows when its source was last updated."],
  ["Every fact cited", "Answers carry section ids you can click. Code checks each citation points at a section that was retrieved and is readable."],
  ["‘Not found’ beats a guess", "If an answer has no verified citation, it is replaced with ‘not found’ and a pointer to who can help."],
  ["Any language in, sources out", "Ask in Urdu, Roman Urdu or Arabic; the search runs in English and the answer comes back in your language."],
  ["Measured", `Recall@3 ${retrieval.metrics.recallAt3}%, ${retrieval.metrics.accessLeaks} permission leaks across ${retrieval.results.filter((r) => r.category === "Access control").length} attack questions.`],
];

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <section className="gutter relative overflow-hidden">
          <div aria-hidden className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_40%,#000_10%,transparent_70%)]" />
          <div className="relative mx-auto flex max-w-[1240px] flex-col gap-6 py-16 lg:py-20">
            <p className="eyebrow">Company knowledge assistant · Python + Claude</p>
            <h1 className="max-w-[18ch] text-[clamp(38px,5vw,68px)] font-extrabold leading-[1.02]">Answers from your documents. <span className="text-ice">Only the ones you're allowed to see.</span></h1>
            <p className="max-w-[62ch] text-[18px] leading-relaxed text-muted">Compass answers employee questions from handbooks, policies and runbooks with a source for every fact. Permissions are applied before the AI reads anything, outdated policies are skipped, and answers it can't back up become ‘not found’.</p>
            <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Watch it work →</Link><Link href="/evals" className="btn btn-ghost">See the retrieval results</Link></div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12.5px] text-muted"><li><span className="text-ok">●</span> recall@3 {retrieval.metrics.recallAt3}%</li><li><span className="text-ok">●</span> {retrieval.metrics.accessLeaks} permission leaks</li><li><span className="text-ok">●</span> {rules.passed}/{rules.total} unit tests</li></ul>
          </div>
          <div className="relative mx-auto max-w-[1240px] pb-16"><ReplayDemo replays={(replays as Replay[]).slice(0, 4)} /></div>
        </section>
        <section className="gutter border-y border-line bg-panel"><div className="mx-auto grid max-w-[1240px] md:grid-cols-3">{PROBLEMS.map((p) => <div key={p.t} className="flex flex-col gap-2 px-2 py-8 md:px-8"><h2 className="text-[20px] font-bold">{p.t}</h2><p className="text-[15px] leading-relaxed text-muted">{p.b}</p></div>)}</div></section>
        <section className="gutter"><div className="mx-auto max-w-[1240px] py-20 sm:py-28">
          <p className="eyebrow">How Compass answers</p>
          <h2 className="mt-3 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.02]">Trustworthy by construction, not by prompt.</h2>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{HOW.map(([t, b]) => <li key={t} className="panel flex flex-col gap-2 p-6"><h3 className="text-[19px] font-bold">{t}</h3><p className="text-[14.5px] leading-relaxed text-muted">{b}</p></li>)}</ol>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn btn-ghost">See the knowledge dashboard</Link><Link href="/case-study" className="btn btn-ghost">How it was built</Link></div>
        </div></section>
        <section className="gutter border-t border-line bg-panel"><div className="mx-auto flex max-w-[1240px] flex-col items-start gap-6 py-20">
          <h2 className="max-w-[20ch] text-[clamp(32px,5vw,60px)] font-extrabold leading-[1]">Want your team to stop asking the same questions?</h2>
          <p className="max-w-[60ch] text-[16px] leading-relaxed text-muted">Compass is a portfolio project by Muhammad Tahir Hasni, a Forward Deployed Engineer who builds and deploys AI agents on company data, safely.</p>
          <div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Try the demo</Link><Link href="/case-study" className="btn btn-ghost">Read the case study</Link></div>
        </div></section>
      </main>
      <Footer />
    </>
  );
}
