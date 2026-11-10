// Admin panel for you (the system owner): list, edit and add vendors from the browser.
// Link: https://<server>/admin?key=<ADMIN_KEY>. Changes are saved to vendors/<slug>.json and apply at once.

import { timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { buildSystemPrompt } from "../agent/prompt.js";
import { config } from "../config.js";
import { waNumber } from "../menu/routes.js";
import { parseVendor, type LoadedVendor, type VendorRegistry } from "../vendors.js";
import type { Store } from "../db.js";
import type { Engine } from "../engine.js";
import { sendReport } from "../scheduler.js";
import { currentMonth, usageSummary } from "../usage.js";
import { adminPage } from "./page.js";

function allowed(req: FastifyRequest): boolean {
  const given = (req.headers["x-admin-key"] as string | undefined) ?? (req.query as { key?: string }).key;
  if (!config.adminKey || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(config.adminKey);
  return a.length === b.length && timingSafeEqual(a, b);
}

function summary(v: LoadedVendor) {
  const env = (name: string) => Boolean(process.env[name]);
  return {
    slug: v.slug,
    name: v.name,
    branches: v.branches.length,
    menuItems: v.menu.length,
    phoneNumberId: v.whatsapp.phoneNumberId,
    phoneReady: !v.whatsapp.phoneNumberId.startsWith("REPLACE"),
    tokenEnv: v.whatsapp.accessTokenEnv,
    tokenSet: env(v.whatsapp.accessTokenEnv),
    opsKeyEnv: v.opsKeyEnv,
    opsKeySet: env(v.opsKeyEnv),
    owners: v.owners.length,
    riders: v.riders.length,
    dailyReport: v.dailyReport.enabled ? `${v.dailyReport.time} (${v.dailyReport.template})` : null,
    opsUrl: `${config.publicUrl}/ops/${v.slug}?key=…`,
    menuUrl: waNumber(v) ? `${config.publicUrl}/m/${v.slug}` : null,
    promptTokens: Math.round(buildSystemPrompt(v).length / 4),
  };
}

/** Starting point for a new vendor. */
export function vendorTemplate(slug: string) {
  const env = slug.toUpperCase().replace(/-/g, "_");
  const day = { open: "12:00", close: "01:00" };
  return {
    slug,
    name: "New Shop",
    orderPrefix: "NS",
    currency: "PKR",
    whatsapp: { phoneNumberId: "REPLACE_WITH_PHONE_NUMBER_ID", accessTokenEnv: `WA_TOKEN_${env}`, displayNumber: "+92 300 0000000" },
    opsKeyEnv: `OPS_KEY_${env}`,
    owners: [],
    branches: [
      {
        id: "main",
        name: "Main Branch",
        address: "Shop address, Karachi",
        lat: 24.9172,
        lng: 67.0968,
        hours: { mon: day, tue: day, wed: day, thu: day, fri: { open: "14:00", close: "01:00" }, sat: day, sun: day },
        delivery: { rule: { type: "flat", fee: 100 }, maxKm: 5, minOrder: 500 },
        pickup: true,
        prepMinutes: 20,
      },
    ],
    menu: [{ id: "sample-item", name: "Sample Item", category: "Main", price: 500 }],
    payment: { cod: true },
    faq: [],
    notifyLanguage: "roman_urdu",
  };
}

export function registerAdminRoutes(app: FastifyInstance, deps: { vendors: VendorRegistry; store: Store; engine: Engine }) {
  const { vendors, store, engine } = deps;
  const fileOf = (slug: string) => path.join(config.vendorsDir, `${slug}.json`);

  function guard(req: FastifyRequest, reply: FastifyReply): boolean {
    if (allowed(req)) return true;
    void reply.code(404).send({ error: "not found" });
    return false;
  }

  /** Validates JSON text; on success returns the parsed vendor. */
  function check(text: string, slug: string): { ok: true; vendor: LoadedVendor } | { ok: false; error: string } {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (err) {
      return { ok: false, error: `JSON format galat hai: ${(err as Error).message}` };
    }
    try {
      const v = parseVendor(raw, `${slug}.json`);
      if (v.slug !== slug) return { ok: false, error: `"slug" ("${v.slug}") file ke naam ("${slug}") jaisa hona chahiye.` };
      const other = vendors.byPhoneNumberId(v.whatsapp.phoneNumberId);
      if (other && other.slug !== slug) return { ok: false, error: `phoneNumberId pehle se "${other.slug}" ka hai.` };
      const prefixClash = vendors.all().find((x) => x.slug !== slug && x.orderPrefix === v.orderPrefix);
      if (prefixClash) return { ok: false, error: `orderPrefix "${v.orderPrefix}" pehle se "${prefixClash.slug}" use kar raha hai.` };
      return { ok: true, vendor: v };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  app.get("/admin", async (req, reply) => {
    if (!guard(req, reply)) return;
    reply.header("Cache-Control", "no-store").header("Referrer-Policy", "no-referrer").type("text/html");
    return adminPage();
  });

  app.get("/admin/api/vendors", async (req, reply) => {
    if (!guard(req, reply)) return;
    return { vendors: vendors.all().map(summary) };
  });

  app.get("/admin/api/usage", async (req, reply) => {
    if (!guard(req, reply)) return;
    const month = (req.query as { month?: string }).month ?? currentMonth();
    try {
      return { month, vendors: vendors.all().map((v) => usageSummary(store, v, month)) };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  /** Sends the nightly report template right now, to check that the template is approved and works. */
  app.post("/admin/api/vendors/:slug/report-test", async (req, reply) => {
    if (!guard(req, reply)) return;
    const vendor = vendors.get((req.params as { slug: string }).slug);
    if (!vendor) return reply.code(404).send({ error: "vendor not found" });
    if (vendor.owners.length === 0) return reply.code(400).send({ error: "Vendor file mein owners number nahi hai." });
    const sent = await sendReport(engine, store, vendor, Date.now());
    if (sent === 0) return reply.code(502).send({ error: "Meta ne template nahi bheja. Template ka naam/language aur approval check karein (server logs)." });
    return { ok: true, sent };
  });

  app.get("/admin/api/vendors/:slug", async (req, reply) => {
    if (!guard(req, reply)) return;
    const slug = (req.params as { slug: string }).slug;
    if (!/^[a-z0-9-]+$/.test(slug)) return reply.code(400).send({ error: "bad slug" });
    const file = fileOf(slug);
    if (existsSync(file)) return { exists: true, json: readFileSync(file, "utf8") };
    return { exists: false, json: JSON.stringify(vendorTemplate(slug), null, 2) };
  });

  app.post("/admin/api/vendors/:slug/validate", async (req, reply) => {
    if (!guard(req, reply)) return;
    const slug = (req.params as { slug: string }).slug;
    const r = check(String((req.body as { json?: unknown })?.json ?? ""), slug);
    if (!r.ok) return reply.code(400).send({ error: r.error });
    return { ok: true, summary: summary(r.vendor) };
  });

  app.put("/admin/api/vendors/:slug", async (req, reply) => {
    if (!guard(req, reply)) return;
    const slug = (req.params as { slug: string }).slug;
    if (!/^[a-z0-9-]+$/.test(slug)) return reply.code(400).send({ error: "bad slug" });
    const r = check(String((req.body as { json?: unknown })?.json ?? ""), slug);
    if (!r.ok) return reply.code(400).send({ error: r.error });
    const file = fileOf(slug);
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(JSON.parse(String((req.body as { json: string }).json)), null, 2) + "\n");
    renameSync(tmp, file); // atomic: never a half-written file
    vendors.upsert(r.vendor);
    req.log.info({ slug }, "vendor saved from admin panel");
    return { ok: true, summary: summary(r.vendor) };
  });
}
