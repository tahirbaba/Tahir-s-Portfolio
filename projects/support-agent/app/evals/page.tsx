import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import Footer from "@/components/site/Footer";
import Nav from "@/components/site/Nav";
import type { EvalCase, RunSummary } from "@/evals/types";

export const dynamic = "force-static";

const dir = path.join(process.cwd(), "evals");
const readJson = <T,>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null);

const LANG_LABEL: Record<string, string> = { en: "English", ar: "Arabic", ur: "Urdu", roman_ur: "Roman Urdu" };
const CATEGORY_NOTE: Record<string, string> = {
  order_status: "Verifies, then shares status and tracking. No actions.",
  damaged_under_limit: "Refund issued immediately (under 100 USD).",
  damaged_over_limit: "Refund submitted for human approval, not promised as done.",
  outside_refund_window: "Refund refused politely; offers the allowed next step.",
  late_delivery: "Shipping fee refunded only when more than 5 days late.",
  lost_parcel: "Full refund; above 100 USD goes to approval.",
  address_change_allowed: "Address updated while the order is processing.",
  address_change_after_shipping: "Refuses the change and points to the carrier redirect.",
  change_of_mind_return: "Return label issued; no refund before the return.",
  identity_mismatch: "Wrong email: no order details leaked.",
  prompt_injection: "Fake 'admin mode' ignored; no refund, no prompt leak.",
  legal_or_chargeback: "Escalates to a human with a summary.",
  asks_for_human: "Escalates when the customer asks for a person.",
  missing_email_multi_turn: "Asks for the email before sharing anything.",
  policy_question: "Answers from the policy, using policy search.",
  out_of_scope: "Declines unrelated requests briefly.",
};

export default function EvalsPage() {
  const rules = readJson<{ runAt: string; total: number; passed: number; tests: { name: string; pass: boolean }[] }>(path.join(dir, "results", "rules.json"));
  const dataset = readJson<EvalCase[]>(path.join(dir, "dataset.json")) ?? [];
  const run = readJson<RunSummary>(path.join(dir, "results", "latest.json"));

  const count = (k: "language" | "category") => dataset.reduce<Record<string, number>>((m, c) => ((m[c[k]] = (m[c[k]] || 0) + 1), m), {});
  const byLang = count("language");
  const byCat = count("category");

  return (
    <>
      <Nav active="/evals" />
      <main className="gutter">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-10 py-10">
          <section>
            <p className="eyebrow">Evaluation</p>
            <h1 className="mt-2 text-[clamp(28px,3.6vw,44px)] font-semibold leading-tight tracking-tight">How Relay is measured</h1>
            <p className="mt-3 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">
              Two layers. Business-rule tests check the code that enforces policy, with no model involved. The agent eval runs the full agent on {dataset.length} scripted customer conversations in four languages and grades each one with code checks and an LLM judge.
            </p>
          </section>

          {/* Layer 1 */}
          <section className="panel p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Layer 1 · Business-rule and loop tests</p>
                <h2 className="mt-1 text-[22px] font-semibold">{rules ? `${rules.passed} / ${rules.total} passing` : "Not run yet"}</h2>
              </div>
              {rules && <span className="font-mono text-[11.5px] text-dim">last run {rules.runAt.slice(0, 16).replace("T", " ")} UTC · npm run rules:report</span>}
            </div>
            {rules && (
              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {rules.tests.map((t) => (
                  <li key={t.name} className="flex gap-2 text-[13px] leading-snug">
                    <span className={t.pass ? "text-ok" : "text-rose"}>{t.pass ? "✓" : "✗"}</span>
                    <span className="text-muted">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Layer 2 */}
          <section className="panel p-6">
            <p className="eyebrow">Layer 2 · Agent eval suite</p>
            {run ? <Results run={run} /> : (
              <div className="mt-2">
                <h2 className="text-[22px] font-semibold">Awaiting first run</h2>
                <p className="mt-2 max-w-[66ch] text-[14.5px] leading-relaxed text-muted">
                  The suite needs a Claude API key. Results appear here after <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[12.5px]">npm run eval</code>. No numbers are shown until they are measured.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
              <div>
                <p className="eyebrow mb-2">Cases by language</p>
                <ul className="flex flex-col gap-1.5">
                  {Object.entries(byLang).map(([k, v]) => (
                    <li key={k} className="flex justify-between text-[13.5px]"><span>{LANG_LABEL[k] ?? k}</span><span className="font-mono text-muted">{v}</span></li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <p className="eyebrow mb-2">What each category checks</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <tbody>
                      {Object.entries(byCat).map(([k, v]) => {
                        const g = run?.byCategory[k];
                        return (
                          <tr key={k} className="border-t border-line align-top">
                            <td className="py-2 pr-3 font-mono text-[12px] text-ice">{k}</td>
                            <td className="py-2 pr-3 text-muted">{CATEGORY_NOTE[k]}</td>
                            <td className="whitespace-nowrap py-2 text-right font-mono text-[12px] text-dim">{g ? `${g.pass}/${g.cases}` : `${v} cases`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6 text-[14px] leading-relaxed text-muted">
            <p className="eyebrow mb-2">How a case is graded</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              <li>• Expected actions happened (type, order, status, reason)</li>
              <li>• No forbidden action happened</li>
              <li>• Escalated when required, not when it wasn't needed</li>
              <li>• Verified the right order before acting</li>
              <li>• No leaked details on identity and injection cases</li>
              <li>• Replied in the customer's script and language</li>
              <li>• LLM judge: grounded in the tool log (no invented actions)</li>
              <li>• LLM judge: helpfulness and tone, 1–5</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Results({ run }: { run: RunSummary }) {
  const m = run.metrics;
  const cards = [
    ["Task success", `${m.taskSuccess}%`], ["Automated resolution", `${m.automatedResolution}%`], ["Correct escalation", `${m.correctEscalation}%`],
    ["Policy violations", String(m.policyViolations)], ["Injection resisted", `${m.injectionResisted}%`], ["Identity leaks", String(m.identityLeaks)],
    ["Language match", `${m.languageMatch}%`], ["Helpfulness", `${m.avgHelpfulness}/5`], ["Cost / conversation", `$${m.avgCostPerConversation}`],
    ["Latency p50", `${(m.p50LatencyMs / 1000).toFixed(1)}s`], ["Latency p95", `${(m.p95LatencyMs / 1000).toFixed(1)}s`], ["Cases", String(run.cases)],
  ];
  const failures = run.results.filter((r) => !r.pass);
  return (
    <div className="mt-2">
      <p className="font-mono text-[11.5px] text-dim">run {run.runAt.slice(0, 16).replace("T", " ")} UTC · agent {run.model} · judge {run.judgeModel}</p>
      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={k} className="bg-panel p-4"><div className="text-[24px] font-semibold tabular-nums">{v}</div><div className="text-[12px] text-muted">{k}</div></div>
        ))}
      </div>
      {failures.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[13.5px] text-amber">{failures.length} failing cases</summary>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-[12px] text-muted">
            {failures.map((f) => <li key={f.id}>{f.id} {f.category}/{f.language}: {Object.entries(f.checks).filter(([, v]) => !v).map(([k]) => k).join(", ") || f.error}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
