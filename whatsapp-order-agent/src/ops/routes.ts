// Kitchen / rider / owner screen. A web page on any phone: no app, no WhatsApp cost.
// Link: https://<server>/ops/<vendor-slug>?key=<secret>

import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { lineLabel } from "../cart.js";
import { OPEN_STATUSES, type Order, type OrderStatus, type Store } from "../db.js";
import type { Engine } from "../engine.js";
import { changeStatus, setPayment } from "../orders.js";
import type { LoadedVendor, VendorRegistry } from "../vendors.js";
import { opsPage } from "./page.js";

const PKT_OFFSET_MS = 5 * 60 * 60_000;

function startOfTodayPkt(now = Date.now()): number {
  const local = now + PKT_OFFSET_MS;
  return local - (local % 86_400_000) - PKT_OFFSET_MS;
}

function keyMatches(vendor: LoadedVendor, given: string | undefined): boolean {
  const expected = process.env[vendor.opsKeyEnv];
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function view(vendor: LoadedVendor, o: Order) {
  const branch = vendor.branches.find((b) => b.id === o.branchId);
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    fulfilment: o.fulfilment,
    branch: branch?.name ?? o.branchId,
    customer: o.customer,
    customerName: o.customerName,
    items: o.items.map(lineLabel),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    paymentNote: o.paymentNote,
    mapUrl: o.location ? `https://maps.google.com/?q=${o.location.lat},${o.location.lng}` : null,
    addressNote: o.addressNote,
    etaMin: o.etaMin,
    etaMax: o.etaMax,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export function registerOpsRoutes(app: FastifyInstance, deps: { store: Store; vendors: VendorRegistry; engine: Engine }) {
  const { store, vendors, engine } = deps;

  function auth(req: FastifyRequest, reply: FastifyReply): LoadedVendor | null {
    const { slug } = req.params as { slug: string };
    const vendor = vendors.get(slug);
    const key = (req.headers["x-ops-key"] as string | undefined) ?? (req.query as { key?: string }).key;
    if (!vendor || !keyMatches(vendor, key)) {
      void reply.code(404).send({ error: "not found" });
      return null;
    }
    return vendor;
  }

  app.get("/ops/:slug", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    reply.header("Cache-Control", "no-store").header("Referrer-Policy", "no-referrer").type("text/html");
    return opsPage(vendor.name);
  });

  app.get("/ops/:slug/api/state", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const today = startOfTodayPkt();
    const open = store.ordersByStatus(vendor.slug, OPEN_STATUSES);
    const done = store
      .ordersByStatus(vendor.slug, ["delivered", "picked_up", "rejected"], today)
      .slice(-15)
      .reverse();
    const handoffs = store.humanModeSessions(vendor.slug).map((s) => ({
      sessionId: s.id,
      customer: s.customer,
      customerName: s.customerName,
      reason: s.handoffReason,
      lastAt: s.lastAt,
    }));
    reply.header("Cache-Control", "no-store");
    return {
      now: Date.now(),
      open: open.map((o) => view(vendor, o)),
      done: done.map((o) => view(vendor, o)),
      handoffs,
      today: store.dailyStats(vendor.slug, today),
    };
  });

  app.post("/ops/:slug/api/orders/:id/status", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const id = Number((req.params as { id: string }).id);
    const body = (req.body ?? {}) as { to?: OrderStatus; prepMinutes?: number; riderName?: string; riderPhone?: string };
    const order = store.getOrder(id);
    if (!order || order.vendorSlug !== vendor.slug) return reply.code(404).send({ error: "order not found" });
    try {
      const prep = Number(body.prepMinutes);
      const change = changeStatus(store, vendor, order, body.to as OrderStatus, {
        prepMinutes: Number.isFinite(prep) && prep > 0 && prep <= 180 ? prep : undefined,
        riderName: body.riderName?.toString().slice(0, 40) || undefined,
        riderPhone: body.riderPhone?.toString().replace(/[^\d+]/g, "").slice(0, 16) || undefined,
      });
      if (change.notify) await engine.notifyCustomer(vendor, change.order, change.notify);
      return { ok: true, order: view(vendor, change.order), customerNotified: Boolean(change.notify) };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  app.post("/ops/:slug/api/orders/:id/payment", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const id = Number((req.params as { id: string }).id);
    const status = ((req.body ?? {}) as { status?: string }).status;
    const order = store.getOrder(id);
    if (!order || order.vendorSlug !== vendor.slug) return reply.code(404).send({ error: "order not found" });
    if (status !== "verified" && status !== "not_received") return reply.code(400).send({ error: "bad status" });
    try {
      const change = setPayment(store, vendor, order, status);
      if (change.notify) await engine.notifyCustomer(vendor, change.order, change.notify);
      return { ok: true, order: view(vendor, change.order) };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  app.post("/ops/:slug/api/handoffs/:sessionId/release", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const sessionId = Number((req.params as { sessionId: string }).sessionId);
    if (!engine.releaseToBot(vendor, sessionId)) return reply.code(404).send({ error: "chat not found" });
    return { ok: true };
  });
}
