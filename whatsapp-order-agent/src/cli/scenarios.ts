// npm run scenarios                 run all AI scenario tests with your Claude key
// npm run scenarios -- price closed  run only these ids
// npm run scenarios -- --verbose     also print every conversation
// npm run scenarios -- --list        list scenarios without calling the AI

import { readFileSync } from "node:fs";
import path from "node:path";
import { AnthropicLLM } from "../agent/llm.js";
import { config } from "../config.js";
import { SCENARIOS, runScenario } from "../scenarios.js";
import { parseVendor, VendorRegistry } from "../vendors.js";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const only = args.filter((a) => !a.startsWith("--"));
const chosen = SCENARIOS.filter((s) => only.length === 0 || only.includes(s.id));

if (args.includes("--list")) {
  for (const s of SCENARIOS) console.log(`${s.id.padEnd(16)} ${s.vendor.padEnd(14)} ${s.title}`);
  process.exit(0);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY .env mein daalein. (--list bina key ke chalta hai.)");
  process.exit(1);
}
if (chosen.length === 0) {
  console.error(`Koi scenario nahi mila. Ids: ${SCENARIOS.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

// Demo vendors with stand-in phone ids (nothing is sent to WhatsApp).
const vendors = new VendorRegistry(
  ["demo-pizza", "demo-fastfood"].map((slug, i) => {
    const raw = JSON.parse(readFileSync(path.join(config.vendorsDir, `${slug}.json`), "utf8"));
    raw.whatsapp.phoneNumberId = `scenario-${i}`;
    return parseVendor(raw, slug);
  }),
);

const llm = new AnthropicLLM();
let passed = 0;
let usd = 0;
console.log(`Model: ${config.model} (effort ${config.effort}) · ${chosen.length} scenario(s)\n`);

for (const sc of chosen) {
  process.stdout.write(`… ${sc.title}`);
  try {
    const r = await runScenario(llm, vendors, sc);
    usd += r.usd;
    if (r.pass) passed++;
    process.stdout.write(`\r${r.pass ? "✅ PASS" : "❌ FAIL"}  ${sc.id.padEnd(15)} ${sc.title}${r.order ? `  [${r.order.number}, PKR ${r.order.total}]` : ""}\n`);
    for (const f of r.failures) console.log(`         - ${f}`);
    if (verbose || !r.pass) {
      for (const l of r.transcript) {
        if (l.who === "customer") console.log(`         👤 ${l.text}`);
        else if (l.who === "bot") console.log(`         🤖 ${l.text.replace(/\n/g, "\n            ")}`);
        else if (l.who === "tool") console.log(`         🔧 ${l.name} ${l.input}`);
        else console.log(`         ↳ ${l.text.slice(0, 160)}`);
      }
      console.log();
    }
  } catch (err) {
    process.stdout.write(`\r💥 ERROR ${sc.id}: ${(err as Error).message}\n`);
  }
}

const pkr = Math.round(usd * config.rates.usdToPkr * 100) / 100;
console.log(`\n${passed}/${chosen.length} pass · AI kharcha ~$${usd.toFixed(4)} (~PKR ${pkr})`);
process.exit(passed === chosen.length ? 0 : 1);
