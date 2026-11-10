// Customer tracking page: https://<server>/t/<token>
// The link goes inside messages we already send (confirmation, "rider on the way"), so it costs nothing extra.
// Shows the order steps, and while the rider is on the way, how far the rider is (from the rider page's GPS).

import type { FastifyInstance } from "fastify";
import { lineLabel } from "../cart.js";
import type { Order, OrderStatus, Store } from "../db.js";
import { RIDER_KMH, roadKm } from "../delivery.js";
import { formatKarachi } from "../hours.js";
import type { LoadedVendor, VendorRegistry } from "../vendors.js";
import { trackPage } from "./page.js";

/** Tracking links stop working a day after the order. */
export const TRACK_TTL_MS = 24 * 3600_000;
/** A rider position older than this is not shown. */
const FRESH_MS = 5 * 60_000;

const DELIVERY_STEPS: [OrderStatus, string, string][] = [
  ["new", "Order mil gaya", "Order received"],
  ["accepted", "Kitchen mein tayyar ho raha hai", "Being prepared"],
  ["ready", "Tayyar, rider ka intezar", "Ready, waiting for rider"],
  ["out_for_delivery", "Rider raste mein hai", "On the way"],
  ["delivered", "Deliver ho gaya", "Delivered"],
];
const PICKUP_STEPS: [OrderStatus, string, string][] = [
  ["new", "Order mil gaya", "Order received"],
  ["accepted", "Kitchen mein tayyar ho raha hai", "Being prepared"],
  ["ready", "Pickup ke liye tayyar", "Ready for pickup"],
  ["picked_up", "Le liya gaya", "Picked up"],
];

export function trackingData(store: Store, vendor: LoadedVendor, o: Order, now = Date.now()) {
  const ur = vendor.notifyLanguage === "roman_urdu";
  const steps = o.fulfilment === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const at = steps.findIndex(([s]) => s === o.status);
  const branch = vendor.branches.find((b) => b.id === o.branchId);

  let rider: { name: string; phone: string | null; km: number | null; minutes: number | null; mapUrl: string | null; ageMin: number | null } | null = null;
  if (o.status === "out_for_delivery" && o.riderName) {
    rider = { name: o.riderName, phone: o.riderPhone, km: null, minutes: null, mapUrl: null, ageMin: null };
    const pos = o.riderPhone ? store.riderLocation(vendor.slug, o.riderPhone) : undefined;
    if (pos && now - pos.at < FRESH_MS && o.location) {
      const km = roadKm(pos, o.location);
      rider.km = km;
      rider.minutes = Math.max(1, Math.ceil((km / RIDER_KMH) * 60));
      rider.mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${o.location.lat},${o.location.lng}`;
      rider.ageMin = Math.floor((now - pos.at) / 60_000);
    }
  }

  return {
    lang: vendor.notifyLanguage,
    shop: vendor.name,
    number: o.number,
    status: o.status,
    rejected: o.status === "rejected",
    fulfilment: o.fulfilment,
    branch: branch ? { name: branch.name, address: branch.address } : null,
    steps: steps.map(([s, u, e], i) => ({ label: ur ? u : e, done: at >= 0 && i <= at, current: i === at })),
    items: o.items.map(lineLabel),
    total: `${vendor.currency} ${o.total.toLocaleString("en-US")}`,
    payment: o.paymentMethod === "cod" ? "Cash on Delivery" : "Online",
    scheduledLabel: o.scheduledFor ? formatKarachi(o.scheduledFor) : null,
    eta: { min: o.etaMin, max: o.etaMax },
    placedAt: o.createdAt,
    rider,
  };
}

export function registerTrackRoutes(app: FastifyInstance, deps: { store: Store; vendors: VendorRegistry }) {
  const { store, vendors } = deps;

  function lookup(token: string) {
    const o = store.findOrderByToken(token);
    if (!o || Date.now() - o.createdAt > TRACK_TTL_MS) return null;
    const vendor = vendors.get(o.vendorSlug);
    return vendor ? { o, vendor } : null;
  }

  app.get("/t/:token", async (req, reply) => {
    const found = lookup((req.params as { token: string }).token);
    reply.header("Cache-Control", "no-store").header("X-Robots-Tag", "noindex").header("Referrer-Policy", "no-referrer");
    if (!found) return reply.code(404).type("text/html").send(trackPage(null));
    return reply.type("text/html").send(trackPage(trackingData(store, found.vendor, found.o)));
  });

  app.get("/t/:token/api", async (req, reply) => {
    const found = lookup((req.params as { token: string }).token);
    reply.header("Cache-Control", "no-store");
    if (!found) return reply.code(404).send({ error: "expired" });
    return trackingData(store, found.vendor, found.o);
  });
}
