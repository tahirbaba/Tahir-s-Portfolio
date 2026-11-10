// Starts the server with real WhatsApp + Claude connections.

import { AnthropicLLM } from "./agent/llm.js";
import { config } from "./config.js";
import { Store } from "./db.js";
import { Engine } from "./engine.js";
import { runDailyReports } from "./scheduler.js";
import { buildServer } from "./server.js";
import { HttpTranscriber } from "./stt.js";
import { VendorRegistry } from "./vendors.js";
import { CloudApiSender } from "./whatsapp/client.js";

function requireEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (!config.webhookVerifyToken) missing.push("WHATSAPP_VERIFY_TOKEN");
  if (config.metaAppSecrets.length === 0) missing.push("META_APP_SECRET");
  return missing;
}

async function main() {
  const vendors = VendorRegistry.fromDir(config.vendorsDir);
  const store = new Store(config.dbPath);

  const missing = requireEnv();
  for (const v of vendors.all()) {
    if (!process.env[v.whatsapp.accessTokenEnv]) missing.push(`${v.whatsapp.accessTokenEnv} (WhatsApp token, ${v.slug})`);
    if (!process.env[v.opsKeyEnv]) missing.push(`${v.opsKeyEnv} (kitchen screen key, ${v.slug})`);
    if (v.riderKeyEnv && !process.env[v.riderKeyEnv]) missing.push(`${v.riderKeyEnv} (rider page key, ${v.slug})`);
  }
  if (missing.length) console.warn(`⚠️  Missing settings:\n  - ${missing.join("\n  - ")}\n`);

  const engine = new Engine({
    store,
    vendors,
    llm: new AnthropicLLM(),
    wa: new CloudApiSender(),
    stt: new HttpTranscriber(),
  });
  const app = buildServer({ store, vendors, engine, allowUnsignedWebhooks: process.env.ALLOW_UNSIGNED_WEBHOOKS === "1" });

  // Forget processed message ids after 3 days.
  setInterval(() => store.pruneProcessed(3 * 86_400_000), 3_600_000).unref();

  // Owners' nightly report (only vendors with dailyReport.enabled).
  setInterval(() => {
    runDailyReports(engine, store, vendors)
      .then((sent) => sent.length && console.log(`📊 daily report sent: ${sent.join(", ")}`))
      .catch((err) => console.error("daily report failed", err));
  }, 60_000).unref();

  await app.listen({ port: config.port, host: config.host });
  for (const v of vendors.all()) {
    console.log(`✅ ${v.name}: kitchen screen ${config.publicUrl}/ops/${v.slug}?key=<${v.opsKeyEnv}>`);
  }

  const shutdown = async () => {
    await app.close();
    await engine.idle();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
