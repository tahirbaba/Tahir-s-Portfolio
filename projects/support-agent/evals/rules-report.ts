/**
 * Runs the deterministic business-rule tests (no model calls) and writes
 * evals/results/rules.json for the dashboard.  Run: npm run rules:report
 */
import { run } from "node:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const files = ["rules.test.ts", "agent-loop.test.ts"].map((f) => fileURLToPath(new URL(`../tests/${f}`, import.meta.url)));
const tests: { name: string; pass: boolean; ms: number }[] = [];

const stream = run({ files, concurrency: false });
stream.on("test:pass", (d) => { if (d.nesting === 0) tests.push({ name: d.name, pass: true, ms: +(d.details.duration_ms ?? 0).toFixed(2) }); });
stream.on("test:fail", (d) => { if (d.nesting === 0) tests.push({ name: d.name, pass: false, ms: +(d.details.duration_ms ?? 0).toFixed(2) }); });
stream.on("end", () => {
  const out = { runAt: new Date().toISOString(), total: tests.length, passed: tests.filter((t) => t.pass).length, tests };
  mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
  writeFileSync(new URL("./results/rules.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log(`${out.passed}/${out.total} rule tests passed`);
  if (out.passed !== out.total) process.exitCode = 1;
});
stream.resume();
