import type { BetaTool } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { POLICIES } from "@/data/policies";
import { STORE, daysBetween, findOrder, type Order } from "@/data/store";

/* ---------------------------------------------------------------------------
 * Session state travels with the conversation, so the demo works on stateless
 * serverless functions. Every business rule is enforced here in code; the
 * model can ask for anything, but only policy-compliant actions go through.
 * ------------------------------------------------------------------------- */

export type ActionType = "refund" | "return" | "address_change" | "cancellation" | "escalation";
export type Action = {
  id: string;
  type: ActionType;
  orderId?: string;
  amount?: number;
  reason?: string;
  status: "done" | "pending_approval";
  detail?: string;
};
export type SessionState = { verified: string[]; failedVerifications: number; actions: Action[] };
export const emptyState = (): SessionState => ({ verified: [], failedVerifications: 0, actions: [] });

const REFUND_REASONS = ["damaged", "defective", "not_as_described", "late_delivery", "lost"] as const;
const ESCALATION_REASONS = ["legal", "chargeback", "safety", "harassment", "requested_human", "out_of_policy", "other"] as const;

export const TOOLS: BetaTool[] = [
  {
    name: "verify_order",
    description: "Verify the customer's identity with an order number and the email address used for that order. Must succeed before sharing any order details or taking any action on that order. Returns order status, items, dates, tracking and how much is still refundable.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "Order number, e.g. NH-1001" },
        email: { type: "string", description: "Email address the customer gave" },
      },
      required: ["order_id", "email"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_policy",
    description: "Search the store's support policies. Use it before answering any policy question or deciding on refunds, returns, address changes or escalation. Returns matching policy sections with ids to cite.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "What you need to know, in English" } },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "issue_refund",
    description: `Refund money on a verified order. Refunds up to ${STORE.autoRefundLimit} USD are issued immediately; larger refunds are submitted for human approval. The tool enforces eligibility and returns an error with the reason when a refund is not allowed. Never promise a refund before this tool confirms it.`,
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        amount: { type: "number", description: "Amount in USD" },
        reason: { type: "string", enum: [...REFUND_REASONS] },
      },
      required: ["order_id", "amount", "reason"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "start_return",
    description: "Start a change-of-mind return for a verified, delivered order and issue a prepaid return label. The refund happens after the item arrives at the warehouse.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "update_address",
    description: "Change the shipping address of a verified order that is still processing.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" }, new_address: { type: "string" } },
      required: ["order_id", "new_address"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "cancel_order",
    description: "Cancel a verified order that is still processing. The full amount is refunded.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "escalate_to_human",
    description: "Hand the conversation to a human care agent with a summary, so the customer does not repeat themselves. Use for legal threats, chargebacks, safety issues, harassment, explicit requests for a person, or anything outside policy.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", enum: [...ESCALATION_REASONS] },
        priority: { type: "string", enum: ["normal", "high"] },
        summary: { type: "string", description: "Two or three sentences in English for the human agent" },
        order_id: { type: "string", description: "Verified order number, or empty string if none" },
      },
      required: ["reason", "priority", "summary", "order_id"],
      additionalProperties: false,
    },
    strict: true,
  },
];

/* ----------------------------- helpers ----------------------------- */

const refundedInSession = (s: SessionState, orderId: string) =>
  s.actions.filter((a) => a.type === "refund" && a.orderId === orderId).reduce((t, a) => t + (a.amount || 0), 0);

export function remainingRefundable(o: Order, s: SessionState): number {
  const cancelledRefund = s.actions.some((a) => a.type === "cancellation" && a.orderId === o.id) ? o.total : 0;
  return Math.max(0, +(o.total - o.priorRefunds - refundedInSession(s, o.id) - cancelledRefund).toFixed(2));
}

export function orderFacts(o: Order, s: SessionState) {
  const daysSinceDelivery = o.deliveredAt ? daysBetween(o.deliveredAt, STORE.today) : null;
  const lateBy = o.deliveredAt ? daysBetween(o.eta, o.deliveredAt) : daysBetween(o.eta, STORE.today);
  const daysSinceScan = o.lastScanAt ? daysBetween(o.lastScanAt, STORE.today) : null;
  return {
    order_id: o.id,
    customer_first_name: o.customer.split(" ")[0],
    status: s.actions.some((a) => a.type === "cancellation" && a.orderId === o.id) ? "cancelled" : o.status,
    items: o.items.map((i) => `${i.qty} x ${i.name} (${i.price} USD each)`),
    shipping_fee: o.shipping,
    order_total: o.total,
    already_refunded: +(o.priorRefunds + refundedInSession(s, o.id)).toFixed(2),
    still_refundable: remainingRefundable(o, s),
    placed_at: o.placedAt,
    estimated_delivery: o.eta,
    delivered_at: o.deliveredAt ?? null,
    days_since_delivery: daysSinceDelivery,
    delivered_late_by_days: o.deliveredAt && lateBy > 0 ? lateBy : 0,
    days_since_last_carrier_scan: daysSinceScan,
    carrier: o.carrier,
    tracking: o.tracking,
    shipping_address: s.actions.find((a) => a.type === "address_change" && a.orderId === o.id)?.detail ?? o.address,
    store_today: STORE.today,
  };
}

function nextId(s: SessionState, prefix: string) {
  return `${prefix}-${String(4100 + s.actions.length + 1)}`;
}

export function searchPolicy(query: string, k = 3) {
  const terms = query.toLowerCase().match(/[a-z]+/g) ?? [];
  const scored = POLICIES.map((p) => {
    const hay = `${p.title} ${p.text}`.toLowerCase();
    const score = terms.reduce((n, t) => (t.length > 2 && hay.includes(t) ? n + (p.title.toLowerCase().includes(t) ? 3 : 1) : n), 0);
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  return scored.map(({ p }) => ({ id: p.id, title: p.title, text: p.text }));
}

/* ----------------------------- executor ----------------------------- */

export type ToolOutcome = { result: Record<string, unknown>; state: SessionState; isError: boolean };

const fail = (state: SessionState, error: string, extra: Record<string, unknown> = {}): ToolOutcome => ({
  result: { ok: false, error, ...extra },
  state,
  isError: true,
});

function verifiedOrder(state: SessionState, id: string): Order | string {
  const o = findOrder(id || "");
  if (!o || !state.verified.includes(o.id)) return "Order not verified in this conversation. Call verify_order with the order number and email first.";
  return o;
}

export function executeTool(name: string, input: Record<string, unknown>, prev: SessionState): ToolOutcome {
  const state: SessionState = structuredClone(prev);
  const str = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : "");

  switch (name) {
    case "verify_order": {
      if (state.failedVerifications >= 3) return fail(state, "Too many failed verification attempts. Offer to escalate to a human.");
      const o = findOrder(str("order_id"));
      const ok = !!o && o.email.toLowerCase() === str("email").trim().toLowerCase();
      if (!ok || !o) {
        state.failedVerifications += 1;
        return fail(state, "The order number and email do not match our records. Do not reveal whether the order exists.");
      }
      if (!state.verified.includes(o.id)) state.verified.push(o.id);
      return { result: { ok: true, order: orderFacts(o, state) }, state, isError: false };
    }

    case "search_policy": {
      const hits = searchPolicy(str("query"));
      return { result: { ok: true, sections: hits.length ? hits : POLICIES.slice(0, 2) }, state, isError: false };
    }

    case "issue_refund": {
      const o = verifiedOrder(state, str("order_id"));
      if (typeof o === "string") return fail(state, o);
      const amount = Number(input.amount);
      const reason = str("reason") as (typeof REFUND_REASONS)[number];
      const facts = orderFacts(o, state);
      if (!(amount > 0)) return fail(state, "Refund amount must be greater than zero.");
      if (facts.status === "cancelled") return fail(state, "This order is cancelled and was already refunded.");
      if (amount > facts.still_refundable) return fail(state, `Amount exceeds what is still refundable (${facts.still_refundable} USD).`, { still_refundable: facts.still_refundable });
      if (state.actions.some((a) => a.type === "refund" && a.orderId === o.id && a.reason === reason)) {
        return fail(state, "A refund for this reason was already processed in this conversation.");
      }
      if (reason === "lost") {
        if (facts.status !== "lost") return fail(state, "The order is not marked as lost. Lost status needs 10+ days without a carrier scan.");
      } else if (reason === "late_delivery") {
        if (facts.status !== "delivered" || facts.delivered_late_by_days <= STORE.lateDeliveryGraceDays) {
          return fail(state, `Late-delivery refunds apply only when delivered more than ${STORE.lateDeliveryGraceDays} days after the estimate (POL-3).`);
        }
        if (o.shipping === 0) return fail(state, "Shipping was free, so no shipping refund applies. Store credit is handled by the care team: escalate if the customer wants it (POL-3).");
        if (amount > o.shipping) return fail(state, `Late-delivery refunds cover the shipping fee only (${o.shipping} USD) (POL-3).`);
      } else {
        if (facts.status !== "delivered") return fail(state, "Damage and quality refunds apply only to delivered orders.");
        if ((facts.days_since_delivery ?? 999) > STORE.refundWindowDays) {
          return fail(state, `Outside the ${STORE.refundWindowDays}-day refund window (delivered ${facts.days_since_delivery} days ago) (POL-1). Offer escalation for a repair or replacement review.`);
        }
      }
      const pending = amount > STORE.autoRefundLimit;
      const action: Action = { id: nextId(state, pending ? "APR" : "RF"), type: "refund", orderId: o.id, amount, reason, status: pending ? "pending_approval" : "done" };
      state.actions.push(action);
      return {
        result: pending
          ? { ok: true, status: "pending_approval", approval_id: action.id, message: `Refund of ${amount} USD submitted for care-lead approval within one business day (POL-2).` }
          : { ok: true, status: "refunded", refund_id: action.id, amount, message: "Refund issued to the original payment method (POL-10)." },
        state,
        isError: false,
      };
    }

    case "start_return": {
      const o = verifiedOrder(state, str("order_id"));
      if (typeof o === "string") return fail(state, o);
      const f = orderFacts(o, state);
      if (f.status !== "delivered") return fail(state, "Returns are only possible for delivered orders.");
      if ((f.days_since_delivery ?? 999) > STORE.refundWindowDays) return fail(state, `Outside the ${STORE.refundWindowDays}-day return window (POL-5).`);
      if (state.actions.some((a) => a.type === "return" && a.orderId === o.id)) return fail(state, "A return was already started for this order.");
      const action: Action = { id: nextId(state, "RMA"), type: "return", orderId: o.id, status: "done" };
      state.actions.push(action);
      return { result: { ok: true, return_id: action.id, label_url: `https://returns.nimbushome.example/${action.id}`, message: "Prepaid label issued. Refund follows once the item reaches the warehouse (POL-5)." }, state, isError: false };
    }

    case "update_address": {
      const o = verifiedOrder(state, str("order_id"));
      if (typeof o === "string") return fail(state, o);
      const f = orderFacts(o, state);
      if (f.status !== "processing") return fail(state, `Address can only change while processing; this order is ${f.status}. The customer can ask ${o.carrier} to redirect using tracking ${o.tracking} (POL-6).`);
      const addr = str("new_address").trim();
      if (addr.length < 8) return fail(state, "Please collect the full new address first.");
      const action: Action = { id: nextId(state, "ADR"), type: "address_change", orderId: o.id, status: "done", detail: addr };
      state.actions.push(action);
      return { result: { ok: true, change_id: action.id, new_address: addr }, state, isError: false };
    }

    case "cancel_order": {
      const o = verifiedOrder(state, str("order_id"));
      if (typeof o === "string") return fail(state, o);
      const f = orderFacts(o, state);
      if (f.status !== "processing") return fail(state, `Only processing orders can be cancelled; this order is ${f.status} (POL-6).`);
      const action: Action = { id: nextId(state, "CXL"), type: "cancellation", orderId: o.id, amount: f.still_refundable, status: "done" };
      state.actions.push(action);
      return { result: { ok: true, cancellation_id: action.id, refunded: action.amount }, state, isError: false };
    }

    case "escalate_to_human": {
      const reason = str("reason");
      const orderId = str("order_id");
      const verified = orderId && state.verified.includes(findOrder(orderId)?.id ?? "") ? findOrder(orderId)!.id : undefined;
      const action: Action = { id: nextId(state, "ESC"), type: "escalation", orderId: verified, reason, status: "done", detail: str("summary").slice(0, 600) };
      state.actions.push(action);
      return { result: { ok: true, case_id: action.id, message: str("priority") === "high" ? "A care lead will reply within 2 hours." : "A care agent will reply within one business day." }, state, isError: false };
    }

    default:
      return fail(state, `Unknown tool ${name}`);
  }
}
