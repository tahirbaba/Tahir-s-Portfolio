// Public menu page: https://<server>/m/<vendor-slug>
// The customer builds a cart here; "Send on WhatsApp" opens WhatsApp with the order text and a short code.
// The customer's message is free, and the code loads the exact cart on our side.

import { randomInt } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { cartSummary, lineLabel, resolveLine, subtotal, type CartLine } from "../cart.js";
import type { Fulfilment, PaymentMethod, Store } from "../db.js";
import { hoursText, isOpen } from "../hours.js";
import type { LoadedVendor, VendorRegistry } from "../vendors.js";
import { menuPage } from "./page.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function newCode(): string {
  let c = "";
  for (let i = 0; i < 5; i++) c += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return c;
}

export function waNumber(vendor: LoadedVendor): string | null {
  const digits = (vendor.whatsapp.displayNumber ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

/** What the page needs to draw itself. Prices come from the vendor file; sold-out items are marked. */
export function menuData(vendor: LoadedVendor, store: Store, now = new Date()) {
  const st = store.vendorState(vendor.slug);
  return {
    name: vendor.name,
    currency: vendor.currency,
    lang: vendor.notifyLanguage,
    paused: st.paused,
    preorder: vendor.preorder.enabled,
    branches: vendor.branches.map((b) => ({
      name: b.name,
      address: b.address,
      open: isOpen(b, now),
      hours: hoursText(b),
      pickup: b.pickup,
      freeAbove: b.delivery.freeAbove ?? null,
      minOrder: b.delivery.minOrder,
    })),
    payment: { cod: vendor.payment.cod, online: Boolean(vendor.payment.online) },
    items: vendor.menu.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      description: m.description ?? null,
      price: m.price ?? null,
      variants: m.variants ?? null,
      available: m.available && !st.unavailable.includes(m.id),
    })),
  };
}

interface CartRequest {
  items?: { id?: unknown; variant?: unknown; qty?: unknown }[];
  fulfilment?: unknown;
  name?: unknown;
  payment?: unknown;
  note?: unknown;
}

const hits = new Map<string, { count: number; resetAt: number }>();
function tooMany(ip: string, now = Date.now()): boolean {
  const h = hits.get(ip);
  if (!h || h.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    if (hits.size > 10_000) hits.clear();
    return false;
  }
  h.count++;
  return h.count > 30;
}

function orderText(vendor: LoadedVendor, code: string, cart: CartLine[], f: Fulfilment | null, name: string | null, pay: PaymentMethod | null, note: string | null): string {
  const ur = vendor.notifyLanguage === "roman_urdu";
  const money = (n: number) => `${vendor.currency} ${n.toLocaleString("en-US")}`;
  return [
    ur ? `Assalam o Alaikum! Menu se order (code ${code})` : `Hi! Order from the menu (code ${code})`,
    ...cart.map((l) => `• ${lineLabel(l)}`),
    `Subtotal: ${money(subtotal(cart))}`,
    f ? (f === "delivery" ? "🛵 Delivery" : "🏪 Pickup") : null,
    name ? `${ur ? "Naam" : "Name"}: ${name}` : null,
    pay ? `Payment: ${pay === "cod" ? "Cash on Delivery" : "Online"}` : null,
    note ? `Note: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function registerMenuRoutes(app: FastifyInstance, deps: { store: Store; vendors: VendorRegistry }) {
  const { store, vendors } = deps;

  app.get("/m/:slug", async (req, reply) => {
    const vendor = vendors.get((req.params as { slug: string }).slug);
    if (!vendor || !waNumber(vendor)) return reply.code(404).type("text/plain").send("Menu not found");
    reply.header("Cache-Control", "no-store").type("text/html");
    return menuPage(menuData(vendor, store));
  });

  app.post("/m/:slug/cart", async (req, reply) => {
    const vendor = vendors.get((req.params as { slug: string }).slug);
    const number = vendor ? waNumber(vendor) : null;
    if (!vendor || !number) return reply.code(404).send({ error: "not found" });
    if (tooMany(req.ip)) return reply.code(429).send({ error: "Too many requests, try again in a few minutes." });

    const body = (req.body ?? {}) as CartRequest;
    const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
    if (items.length === 0) return reply.code(400).send({ error: "Cart is empty" });
    const soldOut = store.vendorState(vendor.slug).unavailable;
    let cart: CartLine[] = [];
    for (const it of items) {
      const r = resolveLine(
        vendor,
        {
          item_id: String(it.id ?? ""),
          variant: typeof it.variant === "string" ? it.variant : null,
          qty: Number(it.qty),
        },
        soldOut,
      );
      if (!r.ok) return reply.code(400).send({ error: r.error });
      cart = [...cart, r.value];
    }
    const fulfilment: Fulfilment | null = body.fulfilment === "delivery" || body.fulfilment === "pickup" ? body.fulfilment : null;
    const payment: PaymentMethod | null = body.payment === "cod" || body.payment === "online" ? body.payment : null;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) || null : null;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) || null : null;

    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = newCode();
      try {
        store.savePendingCart({ code, vendorSlug: vendor.slug, cart, fulfilment, customerName: name, paymentMethod: payment, note });
        break;
      } catch {
        code = ""; // rare collision: try another code
      }
    }
    if (!code) return reply.code(500).send({ error: "Please try again" });

    const text = orderText(vendor, code, cart, fulfilment, name, payment, note);
    return {
      code,
      summary: cartSummary(cart, vendor.currency),
      waUrl: `https://wa.me/${number}?text=${encodeURIComponent(text)}`,
    };
  });
}
