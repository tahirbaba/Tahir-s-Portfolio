import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import { config } from "../src/config.js";
import { Store } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { formatKarachi, parseKarachiDateTime } from "../src/hours.js";
import { placeOrder } from "../src/orders.js";
import { handleOwnerCommand } from "../src/owner.js";
import { buildReport } from "../src/report.js";
import { buildServer } from "../src/server.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";
import { FakeWhatsApp, inbound, ScriptedLLM } from "./helpers.js";

const PIZZA_NUM = "111111";
const FF_NUM = "222222";
const OWNER = "923000000092"; // owner of demo-fastfood (see vendors/demo-fastfood.json)
const NOW = new Date("2026-11-11T15:00:00Z"); // Wed 20:00 Karachi
const quiet = { info() {}, warn() {}, error() {} };

function load(file: string, phoneNumberId: string) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  raw.whatsapp.phoneNumberId = phoneNumberId;
  return parseVendor(raw);
}

let store: Store;
let vendors: VendorRegistry;
let wa: FakeWhatsApp;

beforeEach(() => {
  store = new Store(":memory:");
  vendors = new VendorRegistry([load("vendors/demo-pizza.json", PIZZA_NUM), load("vendors/demo-fastfood.json", FF_NUM)]);
  wa = new FakeWhatsApp();
});

const engineWith = (llm: ScriptedLLM, now = () => NOW) => new Engine({ store, vendors, llm, wa, log: quiet, now });

describe("Karachi date/time", () => {
  it("parses and formats Pakistan time", () => {
    const d = parseKarachiDateTime("2026-11-12 14:30")!;
    assert.equal(d.toISOString(), "2026-11-12T09:30:00.000Z");
    assert.equal(formatKarachi(d.getTime()), "Thu 12 Nov, 14:30");
    assert.equal(parseKarachiDateTime("2026-02-31 10:00"), null);
    assert.equal(parseKarachiDateTime("kal 2 baje"), null);
  });
});

describe("pre-orders", () => {
  function sessionWithCart() {
    const v = vendors.get("demo-fastfood")!;
    const s = store.createSession(v.slug, "923010", v.configHash);
    s.cart = [{ itemId: "zinger", name: "Zinger Burger", qty: 2, unitPrice: 550 }];
    s.fulfilment = "pickup";
    return { v, s };
  }
  const morning = new Date("2026-11-11T05:00:00Z"); // Wed 10:00, shop opens 16:00

  it("takes an order for later when the shop is closed now", () => {
    const { v, s } = sessionWithCart();
    const r = placeOrder(store, v, s, { customer_name: "Sara", payment_method: "cod", scheduled_for: "2026-11-11 18:00" }, morning);
    assert.ok(r.ok);
    assert.equal(r.order.scheduledFor, parseKarachiDateTime("2026-11-11 18:00")!.getTime());
    assert.match(r.confirmation, /Pre-order/);
    assert.match(r.confirmation, /Wed 11 Nov, 18:00/);
  });

  it("rejects times when closed, too soon, or too far ahead", () => {
    const { v, s } = sessionWithCart();
    const at = (t: string, now = morning) =>
      placeOrder(store, v, s, { customer_name: "Sara", payment_method: "cod", scheduled_for: t }, now);
    assert.match((at("2026-11-11 12:00") as { error: string }).error, /closed at/);
    assert.match((at("2026-11-11 20:05", NOW) as { error: string }).error, /too soon/);
    assert.match((at("2026-11-12 18:00") as { error: string }).error, /at most 20 hours/);
    assert.match((at("tomorrow") as { error: string }).error, /must look like/);
  });

  it("without a time, a closed shop suggests a pre-order", () => {
    const { v, s } = sessionWithCart();
    const r = placeOrder(store, v, s, { customer_name: "Sara", payment_method: "cod" }, morning);
    assert.equal(r.ok, false);
    assert.match((r as { error: string }).error, /pre-order/);
  });
});

describe("owner commands", () => {
  it("only owners can use #commands; others go to the AI", async () => {
    const llm = new ScriptedLLM([{ text: "AI reply" }]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(FF_NUM, OWNER, { text: "#status" }));
    await engine.enqueue(inbound(FF_NUM, "923011", { text: "#status" }));
    assert.match(wa.sent[0]!.text, /Naye orders: chalu/);
    assert.equal(wa.sent[1]!.text, "AI reply");
    assert.equal(llm.calls.length, 1);
  });

  it("#off / #on / #pause change what customers can order", async () => {
    const v = vendors.get("demo-fastfood")!;
    // Exact id/name wins: "zinger" is only the Zinger Burger, not the cheese one.
    assert.equal(handleOwnerCommand(store, v, "#off zinger")!, "❌ Sold out: Zinger Burger");
    assert.match(handleOwnerCommand(store, v, "#off broast")!, /Quarter.*Half/);
    assert.match(handleOwnerCommand(store, v, "#on broast half")!, /Available: Chicken Broast \(Half\)/);
    assert.deepEqual(store.vendorState(v.slug).unavailable, ["broast-quarter", "zinger"]);
    assert.match(handleOwnerCommand(store, v, "#off sushi")!, /nahi mila/);
    handleOwnerCommand(store, v, "#pause");
    assert.equal(store.vendorState(v.slug).paused, true);
    assert.equal(handleOwnerCommand(store, v, "hello"), null);

    // The AI sees sold-out items and cannot add them.
    const llm = new ScriptedLLM([
      { tool: "add_to_cart", input: { item_id: "zinger", variant: null, qty: 1, note: null } },
      { text: "Zinger khatam hai" },
    ]);
    await engineWith(llm).enqueue(inbound(FF_NUM, "923012", { text: "1 zinger" }));
    const req = JSON.stringify(llm.calls[1]!.messages);
    assert.match(req, /sold out today: [^;]*Zinger Burger/);
    assert.match(req, /NEW ORDERS PAUSED/);
    assert.match(req, /not available right now/);
  });

  it("#report sums today's orders", () => {
    const v = vendors.get("demo-pizza")!;
    const base = {
      vendorSlug: v.slug, customer: "92300", customerName: "A", branchId: "gulshan", fulfilment: "delivery" as const,
      subtotal: 1000, deliveryFee: 100, total: 1100, paymentMethod: "cod" as const, paymentStatus: "cod" as const,
      paymentNote: null, location: null, addressNote: null, etaMin: 30, etaMax: 40, scheduledFor: null,
      items: [{ itemId: "fries", name: "Fries", variant: "Large", qty: 2, unitPrice: 380 }],
    };
    store.createOrder({ ...base, number: "CC-1", status: "delivered" }, NOW.getTime() - 3600_000);
    store.createOrder({ ...base, number: "CC-2", status: "new" }, NOW.getTime() - 60_000);
    store.createOrder({ ...base, number: "CC-3", status: "rejected" }, NOW.getTime() - 60_000);
    store.createOrder({ ...base, number: "CC-0", status: "delivered" }, NOW.getTime() - 2 * 86_400_000);
    const r = buildReport(store, v, "today", NOW.getTime());
    assert.equal(r.orders, 2);
    assert.equal(r.revenue, 2200);
    assert.equal(r.rejected, 1);
    assert.deepEqual(r.topItems[0], { name: "Fries (Large)", qty: 4 });
    assert.equal(buildReport(store, v, "week", NOW.getTime()).orders, 3);
    assert.match(handleOwnerCommand(store, v, "#report", NOW.getTime())!, /Orders: \*2\*/);
  });
});

describe("menu page", () => {
  it("builds a cart, returns a WhatsApp link, and the code loads the exact cart", async () => {
    const llm = new ScriptedLLM([{ text: "Location pin bhej dein" }, { text: "again?" }]);
    const engine = engineWith(llm, () => new Date()); // same clock as the menu page
    const app = buildServer({ store, vendors, engine, logger: false });

    const page = await app.inject({ method: "GET", url: "/m/demo-pizza" });
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /Chicken Tikka Pizza/);
    assert.doesNotMatch(page.body, /<\/script><script/);

    const bad = await app.inject({ method: "POST", url: "/m/demo-pizza/cart", payload: { items: [{ id: "chicken-tikka-pizza", qty: 1 }] } });
    assert.equal(bad.statusCode, 400); // size missing

    const res = await app.inject({
      method: "POST",
      url: "/m/demo-pizza/cart",
      payload: {
        items: [{ id: "chicken-tikka-pizza", variant: "Large", qty: 2 }, { id: "drink-1-5", qty: 1 }],
        fulfilment: "delivery",
        name: "Ali",
        payment: "cod",
        note: "extra ketchup",
      },
    });
    assert.equal(res.statusCode, 200);
    const { code, waUrl } = res.json();
    assert.match(code, /^[A-HJ-NP-Z2-9]{5}$/);
    assert.ok(waUrl.startsWith("https://wa.me/923000000001?text="));
    const text = decodeURIComponent(waUrl.split("text=")[1]);
    assert.match(text, new RegExp(`code ${code}`));

    // Customer taps Send on WhatsApp.
    await engine.enqueue(inbound(PIZZA_NUM, "923020", { text }));
    const s = store.openSession("demo-pizza", "923020")!;
    assert.equal(s.cart.length, 2);
    assert.equal(s.cart[0]!.unitPrice, 1650);
    assert.equal(s.fulfilment, "delivery");
    assert.equal(s.customerName, "Ali");
    assert.match(JSON.stringify(llm.calls[0]!.messages.at(-1)), /order from the menu page/);

    // A code works once.
    await engine.enqueue(inbound(PIZZA_NUM, "923020", { text }));
    assert.match(JSON.stringify(llm.calls[1]!.messages.at(-1)), /not found or already used/);
    await app.close();
  });

  it("sold-out items cannot be sent from the page", async () => {
    store.setVendorState("demo-fastfood", { paused: false, unavailable: ["zinger"] });
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const page = await app.inject({ method: "GET", url: "/m/demo-fastfood" });
    assert.match(page.body, /"id":"zinger"[^}]*"available":false/);
    const res = await app.inject({ method: "POST", url: "/m/demo-fastfood/cart", payload: { items: [{ id: "zinger", qty: 1 }] } });
    assert.equal(res.statusCode, 400);
    await app.close();
  });
});

describe("kitchen screen menu tab", () => {
  it("toggles sold-out and pause", async () => {
    process.env.OPS_KEY_DEMO_FASTFOOD = "ff-key";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const h = { "x-ops-key": "ff-key" };
    let r = await app.inject({ method: "POST", url: "/ops/demo-fastfood/api/menu", headers: h, payload: { itemId: "nuggets", soldOut: true } });
    assert.deepEqual(r.json().unavailable, ["nuggets"]);
    r = await app.inject({ method: "POST", url: "/ops/demo-fastfood/api/menu", headers: h, payload: { paused: true } });
    assert.equal(r.json().paused, true);
    r = await app.inject({ method: "GET", url: "/ops/demo-fastfood/api/menu", headers: h });
    assert.equal(r.json().items.find((i: { id: string }) => i.id === "nuggets").soldOut, true);
    assert.equal(r.json().items.some((i: { id: string }) => i.id === "mint-margarita"), false);
    r = await app.inject({ method: "GET", url: "/ops/demo-fastfood/api/report?range=week", headers: h });
    assert.equal(r.json().orders, 0);
    await app.close();
  });
});

describe("admin panel", () => {
  it("needs the key, validates, and saves new vendors live", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "vendors-"));
    cpSync("vendors", dir, { recursive: true });
    const cfg = config as { vendorsDir: string; adminKey: string };
    const oldDir = cfg.vendorsDir;
    cfg.vendorsDir = dir;
    cfg.adminKey = "admin-secret";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const h = { "x-admin-key": "admin-secret" };
    try {
      assert.equal((await app.inject({ method: "GET", url: "/admin/api/vendors" })).statusCode, 404);
      assert.equal((await app.inject({ method: "GET", url: "/admin/api/vendors", headers: h })).json().vendors.length, 2);

      const tpl = (await app.inject({ method: "GET", url: "/admin/api/vendors/karachi-broast", headers: h })).json();
      assert.equal(tpl.exists, false);
      const json = JSON.parse(tpl.json);
      json.whatsapp.phoneNumberId = "333333";
      json.orderPrefix = "KB";

      const wrongSlug = await app.inject({ method: "PUT", url: "/admin/api/vendors/other", headers: h, payload: { json: JSON.stringify(json) } });
      assert.equal(wrongSlug.statusCode, 400);
      const clash = await app.inject({
        method: "PUT", url: "/admin/api/vendors/karachi-broast", headers: h,
        payload: { json: JSON.stringify({ ...json, whatsapp: { ...json.whatsapp, phoneNumberId: PIZZA_NUM } }) },
      });
      assert.match(clash.json().error, /demo-pizza/);
      const broken = await app.inject({ method: "PUT", url: "/admin/api/vendors/karachi-broast", headers: h, payload: { json: "{ nope" } });
      assert.match(broken.json().error, /JSON/);

      const ok = await app.inject({ method: "PUT", url: "/admin/api/vendors/karachi-broast", headers: h, payload: { json: JSON.stringify(json) } });
      assert.equal(ok.statusCode, 200);
      assert.equal(vendors.byPhoneNumberId("333333")?.slug, "karachi-broast");
      assert.equal(JSON.parse(readFileSync(path.join(dir, "karachi-broast.json"), "utf8")).orderPrefix, "KB");
    } finally {
      cfg.vendorsDir = oldDir;
      cfg.adminKey = "";
      await app.close();
    }
  });
});
