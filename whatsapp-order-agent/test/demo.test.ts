import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { Store } from "../src/db.js";
import { DemoLLM, seedDemo } from "../src/demo.js";
import { trackingData } from "../src/track/routes.js";
import { parseVendor, VendorRegistry } from "../src/vendors.js";

describe("npm run demo data", () => {
  it("fills every screen and the demo AI answers without a key", async () => {
    const vendors = new VendorRegistry(
      ["demo-pizza", "demo-fastfood"].map((s, i) => {
        const raw = JSON.parse(readFileSync(`vendors/${s}.json`, "utf8"));
        raw.whatsapp.phoneNumberId = `demo-${i}`;
        return parseVendor(raw);
      }),
    );
    const store = new Store(":memory:");
    const seed = seedDemo(store, vendors);
    const statuses = new Set(seed.orders.map((o) => o.status));
    for (const s of ["new", "accepted", "ready", "out_for_delivery", "delivered", "picked_up", "rejected"]) assert.ok(statuses.has(s as never), s);
    assert.ok(seed.orders.some((o) => o.scheduledFor), "a pre-order");
    assert.ok(seed.orders.some((o) => o.paymentStatus === "claimed"), "an online payment to verify");
    const onWay = seed.orders.find((o) => o.status === "out_for_delivery")!;
    assert.ok(trackingData(store, vendors.get("demo-pizza")!, onWay).rider!.km! > 0);
    assert.equal(store.humanModeSessions("demo-pizza").length, 1);
    assert.ok((store.usageBetween("demo-pizza", "0000", "9999").wa_service ?? 0) > 0);
    const reply = await new DemoLLM().create();
    assert.equal(reply.stop_reason, "end_turn");
  });
});
