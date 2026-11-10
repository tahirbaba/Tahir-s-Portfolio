// Owner portal: https://<server>/o/<vendor-slug>?key=<owner key>
// The shop owner edits the menu, timings, delivery charges and payment details from a phone,
// and sees their sales and your invoices. Only safe fields can change: WhatsApp ids, keys,
// billing and limits stay admin-only. Every save keeps the old version (Undo).

import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { invoiceFor } from "../billing.js";
import type { Store } from "../db.js";
import { buildReport } from "../report.js";
import { currentMonth } from "../usage.js";
import { listHistory, readVendorRaw, saveVendorRaw, undoLast } from "../vendorFiles.js";
import type { LoadedVendor, VendorRegistry } from "../vendors.js";
import { portalPage } from "./page.js";

type Raw = Record<string, any>;

function keyOk(vendor: LoadedVendor, given: string | undefined): boolean {
  if (!vendor.ownerKeyEnv || !given) return false;
  const expected = process.env[vendor.ownerKeyEnv];
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const numOrNaN = (v: unknown) => (v === "" || v === null || v === undefined ? NaN : Number(v));

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "item"
  );
}

/** Cleans menu items from the portal: only known fields, ids kept or made from the name. */
export function cleanMenu(input: unknown): Raw[] {
  if (!Array.isArray(input)) throw new Error("menu list nahi hai");
  if (input.length > 300) throw new Error("300 se zyada items nahi ho sakte");
  const used = new Set<string>();
  return input.map((it: Raw) => {
    const name = str(it?.name, 80);
    let id = typeof it?.id === "string" && /^[a-z0-9_-]+$/.test(it.id) ? it.id : slugify(name);
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    used.add(id);
    const item: Raw = { id, name, category: str(it?.category, 40), available: it?.available !== false };
    const desc = str(it?.description, 200);
    if (desc) item.description = desc;
    if (Array.isArray(it?.variants) && it.variants.length > 0) {
      item.variants = it.variants.slice(0, 10).map((v: Raw) => ({ name: str(v?.name, 30), price: numOrNaN(v?.price) }));
    } else {
      item.price = numOrNaN(it?.price);
    }
    return item;
  });
}

/** Merges allowed branch settings into the existing branches (name/address/location stay). */
export function mergeSettings(raw: Raw, body: Raw): Raw {
  const next = structuredClone(raw);
  if (Array.isArray(body.branches)) {
    for (const b of body.branches as Raw[]) {
      const cur = (next.branches as Raw[]).find((x) => x.id === b?.id);
      if (!cur) continue;
      if (b.hours && typeof b.hours === "object") {
        const hours: Raw = {};
        for (const d of ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]) {
          const h = b.hours[d];
          hours[d] = h ? { open: str(h.open, 5), close: str(h.close, 5) } : null;
        }
        cur.hours = hours;
      }
      if (b.delivery && typeof b.delivery === "object") {
        const d = b.delivery as Raw;
        const rule = d.rule ?? {};
        let cleanRule: Raw;
        if (rule.type === "free") cleanRule = { type: "free" };
        else if (rule.type === "flat") cleanRule = { type: "flat", fee: numOrNaN(rule.fee) };
        else if (rule.type === "slabs")
          cleanRule = { type: "slabs", slabs: (Array.isArray(rule.slabs) ? rule.slabs : []).slice(0, 10).map((s: Raw) => ({ upToKm: numOrNaN(s?.upToKm), fee: numOrNaN(s?.fee) })) };
        else if (rule.type === "per_km")
          cleanRule = { type: "per_km", baseFee: numOrNaN(rule.baseFee), perKm: numOrNaN(rule.perKm), includedKm: numOrNaN(rule.includedKm ?? 0) };
        else throw new Error("delivery rule ki type ghalat hai");
        cur.delivery = { rule: cleanRule, maxKm: numOrNaN(d.maxKm), minOrder: numOrNaN(d.minOrder ?? 0) };
        const fa = numOrNaN(d.freeAbove);
        if (Number.isFinite(fa) && fa > 0) cur.delivery.freeAbove = fa;
      }
      if (typeof b.pickup === "boolean") cur.pickup = b.pickup;
      if (b.prepMinutes !== undefined) cur.prepMinutes = Math.round(numOrNaN(b.prepMinutes));
    }
  }
  if (body.payment && typeof body.payment === "object") {
    next.payment = { cod: body.payment.cod !== false };
    const online = str(body.payment.online, 200);
    if (online) next.payment.online = online;
  }
  if (Array.isArray(body.faq)) next.faq = body.faq.map((f: unknown) => str(f, 300)).filter(Boolean).slice(0, 40);
  if (body.upsell !== undefined) {
    const u = str(body.upsell, 200);
    if (u) next.upsell = u;
    else delete next.upsell;
  }
  return next;
}

/** "menu.3.price: ..." -> "\"Garlic Bread\" price: ..." so the owner understands which item is wrong. */
export function friendlyError(error: string, raw: Raw): string {
  return error
    .replace(/^Invalid [^:]*:\n?/, "")
    .replace(/menu\.(\d+)\.?/g, (_m, i) => `"${(raw.menu as Raw[])?.[Number(i)]?.name || `item ${Number(i) + 1}`}" `)
    .replace(/branches\.(\d+)\.?/g, (_m, i) => `${(raw.branches as Raw[])?.[Number(i)]?.name ?? `branch ${Number(i) + 1}`}: `)
    .replace(/variants\.(\d+)\.?/g, (_m, i) => `size ${Number(i) + 1} `)
    .replace(/Invalid input: expected number, received NaN/g, "yahan number likhna zaroori hai")
    .replace(/Too small: expected string to have >=1 characters?/g, "khaali nahi chhod sakte")
    .replace(/Too small: expected number to be >=?0/g, "minus mein nahi ho sakta")
    .replace(/use HH:MM \(24h\)/g, "waqt ghalat hai (jaise 13:30)")
    .replace(/^\s*- /gm, "")
    .trim();
}

export function registerPortalRoutes(app: FastifyInstance, deps: { store: Store; vendors: VendorRegistry }) {
  const { store, vendors } = deps;

  function auth(req: FastifyRequest, reply: FastifyReply): LoadedVendor | null {
    const vendor = vendors.get((req.params as { slug: string }).slug);
    const key = (req.headers["x-owner-key"] as string | undefined) ?? (req.query as { key?: string }).key;
    if (!vendor || !keyOk(vendor, key)) {
      void reply.code(404).send({ error: "not found" });
      return null;
    }
    return vendor;
  }

  function months(n: number): string[] {
    const out: string[] = [];
    let [y, m] = currentMonth().split("-").map(Number) as [number, number];
    for (let i = 0; i < n; i++) {
      out.push(`${y}-${String(m).padStart(2, "0")}`);
      m--;
      if (m === 0) {
        m = 12;
        y--;
      }
    }
    return out;
  }

  function data(vendor: LoadedVendor) {
    const raw = readVendorRaw(vendor.slug) ?? {};
    return {
      name: vendor.name,
      currency: vendor.currency,
      menu: raw.menu ?? [],
      branches: ((raw.branches as Raw[]) ?? []).map((b) => ({
        id: b.id, name: b.name, address: b.address, hours: b.hours, delivery: b.delivery, pickup: b.pickup ?? true, prepMinutes: b.prepMinutes ?? 20,
      })),
      payment: raw.payment ?? { cod: true },
      faq: raw.faq ?? [],
      upsell: raw.upsell ?? "",
      today: buildReport(store, vendor, "today"),
      week: buildReport(store, vendor, "week"),
      invoices: months(3).map((m) => invoiceFor(store, vendor, m)).filter(Boolean),
      history: listHistory(vendor.slug).slice(0, 15).map((h) => ({ at: h.at, by: h.by })),
    };
  }

  app.get("/o/:slug", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    reply.header("Cache-Control", "no-store").header("Referrer-Policy", "no-referrer").type("text/html");
    return portalPage(vendor.name);
  });

  app.get("/o/:slug/api/data", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    reply.header("Cache-Control", "no-store");
    return data(vendor);
  });

  app.put("/o/:slug/api/menu", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const raw = readVendorRaw(vendor.slug);
    if (!raw) return reply.code(404).send({ error: "vendor file not found" });
    try {
      raw.menu = cleanMenu((req.body as Raw)?.menu);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    const r = saveVendorRaw(raw, vendor.slug, vendors, "owner");
    if (!r.ok) return reply.code(400).send({ error: friendlyError(r.error, raw) });
    req.log.info({ slug: vendor.slug }, "menu saved from owner portal");
    return { ok: true, data: data(r.vendor) };
  });

  app.put("/o/:slug/api/settings", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const raw = readVendorRaw(vendor.slug);
    if (!raw) return reply.code(404).send({ error: "vendor file not found" });
    let next: Raw;
    try {
      next = mergeSettings(raw, (req.body ?? {}) as Raw);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    const r = saveVendorRaw(next, vendor.slug, vendors, "owner");
    if (!r.ok) return reply.code(400).send({ error: friendlyError(r.error, next) });
    req.log.info({ slug: vendor.slug }, "settings saved from owner portal");
    return { ok: true, data: data(r.vendor) };
  });

  app.post("/o/:slug/api/undo", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const r = undoLast(vendor.slug, vendors);
    if (!r.ok) return reply.code(400).send({ error: r.error });
    return { ok: true, data: data(r.vendor) };
  });
}
