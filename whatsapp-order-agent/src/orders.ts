// Placing orders and moving them through the kitchen -> rider -> delivered steps.
// Customer messages are kept to a minimum because each outgoing WhatsApp message can cost money.

import { cartSummary, lineLabel, subtotal } from "./cart.js";
import type { Order, OrderStatus, PaymentMethod, Session, Store } from "./db.js";
import { estimateMinutes, quoteDelivery } from "./delivery.js";
import { hoursText, isOpen } from "./hours.js";
import type { Branch, LoadedVendor } from "./vendors.js";

export type PlaceResult =
  | { ok: true; order: Order; confirmation: string }
  | { ok: false; error: string };

export function pickupBranch(vendor: LoadedVendor, branchId: string | null | undefined): Branch | undefined {
  if (branchId) return vendor.branches.find((b) => b.id === branchId);
  return vendor.branches.length === 1 ? vendor.branches[0] : undefined;
}

export function placeOrder(
  store: Store,
  vendor: LoadedVendor,
  session: Session,
  input: {
    customer_name: string;
    payment_method: PaymentMethod;
    address_note?: string | null;
    pickup_branch_id?: string | null;
  },
  now = new Date(),
): PlaceResult {
  const cart = session.cart;
  if (cart.length === 0) return { ok: false, error: "Cart is empty. Add items first." };
  if (!session.fulfilment) return { ok: false, error: "Ask whether the customer wants delivery or pickup, then call set_fulfilment." };
  if (input.payment_method === "online" && !vendor.payment.online) {
    return { ok: false, error: "This shop does not take online payment. Only cash is available." };
  }
  if (input.payment_method === "cod" && !vendor.payment.cod) {
    return { ok: false, error: "This shop does not take cash on delivery. Ask for online payment." };
  }
  const name = input.customer_name.trim();
  if (!name) return { ok: false, error: "Ask the customer's name first." };

  const sub = subtotal(cart);
  let branch: Branch;
  let deliveryFee = 0;
  let travelMinutes = 0;

  if (session.fulfilment === "delivery") {
    if (!session.location) {
      return { ok: false, error: "No location yet. Ask the customer to share their WhatsApp location pin (📎 > Location)." };
    }
    const q = quoteDelivery(vendor, session.location, sub);
    if (!q.ok) {
      return {
        ok: false,
        error: `Location is ${q.km} km from the nearest branch (${q.nearestBranch.name}); delivery limit is ${q.maxKm} km. Offer pickup instead.`,
      };
    }
    branch = q.branch;
    deliveryFee = q.fee;
    travelMinutes = q.travelMinutes;
    if (sub < branch.delivery.minOrder) {
      return { ok: false, error: `Minimum order for delivery is ${vendor.currency} ${branch.delivery.minOrder}. Current subtotal ${sub}.` };
    }
  } else {
    const b = pickupBranch(vendor, input.pickup_branch_id);
    if (!b) {
      return {
        ok: false,
        error: `Ask which branch for pickup. Branch ids: ${vendor.branches.map((x) => `${x.id} (${x.name})`).join(", ")}.`,
      };
    }
    if (!b.pickup) return { ok: false, error: `${b.name} does not offer pickup.` };
    branch = b;
  }

  if (!isOpen(branch, now)) {
    return { ok: false, error: `${branch.name} is closed right now. Hours: ${hoursText(branch)}. Do not take the order.` };
  }

  const eta = estimateMinutes({
    prepMinutes: branch.prepMinutes,
    activeOrders: store.countActiveKitchen(vendor.slug, branch.id),
    travelMinutes,
  });
  const number = store.nextOrderNumber(vendor.slug, vendor.orderPrefix);
  const order = store.createOrder(
    {
      vendorSlug: vendor.slug,
      number,
      customer: session.customer,
      customerName: name,
      branchId: branch.id,
      fulfilment: session.fulfilment,
      items: cart,
      subtotal: sub,
      deliveryFee,
      total: sub + deliveryFee,
      paymentMethod: input.payment_method,
      paymentStatus: input.payment_method === "cod" ? "cod" : "awaiting",
      paymentNote: null,
      location: session.fulfilment === "delivery" ? session.location : null,
      addressNote: input.address_note?.trim() || null,
      status: "new",
      etaMin: eta.min,
      etaMax: eta.max,
    },
    now.getTime(),
  );
  return { ok: true, order, confirmation: confirmationText(vendor, order, branch) };
}

function money(vendor: LoadedVendor, n: number): string {
  return `${vendor.currency} ${n.toLocaleString("en-US")}`;
}

/** The one confirmation message: number, bill, ETA and payment in a single WhatsApp message. */
export function confirmationText(vendor: LoadedVendor, order: Order, branch: Branch): string {
  const ur = vendor.notifyLanguage === "roman_urdu";
  const items = order.items.map((l) => `• ${lineLabel(l)} — ${money(vendor, l.qty * l.unitPrice)}`).join("\n");
  const fee =
    order.fulfilment === "delivery"
      ? `\n${ur ? "Delivery" : "Delivery"}: ${order.deliveryFee === 0 ? (ur ? "Free" : "Free") : money(vendor, order.deliveryFee)}`
      : "";
  const when =
    order.fulfilment === "delivery"
      ? ur
        ? `⏱️ Andazan ${order.etaMin}–${order.etaMax} minute mein pohanch jayega.`
        : `⏱️ Estimated delivery: ${order.etaMin}–${order.etaMax} minutes.`
      : ur
        ? `⏱️ ${order.etaMin}–${order.etaMax} minute mein ${branch.name} pe pickup ke liye tayyar hoga.`
        : `⏱️ Ready for pickup at ${branch.name} in ${order.etaMin}–${order.etaMax} minutes.`;
  const pay =
    order.paymentMethod === "cod"
      ? ur
        ? `💵 Payment: Cash on Delivery (${money(vendor, order.total)})`
        : `💵 Payment: Cash on Delivery (${money(vendor, order.total)})`
      : ur
        ? `💳 Payment: ${vendor.payment.online}\nPayment ke baad screenshot yahin bhej dein.`
        : `💳 Payment: ${vendor.payment.online}\nPlease send the payment screenshot here.`;
  const head = ur ? `✅ Order confirm! Order # *${order.number}*` : `✅ Order confirmed! Order # *${order.number}*`;
  return `${head}\n\n${items}\nSubtotal: ${money(vendor, order.subtotal)}${fee}\n*Total: ${money(vendor, order.total)}*\n\n${when}\n${pay}`;
}

/** Allowed moves on the kitchen/rider screen. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "rejected"],
  accepted: ["ready", "rejected"],
  ready: ["out_for_delivery", "picked_up"],
  out_for_delivery: ["delivered"],
  delivered: [],
  picked_up: [],
  rejected: [],
};

export interface StatusChange {
  order: Order;
  /** Text to WhatsApp the customer, or null when no message is needed (saves cost). */
  notify: string | null;
}

export function changeStatus(
  store: Store,
  vendor: LoadedVendor,
  order: Order,
  to: OrderStatus,
  opts: { prepMinutes?: number; riderName?: string; riderPhone?: string } = {},
  now = Date.now(),
): StatusChange {
  if (!TRANSITIONS[order.status].includes(to)) {
    throw new Error(`Cannot move ${order.number} from ${order.status} to ${to}`);
  }
  if (to === "out_for_delivery" && order.fulfilment !== "delivery") throw new Error("Pickup orders are not delivered");
  if (to === "picked_up" && order.fulfilment !== "pickup") throw new Error("Use out_for_delivery for delivery orders");

  const ur = vendor.notifyLanguage === "roman_urdu";
  const patch: Parameters<Store["updateOrder"]>[1] = { status: to };
  let notify: string | null = null;

  if (to === "accepted" && opts.prepMinutes) {
    // Kitchen gave a real prep time. Tell the customer only if it is clearly later than promised.
    const elapsed = Math.round((now - order.createdAt) / 60_000);
    const branch = vendor.branches.find((b) => b.id === order.branchId);
    const travel = order.etaMin - (branch?.prepMinutes ?? 0); // travel + rush + buffer estimate
    const newMin = Math.max(order.etaMin, elapsed + opts.prepMinutes + Math.max(0, travel));
    if (newMin >= order.etaMin + 10) {
      patch.etaMin = Math.ceil(newMin / 5) * 5;
      patch.etaMax = patch.etaMin + 10;
      notify = ur
        ? `Order *${order.number}*: kitchen mein rush hai, maazrat. Naya andaza ${patch.etaMin}–${patch.etaMax} minute (order ke waqt se).`
        : `Order *${order.number}*: the kitchen is busy, sorry. New estimate ${patch.etaMin}–${patch.etaMax} minutes from order time.`;
    }
  }
  if (to === "rejected") {
    notify = ur
      ? `Maazrat, order *${order.number}* is waqt tayyar nahi ho sakta. Kisi aur cheez ke liye yahin message karein.`
      : `Sorry, order *${order.number}* can't be prepared right now. Message us here if you'd like something else.`;
  }
  if (to === "ready" && order.fulfilment === "pickup") {
    notify = ur
      ? `🍽️ Order *${order.number}* tayyar hai! Counter pe order number bata kar le lein.`
      : `🍽️ Order *${order.number}* is ready for pickup! Show your order number at the counter.`;
  }
  if (to === "out_for_delivery") {
    const rider = opts.riderName ? `${opts.riderName}${opts.riderPhone ? ` (${opts.riderPhone})` : ""}` : null;
    const cash = order.paymentMethod === "cod" ? `${money(vendor, order.total)}` : null;
    notify = ur
      ? `🛵 Order *${order.number}* rider le kar nikal gaya hai${rider ? `: ${rider}` : ""}.` +
        (cash ? ` Cash tayyar rakhein: ${cash}.` : "") +
        `\nKhana kaisa laga? 1 se 5 tak rating reply kar dein ⭐`
      : `🛵 Order *${order.number}* is on the way${rider ? ` with ${rider}` : ""}.` +
        (cash ? ` Please keep ${cash} cash ready.` : "") +
        `\nHow was it? Reply with a rating from 1 to 5 ⭐`;
  }
  return { order: store.updateOrder(order.id, patch, now), notify };
}

export function setPayment(
  store: Store,
  vendor: LoadedVendor,
  order: Order,
  status: "verified" | "not_received",
): StatusChange {
  if (order.paymentMethod !== "online") throw new Error("Not an online-payment order");
  const ur = vendor.notifyLanguage === "roman_urdu";
  const updated = store.updateOrder(order.id, { paymentStatus: status });
  const notify =
    status === "not_received"
      ? ur
        ? `Order *${order.number}*: payment abhi tak hamare account mein nahi aayi. Dobara check kar ke screenshot bhej dein, ya Cash on Delivery bata dein.`
        : `Order *${order.number}*: we haven't received the payment yet. Please check and resend the screenshot, or tell us to switch to cash on delivery.`
      : null; // verified: no message needed, food is already being made
  return { order: updated, notify };
}

export function orderStatusText(order: Order): string {
  const labels: Record<OrderStatus, string> = {
    new: "received, waiting for kitchen",
    accepted: "being prepared in the kitchen",
    ready: order.fulfilment === "pickup" ? "ready for pickup" : "ready, waiting for rider",
    out_for_delivery: "on the way with the rider",
    delivered: "delivered",
    picked_up: "picked up",
    rejected: "rejected by the shop",
  };
  const ageMin = Math.round((Date.now() - order.createdAt) / 60_000);
  return `Order ${order.number}: ${labels[order.status]}. Placed ${ageMin} min ago, estimate was ${order.etaMin}-${order.etaMax} min. Payment: ${order.paymentMethod} (${order.paymentStatus}). Items: ${order.items.map(lineLabel).join("; ")}. Total ${order.total}.`;
}

export { cartSummary };
