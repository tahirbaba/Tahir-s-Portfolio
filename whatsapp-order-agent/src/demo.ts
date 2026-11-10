// Demo data: fills a fresh database so every screen has something to show, without a Claude key.
// Used by `npm run demo`.

import type Anthropic from "@anthropic-ai/sdk";
import type { LLM } from "./agent/llm.js";
import type { CartLine } from "./cart.js";
import type { Order, OrderStatus, PaymentMethod, Store } from "./db.js";
import { record } from "./usage.js";
import type { VendorRegistry } from "./vendors.js";

/** Stands in for Claude when there is no key: always answers with a short notice. */
export class DemoLLM implements LLM {
  async create(): Promise<Anthropic.Message> {
    return {
      id: "demo",
      type: "message",
      role: "assistant",
      model: "demo",
      content: [
        {
          type: "text",
          text: "(Demo mode: AI band hai kyun ke Claude key nahi lagi. Asal jawab ke liye .env mein ANTHROPIC_API_KEY daal kar npm run dev chalayein.)",
          citations: null,
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    } as unknown as Anthropic.Message;
  }
}

const MIN = 60_000;

interface DemoOrder {
  vendor: string;
  customer: string;
  name: string;
  branch: string;
  fulfilment: "delivery" | "pickup";
  items: CartLine[];
  fee?: number;
  pay?: PaymentMethod;
  paymentStatus?: Order["paymentStatus"];
  paymentNote?: string;
  status: OrderStatus;
  minutesAgo: number;
  location?: { lat: number; lng: number };
  address?: string;
  rider?: { name: string; phone: string };
  cash?: boolean;
  scheduledInMin?: number;
}

const line = (itemId: string, name: string, unitPrice: number, qty = 1, variant?: string, note?: string): CartLine => ({
  itemId, name, unitPrice, qty, variant, note,
});

export interface DemoSeed {
  orders: Order[];
  trackingTokens: { number: string; token: string }[];
}

export function seedDemo(store: Store, vendors: VendorRegistry, now = Date.now()): DemoSeed {
  const pizza = vendors.get("demo-pizza");
  const ff = vendors.get("demo-fastfood");
  if (!pizza || !ff) throw new Error("demo-pizza aur demo-fastfood vendor files chahiye");
  const [imran, bilal] = pizza.riders;

  const list: DemoOrder[] = [
    {
      vendor: "demo-pizza", customer: "923001112223", name: "Ali", branch: "gulshan", fulfilment: "delivery",
      items: [line("chicken-tikka-pizza", "Chicken Tikka Pizza", 1650, 1, "Large"), line("drink-1-5", "Soft Drink 1.5L", 280)],
      fee: 100, status: "new", minutesAgo: 2, location: { lat: 24.925, lng: 67.095 }, address: "House 12, Block 13-D",
    },
    {
      vendor: "demo-pizza", customer: "923004445556", name: "Sara", branch: "gulshan", fulfilment: "delivery",
      items: [line("deal-2-medium", "Deal: 2 Medium Pizzas + 1.5L Drink", 2499, 1, undefined, "Fajita + Tikka")],
      fee: 150, pay: "online", paymentStatus: "claimed", paymentNote: "Screenshot: amount 2649, ref TX88231",
      status: "accepted", minutesAgo: 9, location: { lat: 24.93, lng: 67.1 }, address: "Flat 3, Gulshan Block 6",
    },
    {
      vendor: "demo-pizza", customer: "923007778889", name: "Usman", branch: "gulshan", fulfilment: "pickup",
      items: [line("fries", "Fries", 380, 2, "Large"), line("wings", "Hot Wings (6 pcs)", 550)],
      status: "accepted", minutesAgo: 12,
    },
    {
      vendor: "demo-pizza", customer: "923001239999", name: "Hamza", branch: "gulshan", fulfilment: "delivery",
      items: [line("fajita-pizza", "Chicken Fajita Pizza", 1150, 2, "Medium")],
      fee: 150, status: "ready", minutesAgo: 22, location: { lat: 24.935, lng: 67.09 }, address: "House 40, Block 5",
    },
    {
      vendor: "demo-pizza", customer: "923002224444", name: "Ayesha", branch: "gulshan", fulfilment: "delivery",
      items: [
        line("malai-boti-pizza", "Malai Boti Pizza", 1750, 1, "Large"),
        line("drink-345", "🎁 FREE Soft Drink 345ml", 0, 1, undefined, "loyalty reward"),
      ],
      fee: 0, status: "out_for_delivery", minutesAgo: 34, location: { lat: 24.9265, lng: 67.1035 }, address: "Gulshan Block 2, near park",
      rider: imran,
    },
    {
      vendor: "demo-pizza", customer: "923003336666", name: "Fahad", branch: "johar", fulfilment: "delivery",
      items: [line("veggie-pizza", "Veggie Lover Pizza", 1500, 1, "Large"), line("garlic-bread", "Garlic Bread (4 pcs)", 350)],
      fee: 130, status: "delivered", minutesAgo: 95, location: { lat: 24.912, lng: 67.128 }, rider: bilal, cash: true,
    },
    {
      vendor: "demo-pizza", customer: "923005557777", name: "Zainab", branch: "gulshan", fulfilment: "delivery",
      items: [line("deal-student", "Student Deal: Small Pizza + Fries + 345ml Drink", 899, 2)],
      fee: 100, status: "delivered", minutesAgo: 140, location: { lat: 24.92, lng: 67.09 }, rider: imran, cash: false,
    },
    {
      vendor: "demo-pizza", customer: "923006668888", name: "Kamran", branch: "gulshan", fulfilment: "pickup",
      items: [line("chicken-tikka-pizza", "Chicken Tikka Pizza", 1150, 2, "Medium")],
      status: "new", minutesAgo: 5, scheduledInMin: 180,
    },
    {
      vendor: "demo-pizza", customer: "923008889999", name: "Nadia", branch: "gulshan", fulfilment: "pickup",
      items: [line("wings", "Hot Wings (6 pcs)", 550)], status: "rejected", minutesAgo: 70,
    },
    {
      vendor: "demo-fastfood", customer: "923011112222", name: "Bilal", branch: "main", fulfilment: "pickup",
      items: [line("deal-combo", "Combo: Zinger + Fries + 345ml Drink", 799, 2)], status: "new", minutesAgo: 3,
    },
    {
      vendor: "demo-fastfood", customer: "923013334444", name: "Hira", branch: "main", fulfilment: "delivery",
      items: [line("broast-quarter", "Chicken Broast (Quarter)", 600, 2), line("loaded-fries", "Loaded Fries", 550)],
      fee: 0, status: "ready", minutesAgo: 18, location: { lat: 24.92, lng: 67.1 }, address: "Near NIPA bus stop",
    },
    {
      vendor: "demo-fastfood", customer: "923015556666", name: "Saad", branch: "main", fulfilment: "pickup",
      items: [line("zinger", "Zinger Burger", 550, 3)], status: "picked_up", minutesAgo: 60, cash: true,
    },
  ];

  const orders: Order[] = [];
  for (const d of list) {
    const v = vendors.get(d.vendor)!;
    const subtotal = d.items.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const fee = d.fee ?? 0;
    const pay = d.pay ?? "cod";
    const created = now - d.minutesAgo * MIN;
    let o = store.createOrder(
      {
        vendorSlug: d.vendor,
        number: store.nextOrderNumber(d.vendor, v.orderPrefix),
        customer: d.customer,
        customerName: d.name,
        branchId: d.branch,
        fulfilment: d.fulfilment,
        items: d.items,
        subtotal,
        deliveryFee: fee,
        total: subtotal + fee,
        paymentMethod: pay,
        paymentStatus: d.paymentStatus ?? (pay === "cod" ? "cod" : "awaiting"),
        paymentNote: d.paymentNote ?? null,
        location: d.location ?? null,
        addressNote: d.address ?? null,
        status: "new",
        etaMin: d.fulfilment === "delivery" ? 35 : 20,
        etaMax: d.fulfilment === "delivery" ? 45 : 30,
        scheduledFor: d.scheduledInMin ? now + d.scheduledInMin * MIN : null,
      },
      created,
    );
    o = store.updateOrder(
      o.id,
      {
        status: d.status,
        riderName: d.rider?.name ?? null,
        riderPhone: d.rider?.phone ?? null,
        cashCollected: d.cash ?? false,
      },
      created + Math.min(d.minutesAgo, 15) * MIN,
    );
    orders.push(o);
  }

  // The rider on the way shares GPS: the tracking page shows the distance.
  const onTheWay = orders.find((o) => o.status === "out_for_delivery");
  if (onTheWay && imran) store.setRiderLocation("demo-pizza", imran.phone, 24.9215, 67.0985, now - MIN);

  // One item sold out today.
  store.setVendorState("demo-pizza", { paused: false, unavailable: ["wings"] });

  // A chat waiting for staff (complaint) and a sample AI conversation for the admin chat viewer.
  const complaint = store.createSession("demo-pizza", "923009990000", pizza.configHash, { customerName: "Bilal" }, now - 6 * MIN);
  complaint.messages = [
    { role: "user", content: [{ type: "text", text: "[context demo]\nkal ka pizza bilkul thanda aaya tha, refund chahiye" }] },
    { role: "assistant", content: [{ type: "text", text: "Maazrat! Hamari team ka member jaldi isi chat mein jawab dega." }] },
  ];
  complaint.mode = "human";
  complaint.humanUntil = now + 2 * 60 * MIN;
  complaint.handoffReason = "Customer: kal ka pizza thanda tha, refund maang raha hai";
  complaint.lastAt = now - 6 * MIN;
  store.saveSession(complaint);

  const chat = store.createSession("demo-pizza", "923001112223", pizza.configHash, { customerName: "Ali" }, now - 4 * MIN);
  chat.messages = [
    { role: "user", content: [{ type: "text", text: "[context now (demo); open branches: gulshan, johar; cart: empty]\n1 large tikka aur 1.5 drink, delivery" }] },
    { role: "assistant", content: [{ type: "tool_use", id: "d1", name: "add_to_cart", input: { item_id: "chicken-tikka-pizza", variant: "Large", qty: 1, note: null } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "d1", content: '{"ok":true,"cart":"1. 1 x Chicken Tikka Pizza (Large) = PKR 1650"}' }] },
    { role: "assistant", content: [{ type: "tool_use", id: "d2", name: "add_to_cart", input: { item_id: "drink-1-5", variant: null, qty: 1, note: null } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "d2", content: '{"ok":true,"cart":"... Subtotal: PKR 1930"}' }] },
    { role: "assistant", content: [{ type: "text", text: "Large Chicken Tikka aur 1.5L drink add ho gaye (PKR 1,930). Delivery ke liye location pin bhej dein 📍" }] },
    { role: "user", content: [{ type: "text", text: "[context now (demo); location pin: shared]\n(customer shared a location pin)" }] },
    { role: "assistant", content: [{ type: "tool_use", id: "d3", name: "set_fulfilment", input: { method: "delivery", pickup_branch_id: null } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "d3", content: '{"ok":true,"branch":"Gulshan Branch","distance_km":1.2,"delivery_fee":100,"total":2030,"eta_minutes":"35-45"}' }] },
    { role: "assistant", content: [{ type: "text", text: "Gulshan branch se 1.2 km. Delivery PKR 100, total *PKR 2,030*, 35–45 min. Naam aur payment (cash/online)?" }] },
  ];
  chat.lastAt = now - 2 * MIN;
  store.saveSession(chat);

  // A month of usage so the admin's cost table has numbers.
  for (const [slug, scale] of [["demo-pizza", 1], ["demo-fastfood", 0.4]] as const) {
    const add = (m: Parameters<typeof record>[2], v: number) => record(store, slug, m, Math.round(v * scale), now);
    add("wa_in", 5200);
    add("conversations", 640);
    add("ai_turns", 2900);
    add("wa_service", 3850);
    add("ai_input", 2_900_000);
    add("ai_cache_read", 4_100_000);
    add("ai_cache_write", 90_000);
    add("ai_output", 410_000);
  }

  return {
    orders,
    trackingTokens: orders.filter((o) => o.status !== "rejected").map((o) => ({ number: o.number, token: o.trackToken })),
  };
}
