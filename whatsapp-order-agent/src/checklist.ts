// Go-live checklist: one click in the admin panel checks that every setting really works,
// by asking Claude and Meta (not just "is the variable set").

import Anthropic from "@anthropic-ai/sdk";
import { listBackups } from "./backup.js";
import { config } from "./config.js";
import type { Engine } from "./engine.js";
import type { LoadedVendor, VendorRegistry } from "./vendors.js";

export type CheckStatus = "ok" | "warn" | "fail";
export interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface Probes {
  /** Resolves when the Claude key works for the configured model. */
  claude(): Promise<string>;
  /** Phone number details from Meta for this vendor's token and phone number id. */
  meta(vendor: LoadedVendor): Promise<{ display: string; name: string; quality: string }>;
}

export const realProbes: Probes = {
  async claude() {
    const client = new Anthropic({ maxRetries: 1, timeout: 10_000 });
    const m = await client.models.retrieve(config.model);
    return m.display_name ?? m.id;
  },
  async meta(vendor) {
    const token = process.env[vendor.whatsapp.accessTokenEnv];
    if (!token) throw new Error(`${vendor.whatsapp.accessTokenEnv} is not set`);
    const url = `https://graph.facebook.com/${config.graphApiVersion}/${vendor.whatsapp.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    return {
      display: String(body.display_phone_number ?? "?"),
      name: String(body.verified_name ?? "?"),
      quality: String(body.quality_rating ?? "UNKNOWN"),
    };
  },
};

const digits = (s: string) => s.replace(/\D/g, "");

async function vendorChecks(v: LoadedVendor, engine: Engine, probes: Probes, now: number): Promise<Check[]> {
  const out: Check[] = [];
  const add = (name: string, status: CheckStatus, detail: string) => out.push({ name: `${v.name}: ${name}`, status, detail });

  if (v.whatsapp.phoneNumberId.startsWith("REPLACE")) {
    add("WhatsApp number", "fail", "whatsapp.phoneNumberId abhi set nahi (Meta → WhatsApp → API Setup).");
  } else if (!process.env[v.whatsapp.accessTokenEnv]) {
    add("WhatsApp token", "fail", `${v.whatsapp.accessTokenEnv} .env mein nahi hai.`);
  } else {
    try {
      const m = await probes.meta(v);
      const same = !v.whatsapp.displayNumber || digits(v.whatsapp.displayNumber) === digits(m.display);
      add(
        "WhatsApp number",
        same ? (m.quality === "RED" ? "warn" : "ok") : "warn",
        `Meta: ${m.display} (${m.name}), quality ${m.quality}` +
          (same ? "" : ` — vendor file ka displayNumber (${v.whatsapp.displayNumber}) is se alag hai; menu page ghalat number pe bhejega.`),
      );
    } catch (err) {
      add("WhatsApp number", "fail", `Meta ne token/number qabool nahi kiya: ${(err as Error).message}`);
    }
  }

  add("Kitchen screen key", process.env[v.opsKeyEnv] ? "ok" : "fail", process.env[v.opsKeyEnv] ? "set" : `${v.opsKeyEnv} .env mein nahi hai.`);
  if (v.ownerKeyEnv) {
    add("Owner portal key", process.env[v.ownerKeyEnv] ? "ok" : "warn", process.env[v.ownerKeyEnv] ? `${config.publicUrl}/o/${v.slug}?key=…` : `${v.ownerKeyEnv} .env mein nahi: owner khud menu nahi badal sakega.`);
  }
  if (v.riderKeyEnv) {
    add("Rider page key", process.env[v.riderKeyEnv] ? "ok" : "fail", process.env[v.riderKeyEnv] ? `${v.riders.length} rider(s)` : `${v.riderKeyEnv} .env mein nahi hai.`);
  }
  add("Owner number", v.owners.length ? "ok" : "warn", v.owners.length ? `${v.owners.length} owner(s)` : "owners khaali: #report jaise commands kaam nahi karenge.");
  add(
    "Menu page",
    v.whatsapp.displayNumber && config.publicUrl.startsWith("https://") ? "ok" : "warn",
    v.whatsapp.displayNumber ? (config.publicUrl.startsWith("https://") ? `${config.publicUrl}/m/${v.slug}` : "PUBLIC_URL https nahi") : "whatsapp.displayNumber set nahi",
  );
  if (v.dailyReport.enabled) add("Raat ki report", "warn", "Template Meta mein approved hona chahiye: admin mein 'Owner report test bhejo' se check karein.");
  add("Billing", v.billing ? "ok" : "warn", v.billing ? `${v.billing.plan}, ${v.currency} ${v.billing.monthlyFee}/mahina` : "billing set nahi: invoice nahi banega.");

  const last = engine.lastInbound.get(v.slug);
  add(
    "Webhook (message aaya?)",
    last ? "ok" : "warn",
    last
      ? `Aakhri customer message ${Math.round((now - last) / 60_000)} min pehle`
      : "Server start hone ke baad abhi koi message nahi aaya. Apne phone se shop ke number pe 'salam' bhej kar dobara check karein.",
  );
  return out;
}

export async function runChecklist(vendors: VendorRegistry, engine: Engine, probes: Probes = realProbes, now = Date.now()): Promise<Check[]> {
  const out: Check[] = [];
  const add = (name: string, status: CheckStatus, detail: string) => out.push({ name, status, detail });

  if (!process.env.ANTHROPIC_API_KEY) add("Claude API key", "fail", "ANTHROPIC_API_KEY .env mein nahi hai.");
  else {
    try {
      add("Claude API key", "ok", `Model chal raha hai: ${await probes.claude()}`);
    } catch (err) {
      add("Claude API key", "fail", `Claude ne key qabool nahi ki: ${(err as Error).message}`);
    }
  }
  add("HTTPS address", config.publicUrl.startsWith("https://") ? "ok" : "fail", config.publicUrl.startsWith("https://") ? config.publicUrl : `PUBLIC_URL (${config.publicUrl}) https nahi. Meta webhook aur tracking links ke liye https zaroori hai.`);
  add("Webhook verify token", config.webhookVerifyToken ? "ok" : "fail", config.webhookVerifyToken ? "set" : "WHATSAPP_VERIFY_TOKEN nahi");
  add("Meta App Secret", config.metaAppSecrets.length ? "ok" : "fail", config.metaAppSecrets.length ? `${config.metaAppSecrets.length} secret(s)` : "META_APP_SECRET nahi: webhook messages reject honge.");
  const latest = listBackups()[0];
  add(
    "Backup",
    latest && now - latest.at < 2 * 86_400_000 ? "ok" : "warn",
    latest ? `Aakhri: ${latest.name}` : "Abhi koi backup nahi. Admin → Backups → 'Backup abhi lo'.",
  );
  add("Spam limit", config.customerMessagesPerHour > 0 ? "ok" : "warn", config.customerMessagesPerHour > 0 ? `${config.customerMessagesPerHour} messages / customer / ghanta` : "band hai");

  const all = vendors.all();
  if (all.length === 0) add("Vendors", "fail", "vendors/ folder mein koi vendor nahi.");
  for (const v of all) out.push(...(await vendorChecks(v, engine, probes, now)));
  return out;
}
