// Your monthly bill for each vendor (the subscription you sell), from the vendor file's "billing" block.
//
// Rules, kept simple so you can explain them to a shop owner:
// - Trial days are free; the monthly fee is charged for the paid days of the month only (pro-rata).
// - Orders after the trial count towards the plan; above includedOrders, each order costs extraPerOrder.

import type { Store } from "./db.js";
import { monthRange } from "./usage.js";
import type { LoadedVendor } from "./vendors.js";

const DAY = 86_400_000;
const PKT = 5 * 3600_000;

/** "2026-11-20" (Pakistan date) -> start of that day in ms. */
function dayStart(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) - PKT;
}

export interface Invoice {
  vendor: string;
  name: string;
  month: string;
  plan: string;
  monthlyFee: number;
  daysInMonth: number;
  paidDays: number;
  trialUntil: string | null;
  orders: number;
  includedOrders: number;
  extraOrders: number;
  extraPerOrder: number;
  lines: { label: string; amount: number }[];
  total: number;
  currency: string;
}

export function invoiceFor(store: Store, vendor: LoadedVendor, month: string): Invoice | null {
  const b = vendor.billing;
  if (!b) return null;
  const { fromMs, toMs } = monthRange(month);
  const daysInMonth = Math.round((toMs - fromMs) / DAY);
  const trialEnd = b.trialUntil ? dayStart(b.trialUntil) + DAY : null; // first paid moment
  const paidFrom = Math.min(toMs, Math.max(fromMs, trialEnd ?? fromMs));
  const paidDays = Math.round((toMs - paidFrom) / DAY);

  const orders = store.ordersBetween(vendor.slug, paidFrom, toMs).filter((o) => o.status !== "rejected").length;
  const fee = Math.round((b.monthlyFee * paidDays) / daysInMonth);
  const extraOrders = b.includedOrders > 0 ? Math.max(0, orders - b.includedOrders) : 0;
  const extra = Math.round(extraOrders * b.extraPerOrder);

  const lines: Invoice["lines"] = [];
  if (paidDays < daysInMonth) {
    lines.push({ label: `Free trial (${daysInMonth - paidDays} din)`, amount: 0 });
  }
  if (paidDays > 0) {
    lines.push({
      label: `${b.plan} plan${paidDays < daysInMonth ? ` (${paidDays}/${daysInMonth} din)` : ""}`,
      amount: fee,
    });
  }
  if (extraOrders > 0) {
    lines.push({ label: `Extra orders: ${extraOrders} × ${vendor.currency} ${b.extraPerOrder}`, amount: extra });
  }

  return {
    vendor: vendor.slug,
    name: vendor.name,
    month,
    plan: b.plan,
    monthlyFee: b.monthlyFee,
    daysInMonth,
    paidDays,
    trialUntil: b.trialUntil ?? null,
    orders,
    includedOrders: b.includedOrders,
    extraOrders,
    extraPerOrder: b.extraPerOrder,
    lines,
    total: fee + extra,
    currency: vendor.currency,
  };
}

/** Days left in the trial (negative once over), or null without a trial. */
export function trialDaysLeft(vendor: LoadedVendor, now = Date.now()): number | null {
  const until = vendor.billing?.trialUntil;
  if (!until) return null;
  return Math.ceil((dayStart(until) + DAY - now) / DAY);
}
