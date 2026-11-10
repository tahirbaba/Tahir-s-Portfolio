import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "node:test";
import { transcript } from "../src/chats.js";
import { runChecklist, type Probes } from "../src/checklist.js";
import { config } from "../src/config.js";
import { Store } from "../src/db.js";
import { Engine } from "../src/engine.js";
import { SCENARIOS, runScenario } from "../src/scenarios.js";
import { buildServer } from "../src/server.js";
import { usageSummary } from "../src/usage.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";
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

const engineWith = (llm: ScriptedLLM) => new Engine({ store, vendors, llm, wa, log: quiet, now: () => NOW });

describe("spam and cost protection", () => {
  it("stops answering a customer who floods, after one notice", async () => {
    const cfg = config as { customerMessagesPerHour: number };
    const old = cfg.customerMessagesPerHour;
    cfg.customerMessagesPerHour = 3;
    try {
      const llm = new ScriptedLLM([{ text: "1" }, { text: "2" }, { text: "3" }, { text: "other customer" }]);
      const engine = engineWith(llm);
      for (let i = 0; i < 6; i++) await engine.enqueue(inbound(PIZZA_NUM, "923070", { text: `msg ${i}` }));
      await engine.enqueue(inbound(PIZZA_NUM, "923071", { text: "hi" }));
      assert.equal(llm.calls.length, 4, "AI called only for allowed messages");
      const toFlooder = wa.sent.filter((s) => s.to === "923070").map((s) => s.text);
      assert.equal(toFlooder.length, 4);
      assert.match(toFlooder[3]!, /Bohat zyada messages/);
      assert.equal(wa.sent.at(-1)!.text, "other customer");
      assert.equal(usageSummary(store, vendors.get("demo-pizza")!, "2026-11").aiTurns, 4);
    } finally {
      cfg.customerMessagesPerHour = old;
    }
  });

  it("after the vendor's daily AI limit, chats go to staff", async () => {
    vendors = new VendorRegistry([
      load("vendors/demo-pizza.json", PIZZA_NUM, (raw) => (raw.limits = { aiTurnsPerDay: 2 })),
      load("vendors/demo-fastfood.json", FF_NUM),
    ]);
    const llm = new ScriptedLLM([{ text: "a" }, { text: "b" }]);
    const engine = engineWith(llm);
    await engine.enqueue(inbound(PIZZA_NUM, "923072", { text: "1" }));
    await engine.enqueue(inbound(PIZZA_NUM, "923073", { text: "2" }));
    await engine.enqueue(inbound(PIZZA_NUM, "923074", { text: "3" }));
    assert.equal(llm.calls.length, 2);
    assert.match(wa.sent.at(-1)!.text, /team ka member/);
    const staff = store.humanModeSessions("demo-pizza", NOW.getTime());
    assert.equal(staff[0]!.handoffReason, "daily AI limit reached");
  });
});

describe("go-live checklist", () => {
  const probes = (ok: boolean): Probes => ({
    claude: async () => {
      if (!ok) throw new Error("invalid x-api-key");
      return "Claude Haiku 5.5";
    },
    meta: async () => {
      if (!ok) throw new Error("Invalid OAuth access token");
      return { display: "+92 300 0000001", name: "Crust Corner", quality: "GREEN" };
    },
  });

  it("reports what is missing or rejected", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const checks = await runChecklist(vendors, engineWith(new ScriptedLLM([])), probes(true), NOW.getTime());
    const by = (name: string) => checks.find((c) => c.name === name)!;
    assert.equal(by("Claude API key").status, "fail");
    assert.equal(by("Crust Corner Pizza (Demo): WhatsApp token").status, "fail"); // token not in .env
    assert.equal(by("Crust Corner Pizza (Demo): Webhook (message aaya?)").status, "warn");
  });

  it("asks Claude and Meta when keys and ids are set", async () => {
    process.env.ANTHROPIC_API_KEY = "test";
    process.env.WA_TOKEN_DEMO_PIZZA = "token";
    try {
      const engine = engineWith(new ScriptedLLM([{ text: "hi" }]));
      await engine.enqueue(inbound(PIZZA_NUM, "923075", { text: "salam" }));
      let checks = await runChecklist(vendors, engine, probes(true), NOW.getTime());
      const pizza = (n: string) => checks.find((c) => c.name === `Crust Corner Pizza (Demo): ${n}`)!;
      assert.equal(checks.find((c) => c.name === "Claude API key")!.status, "ok");
      assert.equal(pizza("WhatsApp number").status, "ok");
      assert.match(pizza("WhatsApp number").detail, /GREEN/);
      assert.equal(pizza("Webhook (message aaya?)").status, "ok");
      checks = await runChecklist(vendors, engine, probes(false), NOW.getTime());
      assert.equal(checks.find((c) => c.name === "Claude API key")!.status, "fail");
      assert.match(checks.find((c) => c.name === "Crust Corner Pizza (Demo): WhatsApp number")!.detail, /Invalid OAuth/);
    } finally {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.WA_TOKEN_DEMO_PIZZA;
    }
  });
});

describe("chat viewer", () => {
  it("shows customer text without the system context, bot replies and tool calls", async () => {
    const llm = new ScriptedLLM([
      { tool: "add_to_cart", input: { item_id: "fries", variant: "Large", qty: 1, note: null } },
      { text: "Fries add ho gayi" },
    ]);
    await engineWith(llm).enqueue(inbound(PIZZA_NUM, "923076", { text: "large fries" }));
    const s = store.openSession("demo-pizza", "923076")!;
    const lines = transcript(s);
    assert.deepEqual(lines.map((l) => l.who), ["customer", "tool", "result", "bot"]);
    const first = lines[0]!;
    assert.ok(first.who === "customer" && first.text === "large fries" && first.context?.startsWith("[context"));

    const cfg = config as { adminKey: string };
    cfg.adminKey = "admin-secret";
    const app = buildServer({ store, vendors, engine: engineWith(new ScriptedLLM([])), logger: false });
    try {
      const h = { "x-admin-key": "admin-secret" };
      const list = (await app.inject({ method: "GET", url: "/admin/api/chats?vendor=demo-pizza", headers: h })).json();
      assert.equal(list.chats[0].preview, "large fries");
      const one = (await app.inject({ method: "GET", url: `/admin/api/chats/${list.chats[0].id}`, headers: h })).json();
      assert.equal(one.lines.length, 4);
      assert.equal((await app.inject({ method: "GET", url: "/admin/api/chats?vendor=demo-pizza" })).statusCode, 404);
    } finally {
      cfg.adminKey = "";
      await app.close();
    }
  });
});

describe("AI scenario runner", () => {
  const sc = (id: string) => SCENARIOS.find((s) => s.id === id)!;

  it("passes when the agent does the right thing", async () => {
    const llm = new ScriptedLLM([
      { tool: "add_to_cart", input: { item_id: "zinger", variant: null, qty: 2, note: null } },
      { tool: "set_fulfilment", input: { method: "pickup", pickup_branch_id: null } },
      { text: "2 Zinger, pickup, PKR 1,100. Confirm?" },
      { tool: "place_order", input: { customer_name: "John", payment_method: "cod", address_note: null, pickup_branch_id: null, scheduled_for: null } },
      { text: "done" },
    ]);
    const r = await runScenario(llm, vendors, sc("english"));
    assert.equal(r.pass, true, r.failures.join("; "));
    assert.equal(r.order!.number, "ZB-1001");
    assert.ok(r.tokens.input > 0);
  });

  it("fails with a clear reason when it does not", async () => {
    const r = await runScenario(new ScriptedLLM([{ text: "Sushi PKR 2000 ka hai" }]), vendors, sc("not-on-menu"));
    assert.equal(r.pass, false);
    assert.match(r.failures.join(" "), /mana cheez/);
    const r2 = await runScenario(new ScriptedLLM([{ text: "ok" }]), vendors, sc("complaint"));
    assert.match(r2.failures.join(" "), /staff ko nahi diya/);
  });

  it("every scenario points at a real vendor and real menu items", () => {
    for (const s of SCENARIOS) {
      const v = vendors.get(s.vendor);
      assert.ok(v, s.id);
      for (const id of [...(s.expect.items ?? []), ...(s.expect.notItems ?? [])]) {
        assert.ok(v.menu.some((m) => m.id === id), `${s.id}: ${id}`);
      }
    }
  });
});
