import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import sec from "@/evals/results/security.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Case study" };
const DECISIONS = [
  { q: "Why a gateway instead of a better system prompt?", a: "Prompts can be talked around; a gateway can't. Putting policy in front of the tools means even a fully manipulated agent hits the same checks as a well-behaved one." },
  { q: "Why SQLite's authorizer for the SQL guard?", a: "String matching misses tricks like CTEs, UNIONs, subqueries and table-valued pragmas. The database engine's own authorizer sees the real parsed query, so read-only and table bans hold whatever the SQL looks like." },
  { q: "Why mask PII by value, not by column?", a: "The first version masked the email column. The test suite showed SELECT email AS contact walked straight past it. Masking every cell by pattern closed the hole." },
  { q: "Why quarantine documents instead of refusing them?", a: "Agents still need the useful parts of an invoice or email. Instruction-like lines are removed and flagged, and the agent is told to treat the rest as data." },
  { q: "Why speak MCP?", a: "Agents built on any framework can connect with a bearer key and get a filtered tool list, so security doesn't depend on which SDK a team picked." },
];
export default function CaseStudy() {
  return (
    <>
      <Nav active="/case-study" />
      <main className="gutter"><article className="mx-auto flex max-w-[1000px] flex-col gap-16 py-12">
        <header className="flex flex-col gap-4"><p className="eyebrow">Case study</p>
          <h1 className="text-[clamp(34px,5vw,64px)] font-extrabold leading-[1]">Letting AI agents into company systems without handing over the keys.</h1>
          <p className="max-w-[64ch] text-[17px] leading-relaxed text-muted">A security gateway for a telecom company rolling out support, analytics and intern agents. The company and data are fictional; the attacks are the ones security teams worry about today.</p>
          <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">{[["Role", "Design, build, red-team"], ["Backend", "Python · FastAPI · SQLite"], ["Protocol", "MCP (JSON-RPC)"], ["Attacks stopped", `${sec.attacksStopped}/${sec.attacks}`]].map(([k, v]) => <div key={k} className="bg-panel p-4"><dt className="text-[12px] text-muted">{k}</dt><dd className="mt-0.5 text-[14px] font-semibold">{v}</dd></div>)}</dl>
        </header>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">The request pipeline</h2>
          <div className="dark-zone rounded-3xl border border-line bg-ink p-6"><ol className="flex flex-wrap items-center gap-2 font-mono text-[12.5px]">{["MCP client / agent", "authenticate", "rate limit", "scope", "argument guard", "approval gate", "execute", "output filter", "audit log"].map((s, i, a) => <li key={s} className="flex items-center gap-2"><span className={`rounded-lg border px-3 py-1.5 ${i === 0 ? "border-ice/50 text-ice" : "border-line-2 text-fg"}`}>{s}</span>{i < a.length - 1 && <span className="text-dim">→</span>}</li>)}</ol>
            <p className="mt-4 text-[13.5px] text-muted">The first failing step stops the call and is recorded with its reason.</p></div>
        </section>
        <section className="flex flex-col gap-5"><h2 className="text-[30px] font-extrabold">Key decisions</h2><div className="grid gap-4 md:grid-cols-2">{DECISIONS.map((d) => <div key={d.q} className="panel p-6"><h3 className="text-[17px] font-bold">{d.q}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.a}</p></div>)}</div></section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">Results</h2>
          <div className="grid gap-4 md:grid-cols-3">{[["Attacks stopped", `${sec.attacksStopped}/${sec.attacks}`], ["Legitimate calls allowed", `${sec.legitAllowed}/${sec.legit}`], ["Unit tests", `${rules.passed}/${rules.total}`]].map(([k, v]) => <div key={k} className="panel p-6"><p className="font-display text-[40px] font-extrabold">{v}</p><p className="text-[14px] text-muted">{k}</p></div>)}</div>
          <Link href="/evals" className="self-start text-[14.5px] font-semibold text-ice hover:underline">See all {sec.total} cases →</Link>
        </section>
        <section className="flex flex-col gap-4"><h2 className="text-[30px] font-extrabold">How I'd roll it out in your company</h2>
          <ol>{[["Week 0", "Inventory", "List every agent, tool and credential in use today; find the shared admin keys."], ["Week 1", "Monitor only", "Put the gateway in front in log-only mode and learn real traffic."], ["Week 2", "Enforce scopes", "Per-agent keys and scopes; block the obvious; keep approvals human."], ["Weeks 3–4", "Harden", "SQL and path guards, PII masking, injection filtering, alerting."], ["Week 6", "Hand over", "Dashboards, runbooks and a red-team suite the security team owns."]].map(([w, t, b]) => <li key={w} className="grid gap-2 border-t border-line py-5 sm:grid-cols-[120px_180px_1fr] sm:gap-6"><span className="font-mono text-[12.5px] text-ice">{w}</span><span className="text-[16px] font-bold">{t}</span><span className="text-[14.5px] leading-relaxed text-muted">{b}</span></li>)}</ol>
        </section>
        <section className="dark-zone flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink p-8"><h2 className="text-[28px] font-extrabold">Try to break it</h2><div className="flex flex-wrap gap-3"><Link href="/demo" className="btn btn-coral">Open the playground</Link><a href="https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/mcp-gateway" target="_blank" rel="noopener" className="btn btn-ghost">Read the code ↗</a></div></section>
      </article></main>
      <Footer />
    </>
  );
}
