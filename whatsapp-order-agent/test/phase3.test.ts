import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "node:test";
import { config } from "../src/config.js";
import { Store, type Order } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { buildReport } from "../src/report.js";
import { reportDue, reportParams, runDailyReports } from "../src/scheduler.js";
import { buildServer } from "../src/server.js";
import { monthRange, usageSummary } from "../src/usage.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";
import { templateParam } from "../src/whatsapp/client.js";
import { FakeWhatsApp, inbound, ScriptedLLM } from "./helpers.js";

const PIZZA_NUM = "111111";
const FF_NUM = "222222";
const NOW = new Date("2026-11-11T15:00:00Z"); // Wed 20:00 Karachi
const quiet = { info() {}, warn() {}, error() {} };

function load(file: string, phoneNumberId: string, patch: (raw: any) => void = () => {}) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  raw.whatsapp.phoneNumberId = phoneNumberId;
  patch(raw);
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

function order(over: Partial<Order> & { number: string }, at = NOW.getTime()): Order {
  return store.createOrder(
    {
      vendorSlug: "demo-pizza", customer: "923030", customerName: "Ali", branchId: "gulshan", fulfilment: "delivery",
      items: [{ itemId: "chicken-tikka-pizza", name: "Chicken Tikka Pizza", variant: "Large", qty: 1, unitPrice: 1500 }],
      subtotal: 1500, deliveryFee: 100, total: 1600, paymentMethod: "cod", paymentStatus: "cod", paymentNote: null,
      location: { lat: 24.92, lng: 67.09 }, addressNote: "House 7", status: "ready", etaMin: 35, etaMax: 45, scheduledFor: null,
      ...over,
    },
    at,
  );
}

describe("usage meter", () => {
  it("counts chats, AI tokens and WhatsApp messages, and estimates cost", async () => {
    const engine = engineWith(new ScriptedLLM([{ text: "a" }, { text: "b" }, { text: "c" }]));
    await engine.enqueue(inbound(PIZZA_NUM, "923031", { text: "hi" }));
    await engine.enqueue(inbound(PIZZA_NUM, "923031", { text: "menu?" }));
    await engine.enqueue(inbound(PIZZA_NUM, "923032", { text: "salam" }));
    order({ number: "CC-5000", status: "delivered" });

    const rates = config.rates as { waFreePerMonth: number };
    const oldFree = rates.waFreePerMonth;
    rates.waFreePerMonth = 1; // pretend the free allowance is used up
    try {
      const u = usageSummary(store, vendors.get("demo-pizza")!, "2026-11");
      assert.equal(u.conversations, 2);
      assert.equal(u.aiTurns, 3);
      assert.equal(u.waService, 3);
      assert.equal(u.waBillable, 2);
      assert.equal(u.tokens.input, 30); // scripted model reports 10 input tokens per call
      assert.equal(u.orders, 1);
      assert.equal(u.cost.meta, Math.round(2 * config.rates.waServiceUsd * config.rates.usdToPkr));
      assert.equal(u.cost.total, u.cost.meta + u.cost.ai);
      // Other vendors and other months are separate.
      assert.equal(usageSummary(store, vendors.get("demo-fastfood")!, "2026-11").waService, 0);
      assert.equal(usageSummary(store, vendors.get("demo-pizza")!, "2026-10").waService, 0);
    } finally {
      rates.waFreePerMonth = oldFree;
    }
  });

  it("month ranges follow Pakistan time", () => {
    const r = monthRange("2026-11");
    assert.equal(r.fromDay, "2026-11-01");
    assert.equal(r.toDay, "2026-11-30");
    assert.equal(new Date(r.fromMs).toISOString(), "2026-10-31T19:00:00.000Z");
    assert.throws(() => monthRange("Nov"));
  });
});

describe("rider page", () => {
  it("rider takes a ready order, customer is told once, cash is tracked", async () => {
    process.env.RIDER_KEY_DEMO_PIZZA = "rider-key";
    const engine = engineWith(new ScriptedLLM([]));
    const app = buildServer({ store, vendors, engine, logger: false });
    const h = { "x-rider-key": "rider-key" };
    const o = order({ number: "CC-6001" });
    order({ number: "CC-6002", fulfilment: "pickup", location: null }); // pickup orders are not for riders

    assert.equal((await app.inject({ method: "GET", url: "/r/demo-pizza?key=wrong" })).statusCode, 404);
    assert.equal((await app.inject({ method: "GET", url: "/r/demo-fastfood?key=rider-key" })).statusCode, 404); // no rider page

    let state = (await app.inject({ method: "GET", url: "/r/demo-pizza/api/state?rider=0", headers: h })).json();
    assert.equal(state.me, "Imran");
    assert.deepEqual(state.ready.map((x: { number: string }) => x.number), ["CC-6001"]);
    assert.equal(state.ready[0].collect, 1600);

    const take = await app.inject({ method: "POST", url: `/r/demo-pizza/api/orders/${o.id}/take`, headers: h, payload: { rider: 0 } });
    assert.equal(take.statusCode, 200);
    assert.equal(wa.sent.length, 1);
    assert.match(wa.sent[0]!.text, /Imran \(923000000081\)/);
    const again = await app.inject({ method: "POST", url: `/r/demo-pizza/api/orders/${o.id}/take`, headers: h, payload: { rider: 1 } });
    assert.equal(again.statusCode, 409);

    const wrongRider = await app.inject({ method: "POST", url: `/r/demo-pizza/api/orders/${o.id}/delivered`, headers: h, payload: { rider: 1, cash: true } });
    assert.equal(wrongRider.statusCode, 409);
    const done = await app.inject({ method: "POST", url: `/r/demo-pizza/api/orders/${o.id}/delivered`, headers: h, payload: { rider: 0, cash: true } });
    assert.equal(done.statusCode, 200);
    assert.equal(store.getOrder(o.id)!.cashCollected, true);
    assert.equal(wa.sent.length, 1, "delivered does not message the customer");

    state = (await app.inject({ method: "GET", url: "/r/demo-pizza/api/state?rider=0", headers: h })).json();
    assert.deepEqual(state.today, { delivered: 1, cash: 1600 });

    const report = buildReport(store, vendors.get("demo-pizza")!, "today", NOW.getTime());
    assert.deepEqual(report.riders, [{ name: "Imran", deliveries: 1, cash: 1600, cashPending: 0 }]);
    await app.close();
  });

  it("kitchen screen can pick a listed rider", async () => {
    process.env.OPS_KEY_DEMO_PIZZA = "kitchen-key";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const o = order({ number: "CC-6003" });
    const r = await app.inject({
      method: "POST", url: `/ops/demo-pizza/api/orders/${o.id}/status`, headers: { "x-ops-key": "kitchen-key" },
      payload: { to: "out_for_delivery", riderIndex: 1 },
    });
    assert.equal(r.statusCode, 200);
    assert.equal(store.getOrder(o.id)!.riderName, "Bilal");
    const state = (await app.inject({ method: "GET", url: "/ops/demo-pizza/api/state", headers: { "x-ops-key": "kitchen-key" } })).json();
    assert.deepEqual(state.riders, ["Imran", "Bilal"]);
    await app.close();
  });
});

describe("reorder", () => {
  it("copies the last order at today's prices and skips sold-out items", async () => {
    order({
      number: "CC-7001", customer: "923040", status: "delivered",
      items: [
        { itemId: "chicken-tikka-pizza", name: "Chicken Tikka Pizza", variant: "Large", qty: 1, unitPrice: 1400 }, // old price
        { itemId: "wings", name: "Hot Wings (6 pcs)", qty: 1, unitPrice: 500 },
      ],
    }, NOW.getTime() - 3 * 86_400_000);
    store.setVendorState("demo-pizza", { paused: false, unavailable: ["wings"] });
    const llm = new ScriptedLLM([{ tool: "reorder_last", input: {} }, { text: "Pichla order cart mein" }]);
    await engineWith(llm).enqueue(inbound(PIZZA_NUM, "923040", { text: "pichla wala order dobara" }));
    const s = store.openSession("demo-pizza", "923040")!;
    assert.equal(s.cart.length, 1);
    assert.equal(s.cart[0]!.unitPrice, 1650); // today's menu price
    const toolResult = JSON.stringify(llm.calls[1]!.messages.at(-1));
    assert.match(toolResult, /Hot Wings.*not available/);
  });
});

describe("nightly owner report", () => {
  const withReport = (time: string) =>
    load("vendors/demo-pizza.json", PIZZA_NUM, (raw) => {
      raw.dailyReport = { enabled: true, time, template: "daily_sales_report", language: "en" };
    });

  it("is due only in the window after the set time", () => {
    const v = withReport("23:45");
    const at = (iso: string) => new Date(`${iso}Z`).getTime() - 5 * 3600_000; // Karachi wall time
    assert.equal(reportDue(v, at("2026-11-11T23:44:00")), false);
    assert.equal(reportDue(v, at("2026-11-11T23:46:00")), true);
    assert.equal(reportDue(vendors.get("demo-pizza")!, at("2026-11-11T23:46:00")), false); // disabled in the demo file
  });

  it("sends the template once per day with the day's numbers", async () => {
    vendors = new VendorRegistry([withReport("19:30"), load("vendors/demo-fastfood.json", FF_NUM)]);
    order({ number: "CC-8001", status: "delivered" }, NOW.getTime() - 3600_000);
    order({ number: "CC-8002", status: "new" }, NOW.getTime() - 60_000);
    const engine = engineWith(new ScriptedLLM([]));
    assert.deepEqual(await runDailyReports(engine, store, vendors, NOW.getTime()), ["demo-pizza"]);
    assert.deepEqual(await runDailyReports(engine, store, vendors, NOW.getTime() + 60_000), []);
    assert.equal(wa.templates.length, 1);
    const t = wa.templates[0]!;
    assert.equal(t.to, "923000000091");
    assert.equal(t.template, "daily_sales_report");
    assert.deepEqual(t.params, ["Crust Corner Pizza (Demo)", "Wed 11 Nov", "2", "PKR 3,200", "Chicken Tikka Pizza (Large) x2"]);
    assert.equal(usageSummary(store, vendors.get("demo-pizza")!, "2026-11").waTemplate, 1);
  });

  it("an early-morning time reports the previous day", () => {
    const v = withReport("01:00");
    const twoAm = new Date("2026-11-12T02:00:00Z").getTime() - 5 * 3600_000;
    assert.equal(reportParams(store, v, twoAm).params[1], "Wed 11 Nov");
  });

  it("cleans template variables the way Meta requires", () => {
    assert.equal(templateParam("a\nb\t c      d"), "a b  c   d"); // no new lines/tabs, never 4+ spaces
    assert.equal(templateParam("   "), "-");
  });
});
