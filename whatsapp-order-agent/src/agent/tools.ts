// Tools the AI can call. Every tool runs our own code: the AI decides WHAT to do,
// the code decides prices, fees, ETA and order numbers.

import type Anthropic from "@anthropic-ai/sdk";
import { addLine, cartSummary, resolveLine, subtotal } from "../cart.js";
import { config } from "../config.js";
import type { Session, Store } from "../db.js";
import { estimateMinutes, quoteDelivery } from "../delivery.js";
import { hoursText, isOpen } from "../hours.js";
import { orderStatusText, pickupBranch, placeOrder } from "../orders.js";
import type { LoadedVendor } from "../vendors.js";

const str = { type: "string" } as const;
const nullableStr = { anyOf: [{ type: "string" }, { type: "null" }] } as const;
const nullableNum = { anyOf: [{ type: "number" }, { type: "null" }] } as const;

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
): Anthropic.Tool {
  return {
    name,
    description,
    strict: true,
    input_schema: {
      type: "object",
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
  };
}

export const TOOLS: Anthropic.Tool[] = [
  tool("add_to_cart", "Add a menu item to the customer's cart. Use the exact menu id. Pass variant (size) when the item has sizes, else null.", {
    item_id: str,
    variant: nullableStr,
    qty: { type: "integer" },
    note: { ...nullableStr, description: "Customer request like 'less spicy', or null" },
  }),
  tool("remove_from_cart", "Remove a cart line by its number (1-based, as shown by view_cart).", {
    line: { type: "integer" },
  }),
  tool("view_cart", "Show the current cart with line numbers and subtotal.", {}),
  tool(
    "set_fulfilment",
    "Set delivery or pickup. For delivery it uses the customer's shared location and returns the branch, fee and estimated time. For pickup give the branch id (or null if there is only one branch).",
    {
      method: { type: "string", enum: ["delivery", "pickup"] },
      pickup_branch_id: nullableStr,
    },
  ),
  tool("place_order", "Place the order after the customer clearly confirmed the final total. Returns the order number and the confirmation message to send.", {
    customer_name: str,
    payment_method: { type: "string", enum: ["cod", "online"] },
    address_note: { ...nullableStr, description: "House/flat/street/landmark the customer typed, or null" },
    pickup_branch_id: nullableStr,
    scheduled_for: {
      ...nullableStr,
      description: 'Pre-order time in Pakistan time as "YYYY-MM-DD HH:MM" (use the date in the [context] line), or null for as soon as possible',
    },
  }),
  tool("order_status", "Get the status of the customer's order. Pass the order number, or null for their latest order.", {
    order_number: nullableStr,
  }),
  tool("record_payment_proof", "Record a payment screenshot the customer sent, for the shop to verify.", {
    order_number: nullableStr,
    amount: nullableNum,
    reference: { ...nullableStr, description: "Transaction id from the screenshot, or null" },
  }),
  tool("handoff_to_human", "Pass this chat to the shop staff. The bot stops replying in this chat for a while.", {
    reason: str,
  }),
];

export interface ToolContext {
  store: Store;
  vendor: LoadedVendor;
  session: Session;
  now: Date;
  /** Set when place_order succeeded during this turn. */
  placedConfirmation?: string;
  /** Set when handoff_to_human was called. */
  handedOff?: string;
}

type Input = Record<string, any>;

function json(obj: unknown): string {
  return JSON.stringify(obj);
}

export function runTool(name: string, input: Input, ctx: ToolContext): { content: string; isError: boolean } {
  try {
    const out = dispatch(name, input, ctx);
    return { content: out, isError: false };
  } catch (err) {
    return { content: `Error: ${(err as Error).message}`, isError: true };
  }
}

function dispatch(name: string, input: Input, ctx: ToolContext): string {
  const { store, vendor, session } = ctx;
  switch (name) {
    case "add_to_cart": {
      const r = resolveLine(vendor, input as any, store.vendorState(vendor.slug).unavailable);
      if (!r.ok) return json({ ok: false, error: r.error });
      session.cart = addLine(session.cart, r.value);
      return json({ ok: true, cart: cartSummary(session.cart, vendor.currency) });
    }
    case "remove_from_cart": {
      const idx = Number(input.line) - 1;
      if (!session.cart[idx]) return json({ ok: false, error: "No such line", cart: cartSummary(session.cart, vendor.currency) });
      session.cart = session.cart.filter((_, i) => i !== idx);
      return json({ ok: true, cart: cartSummary(session.cart, vendor.currency) });
    }
    case "view_cart":
      return json({ cart: cartSummary(session.cart, vendor.currency) });
    case "set_fulfilment": {
      const sub = subtotal(session.cart);
      if (input.method === "pickup") {
        const b = pickupBranch(vendor, input.pickup_branch_id);
        if (!b) {
          return json({ ok: false, error: "Which branch?", branches: vendor.branches.map((x) => ({ id: x.id, name: x.name, address: x.address })) });
        }
        if (!b.pickup) return json({ ok: false, error: `${b.name} has no pickup.` });
        session.fulfilment = "pickup";
        const eta = estimateMinutes({ prepMinutes: b.prepMinutes, activeOrders: store.countActiveKitchen(vendor.slug, b.id), travelMinutes: 0 });
        return json({ ok: true, method: "pickup", branch: b.name, address: b.address, open_now: isOpen(b, ctx.now), ready_in_minutes: `${eta.min}-${eta.max}`, subtotal: sub, total: sub });
      }
      session.fulfilment = "delivery";
      if (!session.location) {
        return json({ ok: false, error: "No location yet. Ask the customer to share a WhatsApp location pin (📎 > Location)." });
      }
      const q = quoteDelivery(vendor, session.location, sub);
      if (!q.ok) {
        return json({ ok: false, error: `Outside delivery area: ${q.km} km from ${q.nearestBranch.name}, limit ${q.maxKm} km. Offer pickup.` });
      }
      const eta = estimateMinutes({ prepMinutes: q.branch.prepMinutes, activeOrders: store.countActiveKitchen(vendor.slug, q.branch.id), travelMinutes: q.travelMinutes });
      const d = q.branch.delivery;
      return json({
        ok: true,
        method: "delivery",
        branch: q.branch.name,
        distance_km: q.km,
        delivery_fee: q.fee,
        fee_waived_free_above: q.feeWaived,
        free_delivery_above: d.freeAbove ?? null,
        minimum_order: d.minOrder,
        subtotal: sub,
        total: sub + q.fee,
        eta_minutes: `${eta.min}-${eta.max}`,
        open_now: isOpen(q.branch, ctx.now),
        hours: hoursText(q.branch),
      });
    }
    case "place_order": {
      if (ctx.placedConfirmation) return json({ ok: false, error: "An order was already placed in this turn." });
      const r = placeOrder(store, vendor, session, input as any, ctx.now);
      if (!r.ok) return json({ ok: false, error: r.error });
      ctx.placedConfirmation = r.confirmation;
      session.customerName = r.order.customerName;
      session.cart = [];
      return json({ ok: true, order_number: r.order.number, confirmation: r.confirmation });
    }
    case "order_status": {
      const o = input.order_number
        ? store.findOrder(vendor.slug, String(input.order_number))
        : store.lastOrderOf(vendor.slug, session.customer);
      if (!o || o.customer !== session.customer) return json({ ok: false, error: "No order found for this customer." });
      return json({ ok: true, status: orderStatusText(o) });
    }
    case "record_payment_proof": {
      const o = input.order_number
        ? store.findOrder(vendor.slug, String(input.order_number))
        : store.lastOrderOf(vendor.slug, session.customer);
      if (!o || o.customer !== session.customer) return json({ ok: false, error: "No order found for this customer." });
      if (o.paymentMethod !== "online") return json({ ok: false, error: "This order is cash on delivery; no payment proof needed." });
      const note = `Screenshot: amount ${input.amount ?? "?"}, ref ${input.reference ?? "?"}`;
      store.updateOrder(o.id, { paymentStatus: "claimed", paymentNote: note });
      return json({ ok: true, order_number: o.number, expected_total: o.total, message: "Saved. The shop will verify the payment." });
    }
    case "handoff_to_human": {
      const reason = String(input.reason ?? "").slice(0, 300) || "customer needs staff";
      session.mode = "human";
      session.humanUntil = ctx.now.getTime() + config.humanModeMinutes * 60_000;
      session.handoffReason = reason;
      ctx.handedOff = reason;
      return json({ ok: true, message: "Staff notified. Tell the customer a team member will reply in this chat soon." });
    }
    default:
      return json({ ok: false, error: `Unknown tool ${name}` });
  }
}
