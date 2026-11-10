// Cart: what the customer is ordering. Prices always come from the vendor menu, never from the AI.

import type { Vendor } from "./vendors.js";
import { menuItem } from "./vendors.js";

export interface CartLine {
  itemId: string;
  name: string;
  variant?: string;
  qty: number;
  unitPrice: number;
  note?: string;
}

export type CartResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function resolveLine(
  vendor: Vendor,
  input: { item_id: string; variant?: string | null; qty: number; note?: string | null },
  /** Item ids the owner switched off today (sold out). */
  soldOut: readonly string[] = [],
): CartResult<CartLine> {
  const item = menuItem(vendor, input.item_id);
  if (!item) return { ok: false, error: `No menu item with id "${input.item_id}".` };
  if (!item.available || soldOut.includes(item.id)) {
    return { ok: false, error: `${item.name} is not available right now.` };
  }
  if (!Number.isInteger(input.qty) || input.qty < 1 || input.qty > 50) {
    return { ok: false, error: "Quantity must be a whole number from 1 to 50." };
  }
  let unitPrice: number;
  let variant: string | undefined;
  if (item.variants) {
    const wanted = input.variant?.trim().toLowerCase();
    const v = item.variants.find((x) => x.name.toLowerCase() === wanted);
    if (!v) {
      return {
        ok: false,
        error: `${item.name} needs a size/variant. Options: ${item.variants.map((x) => x.name).join(", ")}.`,
      };
    }
    unitPrice = v.price;
    variant = v.name;
  } else {
    unitPrice = item.price!;
  }
  const note = input.note?.trim() || undefined;
  return { ok: true, value: { itemId: item.id, name: item.name, variant, qty: input.qty, unitPrice, note } };
}

/** Adds a line, merging with an identical existing line. */
export function addLine(cart: CartLine[], line: CartLine): CartLine[] {
  const same = cart.findIndex(
    (l) => l.itemId === line.itemId && l.variant === line.variant && l.note === line.note,
  );
  if (same === -1) return [...cart, line];
  return cart.map((l, i) => (i === same ? { ...l, qty: Math.min(50, l.qty + line.qty) } : l));
}

export function subtotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function lineLabel(l: CartLine): string {
  return `${l.qty} x ${l.name}${l.variant ? ` (${l.variant})` : ""}${l.note ? ` [${l.note}]` : ""}`;
}

export function cartSummary(cart: CartLine[], currency: string): string {
  if (cart.length === 0) return "Cart is empty.";
  const lines = cart.map((l, i) => `${i + 1}. ${lineLabel(l)} = ${currency} ${l.qty * l.unitPrice}`);
  return `${lines.join("\n")}\nSubtotal: ${currency} ${subtotal(cart)}`;
}
