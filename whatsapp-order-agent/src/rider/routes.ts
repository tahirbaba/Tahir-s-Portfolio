// Rider page: https://<server>/r/<vendor-slug>?key=<rider key>
// One shared link for the shop's riders. A rider picks their name, takes a ready order
// (customer gets ONE message with the rider's name and number), then marks it delivered and cash received.

import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { lineLabel } from "../cart.js";
import type { Order, Store } from "../db.js";
import type { Engine } from "../engine.js";
import { formatKarachi } from "../hours.js";
import { changeStatus } from "../orders.js";
import { startOfDayPkt } from "../report.js";
import type { LoadedVendor, VendorRegistry } from "../vendors.js";
import { riderPage } from "./page.js";

function keyOk(vendor: LoadedVendor, given: string | undefined): boolean {
  if (!vendor.riderKeyEnv || !given) return false;
  const expected = process.env[vendor.riderKeyEnv];
  if (!expected) return false;
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
    branch: branch?.name ?? o.branchId,
    branchAddress: branch?.address ?? "",
    customer: o.customer,
    customerName: o.customerName,
    items: o.items.map(lineLabel),
    total: o.total,
    collect: o.paymentMethod === "cod" ? o.total : 0,
    paymentStatus: o.paymentStatus,
    mapUrl: o.location ? `https://maps.google.com/?q=${o.location.lat},${o.location.lng}` : null,
    addressNote: o.addressNote,
    scheduledLabel: o.scheduledFor ? formatKarachi(o.scheduledFor) : null,
    riderName: o.riderName,
    readySince: o.updatedAt,
  };
}

export function registerRiderRoutes(app: FastifyInstance, deps: { store: Store; vendors: VendorRegistry; engine: Engine }) {
  const { store, vendors, engine } = deps;

  function auth(req: FastifyRequest, reply: FastifyReply): LoadedVendor | null {
    const vendor = vendors.get((req.params as { slug: string }).slug);
    const key = (req.headers["x-rider-key"] as string | undefined) ?? (req.query as { key?: string }).key;
    if (!vendor || !keyOk(vendor, key)) {
      void reply.code(404).send({ error: "not found" });
      return null;
    }
    return vendor;
  }

  function riderOf(vendor: LoadedVendor, index: unknown) {
    const i = Number(index);
    return Number.isInteger(i) && i >= 0 && i < vendor.riders.length ? vendor.riders[i]! : null;
  }

  app.get("/r/:slug", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    reply.header("Cache-Control", "no-store").header("Referrer-Policy", "no-referrer").type("text/html");
    return riderPage(vendor.name);
  });

  app.get("/r/:slug/api/state", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const me = riderOf(vendor, (req.query as { rider?: string }).rider);
    const ready = store.ordersByStatus(vendor.slug, ["ready"]).filter((o) => o.fulfilment === "delivery");
    const mine = me
      ? store.ordersByStatus(vendor.slug, ["out_for_delivery"]).filter((o) => o.riderPhone === me.phone)
      : [];
    const today = startOfDayPkt(Date.now());
    const done = me
      ? store.ordersByStatus(vendor.slug, ["delivered"], today).filter((o) => o.riderPhone === me.phone)
      : [];
    reply.header("Cache-Control", "no-store");
    return {
      riders: vendor.riders.map((r, i) => ({ i, name: r.name })),
      me: me ? me.name : null,
      ready: ready.map((o) => view(vendor, o)),
      mine: mine.map((o) => view(vendor, o)),
      today: {
        delivered: done.length,
        cash: done.filter((o) => o.paymentMethod === "cod" && o.cashCollected).reduce((s, o) => s + o.total, 0),
      },
      currency: vendor.currency,
    };
  });

  app.post("/r/:slug/api/orders/:id/take", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const me = riderOf(vendor, (req.body as { rider?: unknown } | undefined)?.rider);
    if (!me) return reply.code(400).send({ error: "Pehle apna naam chunein" });
    const order = store.getOrder(Number((req.params as { id: string }).id));
    if (!order || order.vendorSlug !== vendor.slug) return reply.code(404).send({ error: "order not found" });
    if (order.status !== "ready") return reply.code(409).send({ error: "Ye order koi aur rider le chuka hai ya abhi tayyar nahi." });
    try {
      const change = changeStatus(store, vendor, order, "out_for_delivery", { riderName: me.name, riderPhone: me.phone });
      if (change.notify) await engine.notifyCustomer(vendor, change.order, change.notify);
      return { ok: true };
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
  });

  /** Rider page shares GPS while the rider has deliveries, for the customer's tracking page. */
  app.post("/r/:slug/api/location", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const body = (req.body ?? {}) as { rider?: unknown; lat?: unknown; lng?: unknown };
    const me = riderOf(vendor, body.rider);
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!me) return reply.code(400).send({ error: "Pehle apna naam chunein" });
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return reply.code(400).send({ error: "bad location" });
    }
    store.setRiderLocation(vendor.slug, me.phone, lat, lng);
    return { ok: true };
  });

  app.post("/r/:slug/api/orders/:id/delivered", async (req, reply) => {
    const vendor = auth(req, reply);
    if (!vendor) return;
    const body = (req.body ?? {}) as { rider?: unknown; cash?: unknown };
    const me = riderOf(vendor, body.rider);
    if (!me) return reply.code(400).send({ error: "Pehle apna naam chunein" });
    const order = store.getOrder(Number((req.params as { id: string }).id));
    if (!order || order.vendorSlug !== vendor.slug) return reply.code(404).send({ error: "order not found" });
    if (order.status !== "out_for_delivery" || order.riderPhone !== me.phone) {
      return reply.code(409).send({ error: "Ye order aap ke paas nahi hai." });
    }
    changeStatus(store, vendor, order, "delivered", { cashCollected: body.cash === true });
    return { ok: true };
  });
}
