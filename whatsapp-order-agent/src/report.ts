// Sales report for the owner (WhatsApp "#report" command and the Report tab on the kitchen screen).

import type { Order, Store } from "./db.js";
import type { LoadedVendor } from "./vendors.js";

const PKT_OFFSET_MS = 5 * 3600_000;
const DAY_MS = 86_400_000;

export type ReportRange = "today" | "yesterday" | "week";

export function startOfDayPkt(ms: number): number {
  const local = ms + PKT_OFFSET_MS;
  return local - (local % DAY_MS) - PKT_OFFSET_MS;
}

export function rangeBounds(range: ReportRange, now = Date.now()): { from: number; to: number; label: string } {
  const today = startOfDayPkt(now);
  if (range === "yesterday") return { from: today - DAY_MS, to: today, label: "Kal (yesterday)" };
  if (range === "week") return { from: today - 6 * DAY_MS, to: now + 1, label: "Pichle 7 din" };
  return { from: today, to: now + 1, label: "Aaj (today)" };
}

export interface Report {
  label: string;
  orders: number;
  revenue: number;
  avgOrder: number;
  delivery: number;
  pickup: number;
  cod: number;
  online: number;
  preorders: number;
  rejected: number;
  topItems: { name: string; qty: number }[];
  /** Per rider: delivered orders and COD cash (collected / still to hand over). */
  riders: { name: string; deliveries: number; cash: number; cashPending: number }[];
}

export function buildReport(store: Store, vendor: LoadedVendor, range: ReportRange, now = Date.now()): Report {
  const { from, to, label } = rangeBounds(range, now);
  const all = store.ordersBetween(vendor.slug, from, to);
  const ok = all.filter((o) => o.status !== "rejected");
  const revenue = ok.reduce((s, o) => s + o.total, 0);
  const qty = new Map<string, number>();
  for (const o of ok) {
    for (const l of o.items) {
      const name = l.variant ? `${l.name} (${l.variant})` : l.name;
      qty.set(name, (qty.get(name) ?? 0) + l.qty);
    }
  }
  return {
    label,
    orders: ok.length,
    revenue,
    avgOrder: ok.length ? Math.round(revenue / ok.length) : 0,
    delivery: ok.filter((o) => o.fulfilment === "delivery").length,
    pickup: ok.filter((o) => o.fulfilment === "pickup").length,
    cod: ok.filter((o) => o.paymentMethod === "cod").length,
    online: ok.filter((o) => o.paymentMethod === "online").length,
    preorders: ok.filter((o) => o.scheduledFor != null).length,
    rejected: all.length - ok.length,
    riders: riderTotals(ok),
    topItems: [...qty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, q]) => ({ name, qty: q })),
  };
}

function riderTotals(orders: Order[]): Report["riders"] {
  const m = new Map<string, Report["riders"][number]>();
  for (const o of orders) {
    if (!o.riderName || o.status !== "delivered") continue;
    const r = m.get(o.riderName) ?? { name: o.riderName, deliveries: 0, cash: 0, cashPending: 0 };
    r.deliveries++;
    if (o.paymentMethod === "cod") {
      if (o.cashCollected) r.cash += o.total;
      else r.cashPending += o.total;
    }
    m.set(o.riderName, r);
  }
  return [...m.values()].sort((a, b) => b.deliveries - a.deliveries);
}

export function reportText(vendor: LoadedVendor, r: Report): string {
  const money = (n: number) => `${vendor.currency} ${n.toLocaleString("en-US")}`;
  const top = r.topItems.length ? r.topItems.map((t, i) => `${i + 1}. ${t.name} × ${t.qty}`).join("\n") : "—";
  return [
    `📊 *${vendor.name}* — ${r.label}`,
    ``,
    `Orders: *${r.orders}*  |  Sale: *${money(r.revenue)}*`,
    `Average order: ${money(r.avgOrder)}`,
    `Delivery ${r.delivery} · Pickup ${r.pickup}`,
    `COD ${r.cod} · Online ${r.online}`,
    r.preorders ? `Pre-orders: ${r.preorders}` : null,
    r.rejected ? `Reject: ${r.rejected}` : null,
    ``,
    `🔥 Top items:`,
    top,
    ...(r.riders.length
      ? [
          ``,
          `🛵 Riders:`,
          ...r.riders.map(
            (x) => `${x.name}: ${x.deliveries} delivery · cash ${money(x.cash)}${x.cashPending ? ` (baqi ${money(x.cashPending)})` : ""}`,
          ),
        ]
      : []),
  ]
    .filter((x) => x !== null)
    .join("\n");
}
