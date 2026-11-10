import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import { config } from "../src/config.js";
import { Store } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { cleanMenu, mergeSettings } from "../src/portal/routes.js";
import { buildServer } from "../src/server.js";
import { listHistory } from "../src/vendorFiles.js";
import { VendorRegistry } from "../src/vendors.js";
import { FakeWhatsApp, ScriptedLLM } from "./helpers.js";

const cfg = config as { vendorsDir: string; adminKey: string };
const H = { "x-owner-key": "owner-key" };
let dir: string;
let oldDir: string;
let vendors: VendorRegistry;
let app: FastifyInstance;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "vendors-"));
  cpSync("vendors", dir, { recursive: true });
  oldDir = cfg.vendorsDir;
  cfg.vendorsDir = dir;
  process.env.OWNER_KEY_DEMO_PIZZA = "owner-key";
  vendors = VendorRegistry.fromDir(dir);
  const store = new Store(":memory:");
  const engine = new Engine({ store, vendors, llm: new ScriptedLLM([]), wa: new FakeWhatsApp(), log: { info() {}, warn() {}, error() {} } });
  app = buildServer({ store, vendors, engine, logger: false });
});

afterEach(async () => {
  cfg.vendorsDir = oldDir;
  delete process.env.OWNER_KEY_DEMO_PIZZA;
  await app.close();
});

const file = () => JSON.parse(readFileSync(path.join(dir, "demo-pizza.json"), "utf8"));
const getData = async () => (await app.inject({ method: "GET", url: "/o/demo-pizza/api/data", headers: H })).json();

describe("owner portal", () => {
  it("needs the owner key and is off for vendors without one", async () => {
    assert.equal((await app.inject({ method: "GET", url: "/o/demo-pizza?key=wrong" })).statusCode, 404);
    assert.equal((await app.inject({ method: "GET", url: "/o/demo-pizza?key=owner-key" })).statusCode, 200);
    process.env.OWNER_KEY_DEMO_FASTFOOD = "owner-key";
    assert.equal((await app.inject({ method: "GET", url: "/o/demo-fastfood/api/data", headers: H })).statusCode, 200);
    delete process.env.OWNER_KEY_DEMO_FASTFOOD;
    assert.equal((await app.inject({ method: "GET", url: "/o/demo-fastfood/api/data", headers: H })).statusCode, 404);
  });

  it("a price change is saved and used by the bot at once", async () => {
    const d = await getData();
    const tikka = d.menu.find((m: { id: string }) => m.id === "chicken-tikka-pizza");
    tikka.variants.find((v: { name: string }) => v.name === "Large").price = 1799;
    const before = vendors.get("demo-pizza")!.configHash;
    const r = await app.inject({ method: "PUT", url: "/o/demo-pizza/api/menu", headers: H, payload: { menu: d.menu } });
    assert.equal(r.statusCode, 200, r.body);
    const live = vendors.get("demo-pizza")!;
    assert.equal(live.menu.find((m) => m.id === "chicken-tikka-pizza")!.variants!.find((v) => v.name === "Large")!.price, 1799);
    assert.notEqual(live.configHash, before, "running chats restart with the new menu");
    assert.equal(file().menu.find((m: { id: string }) => m.id === "chicken-tikka-pizza").variants[2].price, 1799);
    assert.equal(listHistory("demo-pizza")[0]!.by, "owner");
  });

  it("owners cannot change WhatsApp ids, keys, billing or limits", async () => {
    const d = await getData();
    const r = await app.inject({
      method: "PUT", url: "/o/demo-pizza/api/settings", headers: H,
      payload: { branches: d.branches, payment: { cod: true }, whatsapp: { phoneNumberId: "hacked" }, billing: { monthlyFee: 0 }, opsKeyEnv: "X" },
    });
    assert.equal(r.statusCode, 200);
    const f = file();
    assert.equal(f.whatsapp.phoneNumberId, "REPLACE_WITH_PHONE_NUMBER_ID_1");
    assert.equal(f.billing.monthlyFee, 7000);
    assert.equal(f.opsKeyEnv, "OPS_KEY_DEMO_PIZZA");
    assert.equal(f.payment.online, undefined, "online removed because the owner left it empty");
  });

  it("a bad value is refused with the item's name, and the file stays as it was", async () => {
    const d = await getData();
    const garlic = d.menu.find((m: { id: string }) => m.id === "garlic-bread");
    garlic.price = "";
    const before = readFileSync(path.join(dir, "demo-pizza.json"), "utf8");
    const r = await app.inject({ method: "PUT", url: "/o/demo-pizza/api/menu", headers: H, payload: { menu: d.menu } });
    assert.equal(r.statusCode, 400);
    assert.match(r.json().error, /"Garlic Bread \(4 pcs\)"/);
    assert.equal(readFileSync(path.join(dir, "demo-pizza.json"), "utf8"), before);
    assert.equal(listHistory("demo-pizza").length, 0);
  });

  it("deleting the loyalty reward item is refused", async () => {
    const d = await getData();
    const menu = d.menu.filter((m: { id: string }) => m.id !== "drink-345");
    const r = await app.inject({ method: "PUT", url: "/o/demo-pizza/api/menu", headers: H, payload: { menu } });
    assert.equal(r.statusCode, 400);
    assert.match(r.json().error, /rewardItemId/);
  });

  it("new items get an id from their name; undo brings the old menu back", async () => {
    const d = await getData();
    d.menu.push({ name: "Molten Lava Cake", category: "Desserts", price: 450, available: true });
    d.menu.push({ name: "Molten Lava Cake", category: "Desserts", price: 500, available: true });
    let r = await app.inject({ method: "PUT", url: "/o/demo-pizza/api/menu", headers: H, payload: { menu: d.menu } });
    assert.equal(r.statusCode, 200, r.body);
    const ids = vendors.get("demo-pizza")!.menu.map((m) => m.id);
    assert.ok(ids.includes("molten-lava-cake") && ids.includes("molten-lava-cake-2"));

    r = await app.inject({ method: "POST", url: "/o/demo-pizza/api/undo", headers: H });
    assert.equal(r.statusCode, 200);
    assert.ok(!vendors.get("demo-pizza")!.menu.some((m) => m.id === "molten-lava-cake"));
    assert.equal(listHistory("demo-pizza")[0]!.by, "undo");
    r = await app.inject({ method: "POST", url: "/o/demo-pizza/api/undo", headers: H }); // undo the undo
    assert.ok(vendors.get("demo-pizza")!.menu.some((m) => m.id === "molten-lava-cake"));
  });

  it("timings and delivery charges can be changed per branch", async () => {
    const d = await getData();
    const g = d.branches.find((b: { id: string }) => b.id === "gulshan");
    g.hours.mon = null;
    g.hours.tue = { open: "13:00", close: "01:30" };
    g.delivery = { rule: { type: "flat", fee: "120" }, maxKm: "6", freeAbove: "", minOrder: "500" };
    g.prepMinutes = "25";
    const r = await app.inject({
      method: "PUT", url: "/o/demo-pizza/api/settings", headers: H,
      payload: { branches: d.branches, payment: { cod: true, online: "Raast 0300" }, faq: ["Halal", " "], upsell: "" },
    });
    assert.equal(r.statusCode, 200, r.body);
    const b = vendors.get("demo-pizza")!.branches.find((x) => x.id === "gulshan")!;
    assert.equal(b.hours.mon, null);
    assert.deepEqual(b.hours.tue, { open: "13:00", close: "01:30" });
    assert.deepEqual(b.delivery.rule, { type: "flat", fee: 120 });
    assert.equal(b.delivery.freeAbove, undefined);
    assert.equal(b.prepMinutes, 25);
    assert.equal(b.name, "Gulshan Branch (University Road)", "name and location stay");
    const v = vendors.get("demo-pizza")!;
    assert.deepEqual(v.faq, ["Halal"]);
    assert.equal(v.upsell, undefined);
    assert.equal(v.payment.online, "Raast 0300");
  });

  it("bad times are refused", async () => {
    const d = await getData();
    d.branches[0].hours.wed = { open: "25:00", close: "02:00" };
    const r = await app.inject({ method: "PUT", url: "/o/demo-pizza/api/settings", headers: H, payload: { branches: d.branches } });
    assert.equal(r.statusCode, 400);
    assert.match(r.json().error, /Gulshan Branch/);
  });

  it("the admin panel's saves also keep history", async () => {
    cfg.adminKey = "admin-secret";
    try {
      const raw = file();
      raw.name = "Crust Corner Pizza (Renamed)";
      const r = await app.inject({ method: "PUT", url: "/admin/api/vendors/demo-pizza", headers: { "x-admin-key": "admin-secret" }, payload: { json: JSON.stringify(raw) } });
      assert.equal(r.statusCode, 200);
      assert.equal(listHistory("demo-pizza")[0]!.by, "admin");
    } finally {
      cfg.adminKey = "";
    }
  });
});

describe("portal input cleaning", () => {
  it("drops unknown fields and turns blanks into errors, not zeros", () => {
    const [a] = cleanMenu([{ name: " Tea ", category: "Drinks", price: "", hack: 1, available: true }]);
    assert.deepEqual(Object.keys(a!).sort(), ["available", "category", "id", "name", "price"]);
    assert.ok(Number.isNaN(a!.price));
    assert.equal(a!.name, "Tea");
    assert.throws(() => cleanMenu("nope"));
    assert.throws(() => mergeSettings({ branches: [{ id: "x" }] }, { branches: [{ id: "x", delivery: { rule: { type: "weird" } } }] }), /type ghalat/);
  });
});
