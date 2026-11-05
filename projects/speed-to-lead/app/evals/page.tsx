import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "Evals" };
const dir = path.join(process.cwd(), "evals");
const read = <T,>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null);
const LANG: Record<string, string> = { en: "English", ar: "Arabic", ur: "Urdu", roman_ur: "Roman Urdu" };

type Rules = { runAt: string; total: number; passed: number; tests: { name: string; file: string; pass: boolean }[] };
type Case = { language: string; category: string; expect: { tier: string } };
type Run = { runAt: string; model: string; judgeModel: string; cases: number; metrics: Record<string, number> };

export default function Evals() {
  const rules = read<Rules>(path.join(dir, "results", "rules.json"));
  const ds = read<Case[]>(path.join(dir, "dataset.json")) ?? [];
  const run = read<Run>(path.join(dir, "results", "latest.json"));
  const count = (f: (c: Case) => string) => ds.reduce<Record<string, number>>((m, c) => ((m[f(c)] = (m[f(c)] || 0) + 1), m), {});
  const LABELS: Record<string, string> = { taskSuccess: "Task success %", policyFollowed: "Tier policy followed %", bookingAccuracy: "Booking accuracy %", spamSilenced: "Spam silenced %", languageMatch: "Language match %", avgHelpfulness: "Helpfulness /5", avgCostPerLead: "Cost per lead $", p50LatencyMs: "Latency p50 ms", p95LatencyMs: "Latency p95 ms" };
  return (
    <>
      <Nav active="/evals" />
      <main className="gutter"><div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
        <section><p className="eyebrow">Evaluation</p><h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-extrabold">How Leadline is measured</h1>
          <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">pytest checks the Python rules with no model involved. The agent eval sends {ds.length} leads in four languages through the full agent and grades whether it followed the tier policy, booked correctly, stayed silent on spam and replied in the lead's language.</p></section>
        <section className="panel p-6">
          <p className="eyebrow">Layer 1 · pytest</p><h2 className="mt-1 text-[22px] font-bold">{rules ? `${rules.passed} / ${rules.total} passing` : "Not run yet"}</h2>
          {rules && <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">{rules.tests.map((t) => <li key={t.name} className="flex gap-2 text-[13px]"><span className={t.pass ? "text-ok" : "text-rose"}>{t.pass ? "✓" : "✗"}</span><span className="text-muted">{t.name}</span></li>)}</ul>}
        </section>
        <section className="panel p-6">
          <p className="eyebrow">Layer 2 · Agent eval suite</p>
          {run ? (
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">{Object.entries(run.metrics).map(([k, v]) => <div key={k} className="bg-panel p-4"><div className="text-[24px] font-bold tabular-nums">{v}</div><div className="text-[12px] text-muted">{LABELS[k] ?? k}</div></div>)}</div>
          ) : <><h2 className="mt-1 text-[22px] font-bold">Awaiting first run</h2><p className="mt-2 text-[14.5px] text-muted">Needs a Claude API key: <code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/run.py</code>. No numbers are shown until they are measured.</p></>}
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div><p className="eyebrow mb-2">By language</p>{Object.entries(count((c) => c.language)).map(([k, v]) => <div key={k} className="flex justify-between text-[13.5px]"><span>{LANG[k]}</span><span className="font-mono text-muted">{v}</span></div>)}</div>
            <div><p className="eyebrow mb-2">By expected tier</p>{Object.entries(count((c) => c.expect.tier)).map(([k, v]) => <div key={k} className="flex justify-between text-[13.5px]"><span className="capitalize">{k}</span><span className="font-mono text-muted">{v}</span></div>)}</div>
            <div><p className="eyebrow mb-2">By scenario</p>{Object.entries(count((c) => c.category)).map(([k, v]) => <div key={k} className="flex justify-between text-[13.5px]"><span>{k.replace("_", " ")}</span><span className="font-mono text-muted">{v}</span></div>)}</div>
          </div>
        </section>
        <section className="panel p-6 text-[14px] text-muted"><p className="eyebrow mb-2">Each case is graded on</p>
          <ul className="grid gap-1.5 sm:grid-cols-2"><li>• Scored the lead before anything else</li><li>• Respected the tier (alerts only for hot, slots only for hot and warm)</li><li>• Booked only valid times; refused invalid ones</li><li>• Logged to CRM; stayed silent on spam</li><li>• Replied in the lead's script and language</li><li>• LLM judge: no invented times, prices or facts; helpfulness 1–5</li></ul>
        </section>
      </div></main>
      <Footer />
    </>
  );
}
