import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import Approvals from "@/components/demo/Approvals";

export const metadata: Metadata = { title: "Security dashboard" };
/* SIMULATED week for illustration only. */
const DAYS = [["Mon", 1840, 61, 9], ["Tue", 2120, 74, 12], ["Wed", 1990, 58, 8], ["Thu", 2310, 92, 14], ["Fri", 2050, 66, 10], ["Sat", 640, 21, 2], ["Sun", 520, 17, 1]] as const;
const REASONS = [["Missing scope", 142], ["SQL guard", 96], ["Restricted folder", 41], ["Refund over hard limit", 33], ["Path traversal", 27], ["Rate limit", 25], ["Unknown key", 25]] as const;
const AGENTS = [["support-bot", 6120, 118, 31], ["analytics-bot", 4810, 201, 0], ["intern-bot", 540, 70, 0], ["finance-bot", 1980, 0, 25]] as const;

export default function Dashboard() {
  const max = Math.max(...DAYS.map((d) => d[1]));
  const tot = DAYS.reduce((a, d) => [a[0] + d[1], a[1] + d[2], a[2] + d[3]], [0, 0, 0]);
  return (
    <>
      <Nav active="/dashboard" />
      <main className="gutter"><div className="mx-auto flex max-w-[1240px] flex-col gap-6 py-10">
        <div className="flex flex-col gap-3"><p className="eyebrow">Security dashboard</p><h1 className="max-w-[24ch] text-[clamp(32px,4.6vw,56px)] font-extrabold leading-[1]">See every move your agents make.</h1></div>
        <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5 text-[13px] text-amber"><strong className="font-semibold">Sample data.</strong> A simulated week of traffic to show what a security team sees. The approval queue below is interactive.</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[["Tool calls", tot[0].toLocaleString()], ["Blocked", tot[1]], ["Held for approval", tot[2]], ["Prompt injections removed", 14]].map(([k, v]) => <div key={k} className="bg-panel p-5"><div className="font-display text-[30px] font-bold tabular-nums">{v}</div><div className="text-[12.5px] text-muted">{k}</div></div>)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="panel p-6"><h2 className="mb-5 text-[18px] font-bold">Calls per day</h2>
            <div className="flex h-[220px] items-end gap-3" role="img" aria-label="Bar chart of tool calls per day">
              {DAYS.map(([d, n, b]) => <div key={d} className="flex flex-1 flex-col items-center gap-1.5"><span className="font-mono text-[11px] text-muted">{n}</span><div className="flex w-full max-w-[44px] flex-col overflow-hidden rounded-md" style={{ height: `${(n / max) * 170}px` }}><div className="bg-coral" style={{ height: `${Math.max(3, (b / n) * 100 * 4)}%` }} /><div className="flex-1 bg-ice" /></div><span className="font-mono text-[11px] text-dim">{d}</span></div>)}
            </div>
            <p className="mt-3 flex gap-4 text-[12px] text-muted"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ice" />allowed</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-coral" />blocked (scaled ×4 to be visible)</span></p>
          </section>
          <section className="panel p-6"><h2 className="mb-4 text-[18px] font-bold">Why calls were blocked</h2>
            <ul className="flex flex-col gap-2">{REASONS.map(([l, v]) => <li key={l} className="flex items-center gap-3 text-[13px]"><span className="w-[150px] shrink-0">{l}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2"><span className="block h-full rounded-full bg-coral" style={{ width: `${(100 * v) / REASONS[0][1]}%` }} /></span><span className="w-8 text-right font-mono text-muted">{v}</span></li>)}</ul>
          </section>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Approvals />
          <section className="panel overflow-hidden"><h2 className="border-b border-line px-6 py-4 text-[18px] font-bold">Agents</h2>
            <div className="overflow-x-auto"><table className="w-full text-left text-[13px]"><thead className="text-muted"><tr><th className="px-6 py-2 font-medium">Agent</th><th className="font-medium">Calls</th><th className="font-medium">Blocked</th><th className="pr-6 font-medium">Held</th></tr></thead>
              <tbody>{AGENTS.map(([a, c, b, h]) => <tr key={a} className="border-t border-line"><td className="px-6 py-3 font-mono">{a}</td><td className="font-mono">{c.toLocaleString()}</td><td className="font-mono text-coral">{b}</td><td className="pr-6 font-mono text-amber">{h}</td></tr>)}</tbody></table></div>
          </section>
        </div>
      </div></main>
      <Footer />
    </>
  );
}
