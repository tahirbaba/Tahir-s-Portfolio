import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { addLine, resolveLine, subtotal } from "../src/cart.js";
import { estimateMinutes, feeForDistance, quoteDelivery } from "../src/delivery.js";
import { isOpen } from "../src/hours.js";
import { parseVendor } from "../src/vendors.js";

const pizza = parseVendor(JSON.parse(readFileSync("vendors/demo-pizza.json", "utf8")));
const fastfood = parseVendor(JSON.parse(readFileSync("vendors/demo-fastfood.json", "utf8")));
const gulshan = pizza.branches[0]!;

// 2026-11-11 is a Wednesday. Karachi = UTC+5.
const pkt = (iso: string) => new Date(new Date(`${iso}Z`).getTime() - 5 * 3600_000);

describe("opening hours", () => {
  it("open in the evening, closed in the morning", () => {
    assert.equal(isOpen(gulshan, pkt("2026-11-11T20:00:00")), true);
    assert.equal(isOpen(gulshan, pkt("2026-11-11T10:00:00")), false);
  });
  it("handles closing after midnight (12:00-03:00)", () => {
    assert.equal(isOpen(gulshan, pkt("2026-11-12T02:30:00")), true); // Thu 02:30, from Wed shift
    assert.equal(isOpen(gulshan, pkt("2026-11-12T03:30:00")), false);
  });
  it("Friday opens later", () => {
    assert.equal(isOpen(gulshan, pkt("2026-11-13T13:00:00")), false);
    assert.equal(isOpen(gulshan, pkt("2026-11-13T14:30:00")), true);
  });
});

describe("delivery fee rules", () => {
  it("slabs pick the first matching slab", () => {
    const rule = gulshan.delivery.rule;
    assert.equal(feeForDistance(rule, 1.2), 100);
    assert.equal(feeForDistance(rule, 3), 100);
    assert.equal(feeForDistance(rule, 4.5), 150);
  });
  it("per km charges whole extra km after the included distance", () => {
    const rule = pizza.branches[1]!.delivery.rule; // 80 + 25/km after 2 km
    assert.equal(feeForDistance(rule, 1.5), 80);
    assert.equal(feeForDistance(rule, 3.2), 80 + 2 * 25);
  });
  it("free rule is always 0", () => {
    assert.equal(feeForDistance({ type: "free" }, 3.9), 0);
  });
});

describe("delivery quote", () => {
  it("chooses the nearest branch", () => {
    const nearJohar = { lat: 24.912, lng: 67.128 };
    const q = quoteDelivery(pizza, nearJohar, 1500);
    assert.ok(q.ok);
    assert.equal(q.branch.id, "johar");
  });
  it("waives the fee above the free-delivery amount", () => {
    const near = { lat: 24.925, lng: 67.095 };
    const cheap = quoteDelivery(pizza, near, 1500);
    const big = quoteDelivery(pizza, near, 3200);
    assert.ok(cheap.ok && big.ok);
    assert.ok(cheap.fee > 0);
    assert.equal(big.fee, 0);
    assert.equal(big.feeWaived, true);
  });
  it("refuses locations outside every branch's range", () => {
    const clifton = { lat: 24.8138, lng: 67.0300 };
    const q = quoteDelivery(fastfood, clifton, 2000);
    assert.equal(q.ok, false);
  });
});

describe("ETA", () => {
  it("adds rush time and rounds to 5 minutes", () => {
    assert.deepEqual(estimateMinutes({ prepMinutes: 20, activeOrders: 0, travelMinutes: 9 }), { min: 35, max: 45 });
    assert.deepEqual(estimateMinutes({ prepMinutes: 20, activeOrders: 4, travelMinutes: 9 }), { min: 50, max: 60 });
    assert.deepEqual(estimateMinutes({ prepMinutes: 15, activeOrders: 0, travelMinutes: 0 }), { min: 15, max: 25 });
  });
});

describe("cart", () => {
  it("takes prices from the menu, not from the caller", () => {
    const r = resolveLine(pizza, { item_id: "chicken-tikka-pizza", variant: "large", qty: 2 });
    assert.ok(r.ok);
    assert.equal(r.value.unitPrice, 1650);
    assert.equal(r.value.variant, "Large");
  });
  it("asks for a size when the item has sizes", () => {
    const r = resolveLine(pizza, { item_id: "chicken-tikka-pizza", variant: null, qty: 1 });
    assert.equal(r.ok, false);
  });
  it("rejects unavailable or unknown items", () => {
    assert.equal(resolveLine(fastfood, { item_id: "mint-margarita", qty: 1 }).ok, false);
    assert.equal(resolveLine(fastfood, { item_id: "sushi", qty: 1 }).ok, false);
  });
  it("merges identical lines", () => {
    const a = resolveLine(fastfood, { item_id: "zinger", qty: 1 });
    assert.ok(a.ok);
    const cart = addLine(addLine([], a.value), a.value);
    assert.equal(cart.length, 1);
    assert.equal(cart[0]!.qty, 2);
    assert.equal(subtotal(cart), 1100);
  });
});

describe("vendor validation", () => {
  it("rejects an item with both price and variants", () => {
    const bad = JSON.parse(readFileSync("vendors/demo-fastfood.json", "utf8"));
    bad.menu[0].variants = [{ name: "Big", price: 1 }];
    assert.throws(() => parseVendor(bad), /either price or variants/);
  });
});
