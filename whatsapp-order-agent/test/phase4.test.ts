import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import { backupNow, listBackups, runDailyBackup } from "../src/backup.js";
import { invoiceFor, trialDaysLeft } from "../src/billing.js";
import { config } from "../src/config.js";
import { Store, type Order } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { confirmationText, placeOrder } from "../src/orders.js";
import { buildServer } from "../src/server.js";
import { trackingData } from "../src/track/routes.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";
import { FakeWhatsApp, inbound, ScriptedLLM } from "./helpers.js";

const PIZZA_NUM = "111111";
const FF_NUM = "222222";
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

const engineWith = (llm: ScriptedLLM) => new Engine({ store, vendors, llm, wa, log: quiet, now: () => NOW });

function order(over: Partial<Order> & { number: string }, at = Date.now()): Order {
  return store.createOrder(
    {
      vendorSlug: "demo-pizza", customer: "923050", customerName: "Ali", branchId: "gulshan", fulfilment: "delivery",
      items: [{ itemId: "fries", name: "Fries", variant: "Large", qty: 1, unitPrice: 380 }],
      subtotal: 380, deliveryFee: 100, total: 480, paymentMethod: "cod", paymentStatus: "cod", paymentNote: null,
      location: { lat: 24.925, lng: 67.095 }, addressNote: null, status: "new", etaMin: 35, etaMax: 45, scheduledFor: null,
      ...over,
    },
    at,
  );
}

function withPublicUrl<T>(url: string, fn: () => T): T {
  const cfg = config as { publicUrl: string };
  const old = cfg.publicUrl;
  cfg.publicUrl = url;
  try {
    return fn();
  } finally {
    cfg.publicUrl = old;
  }
}

describe("customer tracking page", () => {
  it("every order gets a unique secret link, shown in messages only on https", () => {
    const a = order({ number: "CC-1" });
    const b = order({ number: "CC-2" });
    assert.match(a.trackToken, /^[A-Za-z0-9_-]{12}$/);
    assert.notEqual(a.trackToken, b.trackToken);
    const v = vendors.get("demo-pizza")!;
    const branch = v.branches[0]!;
    assert.doesNotMatch(confirmationText(v, a, branch), /\/t\//);
    withPublicUrl("https://shop.example", () => {
      assert.match(confirmationText(v, a, branch), new RegExp(`https://shop.example/t/${a.trackToken}`));
    });
  });

  it("shows steps, and the rider's distance while the GPS is fresh", () => {
    const v = vendors.get("demo-pizza")!;
    const o = order({ number: "CC-3" });
    store.updateOrder(o.id, { status: "out_for_delivery", riderName: "Imran", riderPhone: "923000000081" });
    const now = Date.now();
    store.setRiderLocation("demo-pizza", "923000000081", 24.935, 67.1, now - 60_000);
    const d = trackingData(store, v, store.getOrder(o.id)!, now);
    assert.deepEqual(d.steps.map((s) => s.done), [true, true, true, true, false]);
    assert.equal(d.steps[3]!.current, true);
    assert.equal(d.rider!.name, "Imran");
    assert.ok(d.rider!.km! > 0 && d.rider!.minutes! > 0);
    assert.match(d.rider!.mapUrl!, /google.com\/maps\/dir/);
    // Stale GPS (older than 5 min) is not shown.
    const later = trackingData(store, v, store.getOrder(o.id)!, now + 10 * 60_000);
    assert.equal(later.rider!.km, null);
  });

  it("public page works with the token and expires after a day", async () => {
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const fresh = order({ number: "CC-4" });
    const old = order({ number: "CC-5" }, Date.now() - 25 * 3600_000);
    const page = await app.inject({ method: "GET", url: `/t/${fresh.trackToken}` });
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /CC-4/);
    assert.equal(page.headers["x-robots-tag"], "noindex");
    assert.equal((await app.inject({ method: "GET", url: `/t/${old.trackToken}` })).statusCode, 404);
    assert.equal((await app.inject({ method: "GET", url: "/t/not-a-real-token" })).statusCode, 404);
    const api = (await app.inject({ method: "GET", url: `/t/${fresh.trackToken}/api` })).json();
    assert.equal(api.number, "CC-4");
    assert.equal(api.status, "new");
    await app.close();
  });

  it("rider page shares GPS for its own rider only", async () => {
    process.env.RIDER_KEY_DEMO_PIZZA = "rider-key";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    const h = { "x-rider-key": "rider-key" };
    const ok = await app.inject({ method: "POST", url: "/r/demo-pizza/api/location", headers: h, payload: { rider: 1, lat: 24.9, lng: 67.1 } });
    assert.equal(ok.statusCode, 200);
    assert.equal(store.riderLocation("demo-pizza", "923000000082")!.lat, 24.9);
    const bad = await app.inject({ method: "POST", url: "/r/demo-pizza/api/location", headers: h, payload: { rider: 1, lat: 999, lng: 67 } });
    assert.equal(bad.statusCode, 400);
    await app.close();
  });
});

describe("loyalty", () => {
  it("every 10th order gets the free item at price 0", () => {
    const v = vendors.get("demo-pizza")!;
    for (let i = 0; i < 8; i++) order({ number: `CC-L${i}`, customer: "923060", status: "delivered" }, NOW.getTime() - 86_400_000);
    order({ number: "CC-LR", customer: "923060", status: "rejected" }, NOW.getTime() - 86_400_000); // not counted
    const place = () => {
      const s = store.createSession("demo-pizza", "923060", v.configHash);
      s.cart = [{ itemId: "fries", name: "Fries", variant: "Large", qty: 1, unitPrice: 380 }];
      s.fulfilment = "pickup";
      const r = placeOrder(store, v, s, { customer_name: "Ali", payment_method: "cod", pickup_branch_id: "gulshan" }, NOW);
      assert.ok(r.ok);
      return r;
    };
    const ninth = place();
    assert.equal(ninth.order.items.length, 1);
    const tenth = place();
    assert.equal(tenth.order.items.length, 2);
    assert.equal(tenth.order.items[1]!.name, "🎁 FREE Soft Drink 345ml");
    assert.equal(tenth.order.items[1]!.unitPrice, 0);
    assert.equal(tenth.order.total, 380);
    assert.match(tenth.confirmation, /10th order/);
  });

  it("the agent sees loyalty progress and the vendor file is checked", async () => {
    for (let i = 0; i < 9; i++) order({ number: `CC-P${i}`, customer: "923061", status: "delivered" });
    const llm = new ScriptedLLM([{ text: "ok" }]);
    await engineWith(llm).enqueue(inbound(PIZZA_NUM, "923061", { text: "hi" }));
    assert.match(JSON.stringify(llm.calls[0]!.messages), /loyalty: 9 orders so far; free Soft Drink 345ml on every 10th order \(the NEXT order/);
    const raw = JSON.parse(readFileSync("vendors/demo-pizza.json", "utf8"));
    raw.loyalty.rewardItemId = "caviar";
    assert.throws(() => parseVendor(raw), /rewardItemId/);
  });
});

describe("backups", () => {
  it("makes a readable copy, keeps only the newest, and runs once a day", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "bk-"));
    order({ number: "CC-B1" });
    const day = (h: number, d = 11) => new Date(Date.UTC(2026, 10, d, h - 5, 0)).getTime(); // Karachi hour
    for (const d of [8, 9, 10, 11]) backupNow(store, day(5, d), dir, 3);
    const files = listBackups(dir);
    assert.deepEqual(files.map((f) => f.name), ["agent-2026-11-11-0500.db", "agent-2026-11-10-0500.db", "agent-2026-11-09-0500.db"]);
    const copy = new Store(path.join(dir, files[0]!.name));
    assert.equal(copy.findOrder("demo-pizza", "CC-B1")?.number, "CC-B1");

    const cfg = config.backup as { dir: string };
    const oldDir = cfg.dir;
    cfg.dir = mkdtempSync(path.join(tmpdir(), "bk2-"));
    try {
      assert.equal(runDailyBackup(store, day(4)), null); // before 05:00
      assert.ok(runDailyBackup(store, day(6)));
      assert.equal(runDailyBackup(store, day(7)), null); // already done today
      assert.equal(listBackups().length, 1);
      assert.ok(existsSync(path.join(cfg.dir, "agent-2026-11-11-0600.db")));
    } finally {
      cfg.dir = oldDir;
    }
  });
});

describe("billing", () => {
  it("charges a full month and extra orders above the plan", () => {
    const v = vendors.get("demo-fastfood")!; // Starter: 4000, 1000 included, 5 per extra
    const base = { vendorSlug: "demo-fastfood", branchId: "main" };
    for (let i = 0; i < 3; i++) order({ ...base, number: `ZB-${i}` }, NOW.getTime());
    const raw = JSON.parse(readFileSync("vendors/demo-fastfood.json", "utf8"));
    raw.billing.includedOrders = 1;
    const tight = parseVendor(raw);
    const inv = invoiceFor(store, tight, "2026-11")!;
    assert.equal(inv.orders, 3);
    assert.equal(inv.extraOrders, 2);
    assert.equal(inv.total, 4000 + 10);
    assert.equal(invoiceFor(store, v, "2026-11")!.total, 4000);
  });

  it("trial days are free and the fee is pro-rata", () => {
    const v = vendors.get("demo-pizza")!; // Standard 7000, trial until 2026-11-14
    order({ number: "CC-T1" }, new Date("2026-11-10T10:00:00Z").getTime()); // during trial: not billed
    order({ number: "CC-T2" }, new Date("2026-11-20T10:00:00Z").getTime());
    const inv = invoiceFor(store, v, "2026-11")!;
    assert.equal(inv.paidDays, 16);
    assert.equal(inv.total, Math.round((7000 * 16) / 30));
    assert.equal(inv.orders, 1);
    assert.equal(invoiceFor(store, v, "2026-10")!.total, 0); // whole month in trial
    assert.equal(trialDaysLeft(v, new Date("2026-11-12T10:00:00Z").getTime()), 3);
  });

  it("admin billing list and printable invoice need the key", async () => {
    const cfg = config as { adminKey: string };
    cfg.adminKey = "admin-secret";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    try {
      assert.equal((await app.inject({ method: "GET", url: "/admin/invoice/demo-pizza?month=2026-11" })).statusCode, 404);
      const page = await app.inject({ method: "GET", url: "/admin/invoice/demo-pizza?month=2026-11&key=admin-secret" });
      assert.equal(page.statusCode, 200);
      assert.match(page.body, /INVOICE/);
      assert.match(page.body, /CC-202611/);
      const list = (await app.inject({ method: "GET", url: "/admin/api/billing?month=2026-11", headers: { "x-admin-key": "admin-secret" } })).json();
      assert.equal(list.invoices.length, 2);
      const backups = await app.inject({ method: "GET", url: "/admin/api/backups/..%2Fagent.db", headers: { "x-admin-key": "admin-secret" } });
      assert.equal(backups.statusCode, 404);
    } finally {
      cfg.adminKey = "";
      await app.close();
    }
  });
});
