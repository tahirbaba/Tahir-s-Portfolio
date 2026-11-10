import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "../src/config.js";
import { Store } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { changeStatus } from "../src/orders.js";
import { buildServer } from "../src/server.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";
import { parseWebhook, verifySignature } from "../src/whatsapp/webhook.js";
import { FakeWhatsApp, inbound, ScriptedLLM } from "./helpers.js";

const PIZZA_NUM = "111111";
const FF_NUM = "222222";

function load(file: string, phoneNumberId: string) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  raw.whatsapp.phoneNumberId = phoneNumberId;
  return parseVendor(raw);
}

// Wednesday 20:00 in Karachi: both shops open.
const NOW = new Date("2026-11-11T15:00:00Z");
const quiet = { info() {}, warn() {}, error() {} };

let store: Store;
let vendors: VendorRegistry;
let wa: FakeWhatsApp;

function engineWith(llm: ScriptedLLM, now = () => NOW) {
  return new Engine({ store, vendors, llm, wa, log: quiet, now });
}

beforeEach(() => {
  store = new Store(":memory:");
  vendors = new VendorRegistry([load("vendors/demo-pizza.json", PIZZA_NUM), load("vendors/demo-fastfood.json", FF_NUM)]);
  wa = new FakeWhatsApp();
});

describe("routing: one system, many vendors", () => {
  it("answers each customer from the number they messaged, with that shop's data", async () => {
    const llm = new ScriptedLLM([{ text: "Pizza reply" }, { text: "Burger reply" }]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(PIZZA_NUM, "923001", { text: "pizza menu?" }));
    await engine.enqueue(inbound(FF_NUM, "923001", { text: "zinger hai?" }));

    assert.deepEqual(
      wa.sent.map((s) => [s.vendor, s.to, s.text]),
      [
        ["demo-pizza", "923001", "Pizza reply"],
        ["demo-fastfood", "923001", "Burger reply"],
      ],
    );
    const sys = (c: Anthropic.MessageCreateParamsNonStreaming) => JSON.stringify(c.system);
    assert.match(sys(llm.calls[0]!), /Crust Corner Pizza/);
    assert.doesNotMatch(sys(llm.calls[0]!), /Zing Bites/);
    assert.match(sys(llm.calls[1]!), /Zing Bites/);
    // Same customer, two shops = two separate chats.
    assert.equal(llm.calls[1]!.messages.length, 1);
  });

  it("ignores numbers that belong to no vendor and duplicate deliveries", async () => {
    const llm = new ScriptedLLM([{ text: "once" }]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound("999", "923001"));
    const m = inbound(PIZZA_NUM, "923001");
    await engine.enqueue(m);
    await engine.enqueue({ ...m });
    assert.equal(wa.sent.length, 1);
  });
});

describe("full order", () => {
  it("cart -> delivery quote -> order, with prices from the menu", async () => {
    const llm = new ScriptedLLM([
      { tool: "add_to_cart", input: { item_id: "chicken-tikka-pizza", variant: "Large", qty: 1, note: null } },
      { tool: "add_to_cart", input: { item_id: "drink-1-5", variant: null, qty: 1, note: null } },
      { text: "Large Tikka aur 1.5L add. Delivery ya pickup?" },
      { tool: "set_fulfilment", input: { method: "delivery", pickup_branch_id: null } },
      { text: "Delivery fee ... Naam aur payment?" },
      { tool: "place_order", input: { customer_name: "Ali", payment_method: "cod", address_note: "House 12", pickup_branch_id: null } },
      { text: "Done!" }, // paraphrase: must be replaced by the exact confirmation
    ]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(PIZZA_NUM, "923005", { text: "1 large tikka aur 1.5 drink" }));
    await engine.enqueue(
      inbound(PIZZA_NUM, "923005", { kind: "location", originalType: "location", location: { lat: 24.925, lng: 67.095 } }),
    );
    await engine.enqueue(inbound(PIZZA_NUM, "923005", { text: "Ali, cash. haan confirm" }));

    const order = store.lastOrderOf("demo-pizza", "923005");
    assert.ok(order);
    assert.equal(order.number, "CC-1001");
    assert.equal(order.subtotal, 1650 + 280);
    assert.equal(order.branchId, "gulshan");
    assert.equal(order.total, order.subtotal + order.deliveryFee);
    assert.ok(order.deliveryFee > 0);
    const confirmation = wa.sent.at(-1)!.text;
    assert.match(confirmation, /CC-1001/);
    assert.match(confirmation, new RegExp(`PKR ${order.total.toLocaleString("en-US")}`));

    // Conversation history is append-only: each request starts with the previous request's messages.
    for (let i = 1; i < llm.calls.length; i++) {
      const prev = llm.calls[i - 1]!.messages;
      const cur = llm.calls[i]!.messages;
      assert.deepEqual(cur.slice(0, prev.length), prev, `request ${i} rewrote history`);
    }
    // The system prompt never changes inside a chat (keeps the cache valid).
    assert.ok(llm.calls.every((c) => JSON.stringify(c.system) === JSON.stringify(llm.calls[0]!.system)));
  });

  it("refuses to place an order when the shop is closed", async () => {
    const morning = new Date("2026-11-11T05:00:00Z"); // 10:00 Karachi
    const llm = new ScriptedLLM([
      { tool: "add_to_cart", input: { item_id: "zinger", variant: null, qty: 2, note: null } },
      { tool: "set_fulfilment", input: { method: "pickup", pickup_branch_id: null } },
      { tool: "place_order", input: { customer_name: "Sara", payment_method: "cod", address_note: null, pickup_branch_id: null } },
      { text: "Abhi band hai, 4 baje khulenge." },
    ]);
    const engine = engineWith(llm, () => morning);
    await engine.enqueue(inbound(FF_NUM, "923006", { text: "2 zinger pickup, Sara" }));
    assert.equal(store.lastOrderOf("demo-fastfood", "923006"), undefined);
    const lastToolResult = JSON.stringify(llm.calls.at(-1)!.messages.at(-1));
    assert.match(lastToolResult, /closed/);
  });
});

describe("human hand-off", () => {
  it("bot goes silent after hand-off until staff releases the chat", async () => {
    const llm = new ScriptedLLM([
      { tool: "handoff_to_human", input: { reason: "cold pizza complaint" } },
      { text: "Team member jaldi reply karega." },
      { text: "Back to bot" },
    ]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(PIZZA_NUM, "923007", { text: "pizza thanda tha!" }));
    await engine.enqueue(inbound(PIZZA_NUM, "923007", { text: "hello??" }));
    assert.equal(wa.sent.length, 1);
    const [chat] = store.humanModeSessions("demo-pizza", NOW.getTime());
    assert.ok(chat);
    assert.equal(chat.handoffReason, "cold pizza complaint");

    engine.releaseToBot(vendors.get("demo-pizza")!, chat.id);
    await engine.enqueue(inbound(PIZZA_NUM, "923007", { text: "ok thanks" }));
    assert.equal(wa.sent.at(-1)!.text, "Back to bot");
  });
});

describe("menu change", () => {
  it("starts a fresh chat when the vendor file changes", async () => {
    const llm = new ScriptedLLM([{ text: "a" }, { text: "b" }]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(FF_NUM, "923008", { text: "one" }));
    const raw = JSON.parse(readFileSync("vendors/demo-fastfood.json", "utf8"));
    raw.whatsapp.phoneNumberId = FF_NUM;
    raw.menu[0].price = 999;
    vendors = new VendorRegistry([load("vendors/demo-pizza.json", PIZZA_NUM), parseVendor(raw)]);
    const engine2 = new Engine({ store, vendors, llm, wa, log: quiet, now: () => NOW });
    await engine2.enqueue(inbound(FF_NUM, "923008", { text: "two" }));
    assert.equal(llm.calls[1]!.messages.length, 1);
    assert.match(JSON.stringify(llm.calls[1]!.system), /Zinger Burger \[id: zinger\] — 999/);
    void engine;
  });
});

describe("kitchen / rider status", () => {
  it("only messages the customer when needed", () => {
    const vendor = vendors.get("demo-pizza")!;
    const session = store.createSession("demo-pizza", "923009", vendor.configHash);
    const order = store.createOrder({
      vendorSlug: "demo-pizza", number: "CC-2000", customer: "923009", customerName: "Ali", branchId: "gulshan",
      fulfilment: "delivery", items: [{ itemId: "fries", name: "Fries", variant: "Large", qty: 1, unitPrice: 380 }],
      subtotal: 380, deliveryFee: 100, total: 480, paymentMethod: "cod", paymentStatus: "cod", paymentNote: null,
      location: { lat: 1, lng: 1 }, addressNote: null, status: "new", etaMin: 35, etaMax: 45, scheduledFor: null,
    }, NOW.getTime());
    void session;
    const accepted = changeStatus(store, vendor, order, "accepted", { prepMinutes: 15 }, NOW.getTime());
    assert.equal(accepted.notify, null);
    const ready = changeStatus(store, vendor, accepted.order, "ready", {}, NOW.getTime());
    assert.equal(ready.notify, null);
    const out = changeStatus(store, vendor, ready.order, "out_for_delivery", { riderName: "Imran" }, NOW.getTime());
    assert.match(out.notify!, /CC-2000/);
    assert.match(out.notify!, /Imran/);
    assert.throws(() => changeStatus(store, vendor, out.order, "accepted"));
  });
});

describe("webhook", () => {
  const body = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ field: "messages", value: {
      metadata: { phone_number_id: PIZZA_NUM },
      contacts: [{ wa_id: "923001", profile: { name: "Ali" } }],
      messages: [
        { id: "wamid.A", from: "923001", timestamp: "1700000000", type: "text", text: { body: "salam" } },
        { id: "wamid.B", from: "923001", timestamp: "1700000001", type: "location", location: { latitude: 24.9, longitude: 67.1 } },
      ],
    } }] }],
  };

  it("parses messages and the receiving number", () => {
    const msgs = parseWebhook(body);
    assert.equal(msgs.length, 2);
    assert.equal(msgs[0]!.phoneNumberId, PIZZA_NUM);
    assert.equal(msgs[0]!.text, "salam");
    assert.equal(msgs[0]!.profileName, "Ali");
    assert.deepEqual(msgs[1]!.location, { lat: 24.9, lng: 67.1, name: undefined, address: undefined });
    assert.deepEqual(parseWebhook({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { statuses: [{}] } }] }] }), []);
  });

  it("checks Meta's signature", () => {
    const raw = JSON.stringify(body);
    const sig = "sha256=" + createHmac("sha256", "secret").update(raw).digest("hex");
    assert.equal(verifySignature(raw, sig, "secret"), true);
    assert.equal(verifySignature(raw + " ", sig, "secret"), false);
    assert.equal(verifySignature(raw, undefined, "secret"), false);
    assert.equal(verifySignature(raw, sig, ["app-a", "secret"]), true);
    assert.equal(verifySignature(raw, sig, []), false);
  });

  it("server rejects unsigned calls and accepts signed ones", async () => {
    (config as { metaAppSecrets: string[] }).metaAppSecrets = ["other-app", "secret"];
    (config as { webhookVerifyToken: string }).webhookVerifyToken = "vt";
    process.env.OPS_KEY_DEMO_PIZZA = "kitchen-key";
    const llm = new ScriptedLLM([{ text: "W/salam" }, { text: "pin mil gaya" }]);
    const engine = engineWith(llm);
    const app = buildServer({ store, vendors, engine, logger: false });
    const raw = JSON.stringify(body);

    const bad = await app.inject({ method: "POST", url: "/webhook", payload: raw, headers: { "content-type": "application/json" } });
    assert.equal(bad.statusCode, 401);

    const sig = "sha256=" + createHmac("sha256", "secret").update(raw).digest("hex");
    const ok = await app.inject({ method: "POST", url: "/webhook", payload: raw, headers: { "content-type": "application/json", "x-hub-signature-256": sig } });
    assert.equal(ok.statusCode, 200);
    await engine.idle();
    assert.equal(wa.sent.length, 2);

    const verify = await app.inject({ method: "GET", url: "/webhook?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=123" });
    assert.equal(verify.body, "123");

    assert.equal((await app.inject({ method: "GET", url: "/ops/demo-pizza?key=wrong" })).statusCode, 404);
    const page = await app.inject({ method: "GET", url: "/ops/demo-pizza?key=kitchen-key" });
    assert.equal(page.statusCode, 200);
    const state = await app.inject({ method: "GET", url: "/ops/demo-pizza/api/state", headers: { "x-ops-key": "kitchen-key" } });
    assert.equal(state.json().open.length, 0);
    await app.close();
  });
});
