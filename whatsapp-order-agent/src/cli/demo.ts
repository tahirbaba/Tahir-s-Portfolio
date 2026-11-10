// npm run demo  ->  every screen filled with demo data, no Claude key, no Meta, nothing sent anywhere.
//
// Uses its own copies (data/demo/), so your real vendor files and database are never touched.
// Each run starts fresh.

import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { backupNow } from "../backup.js";
import { config } from "../config.js";
import { Store } from "../db.js";
import { DemoLLM, seedDemo } from "../demo.js";
import { Engine } from "../engine.js";
import { buildServer } from "../server.js";
import { VendorRegistry, type Vendor } from "../vendors.js";
import type { WhatsAppSender } from "../whatsapp/client.js";

const port = Number(process.env.PORT ?? 3000);
const base = `http://localhost:${port}`;
const root = path.resolve("data/demo");

rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
cpSync(config.vendorsDir, path.join(root, "vendors"), {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}.history`),
});

// Settings for the demo only (the real .env is not read).
const cfg = config as { vendorsDir: string; dbPath: string; adminKey: string; publicUrl: string; backup: { dir: string } };
cfg.vendorsDir = path.join(root, "vendors");
cfg.dbPath = path.join(root, "demo.db");
cfg.backup.dir = path.join(root, "backups");
cfg.adminKey = "admin123";
cfg.publicUrl = base;
const keys: Record<string, string> = {
  OPS_KEY_DEMO_PIZZA: "kitchen123",
  OPS_KEY_DEMO_FASTFOOD: "kitchen123",
  OWNER_KEY_DEMO_PIZZA: "owner123",
  OWNER_KEY_DEMO_FASTFOOD: "owner123",
  RIDER_KEY_DEMO_PIZZA: "rider123",
};
Object.assign(process.env, keys);

const vendors = VendorRegistry.fromDir(cfg.vendorsDir);
const store = new Store(cfg.dbPath);
const seed = seedDemo(store, vendors);
backupNow(store);

/** Messages that would go to customers on WhatsApp are printed here instead. */
const terminalWhatsApp: WhatsAppSender = {
  async sendText(v: Vendor, to: string, text: string) {
    console.log(`\n\x1b[32m📱 WhatsApp (${v.name} → +${to})\x1b[0m\n${text}\n`);
  },
  async sendTemplate(v: Vendor, to: string, template: string, _lang: string, params: string[]) {
    console.log(`\n\x1b[35m📱 Template ${template} (${v.name} → +${to})\x1b[0m ${params.join(" | ")}\n`);
  },
  async markRead() {},
  async downloadMedia() {
    throw new Error("demo");
  },
};

const engine = new Engine({ store, vendors, llm: new DemoLLM(), wa: terminalWhatsApp, log: { info() {}, warn: console.warn, error: console.error } });
const app = buildServer({ store, vendors, engine, logger: false });
await app.listen({ port, host: "127.0.0.1" });

const track = seed.trackingTokens.find((t) => t.number === "CC-1005") ?? seed.trackingTokens[0]!;
console.log(`
\x1b[1m🍕 Demo chal raha hai (Claude key ke baghair). Ye links browser mein kholein:\x1b[0m

  Owner portal (menu/timing edit)   ${base}/o/demo-pizza?key=owner123
  Kitchen screen                    ${base}/ops/demo-pizza?key=kitchen123
  Rider page (naam chunein: Imran)  ${base}/r/demo-pizza?key=rider123
  Customer tracking (rider raste)   ${base}/t/${track.token}
  Menu page (customer)              ${base}/m/demo-pizza
  Admin panel                       ${base}/admin?key=admin123

  Doosri shop: /o/demo-fastfood, /ops/demo-fastfood, /m/demo-fastfood (same keys)

\x1b[1mKya try karein:\x1b[0m
  • Kitchen: naye order pe "Accept 15m" → "Tayyar ho gaya" → rider chun kar "Rider nikal gaya"
    (customer ko jaane wala WhatsApp message isi terminal mein dikhega)
  • Rider page: Imran chunein → "Main le ja raha hoon" → "Deliver ho gaya" + cash
  • Owner portal: koi price badal kar Save → menu page refresh karein, nayi price dikhegi
  • Admin: Billing → Invoice, Chats, Backups, "Check chalao" (Claude/Meta ❌ aana sahi hai)

\x1b[2mDemo data: ${path.relative(process.cwd(), root)}/ (har dafa naya; asal files ko haath nahi lagta). Band karne ke liye Ctrl+C.\x1b[0m
`);
