import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import controls from "@/evals/results/controls.json";
import rules from "@/evals/results/rules.json";

export const metadata: Metadata = { title: "Evals" };
export const dynamic = "force-static";
const LABEL: Record<string, string> = { fieldAccuracy: "Field accuracy %", lineItemsExact: "Line items exact %", correctDecision: "Correct decision %", correctAction: "Correct action %", avgCostPerInvoice: "Cost per invoice $", avgLatencyMs: "Latency ms" };

export default function Evals() {
  const p = path.join(process.cwd(), "evals", "results", "latest.json");
  const run = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
  return (
    <>
      <Nav active="/evals" />
      <main className="gutter"><div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
        <section><p className="eyebrow">Evaluation</p><h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-extrabold">How Ledger is measured</h1>
          <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">Two parts. The controls suite checks the Python rules on {controls.total} invoices, exactly and without a model. The reading eval checks whether Claude extracts every field from the original documents and reaches the right decision.</p></section>
        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-6"><div><p className="eyebrow">Controls suite · no model</p><h2 className="mt-1 text-[22px] font-bold">{controls.passed} / {controls.total} correct decisions</h2></div><code className="font-mono text-[12px] text-dim">python evals/controls_suite.py</code></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[13px]"><thead className="bg-panel-2 text-muted"><tr><th className="px-6 py-2 font-medium">Case</th><th className="font-medium">Category</th><th className="font-medium">Expected</th><th className="font-medium">Got</th><th className="pr-6 font-medium">Reason</th></tr></thead>
            <tbody>{controls.results.map((r) => <tr key={r.id} className="border-t border-line align-top"><td className="px-6 py-2 font-mono"><span className={r.pass ? "text-ok" : "text-coral"}>{r.pass ? "✓" : "✗"}</span> {r.id}</td><td className="py-2 text-muted">{r.category}</td><td className="py-2 font-mono text-[12px]">{r.expected}</td><td className="py-2 font-mono text-[12px]">{r.got}</td><td className="py-2 pr-6 text-muted">{r.reason}</td></tr>)}</tbody></table></div>
        </section>
        <section className="panel p-6"><p className="eyebrow">Reading eval · Claude</p>
          {run ? <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">{Object.entries(run.metrics as Record<string, number>).map(([k, v]) => <div key={k} className="bg-panel p-4"><div className="text-[24px] font-bold">{v}</div><div className="text-[12px] text-muted">{LABEL[k] ?? k}</div></div>)}</div>
            : <><h2 className="mt-1 text-[22px] font-bold">Awaiting first run</h2><p className="mt-2 text-[14.5px] text-muted">Needs a Claude API key: <code className="rounded bg-panel-2 px-1.5 font-mono text-[12.5px]">python evals/run.py</code>. It scores nine header fields, every line item, the decision and the action taken for each document. No numbers are shown until they are measured.</p></>}
        </section>
        <section className="panel p-6"><p className="eyebrow">Unit tests · pytest</p><h2 className="mt-1 text-[22px] font-bold">{rules.passed} / {rules.total} passing</h2><ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{rules.tests.map((t) => <li key={t.name} className="flex gap-2 text-[13px]"><span className={t.pass ? "text-ok" : "text-coral"}>{t.pass ? "✓" : "✗"}</span><span className="text-muted">{t.name}</span></li>)}</ul></section>
      </div></main>
      <Footer />
    </>
  );
}
