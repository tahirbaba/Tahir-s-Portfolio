// Storage on SQLite (built into Node 22). One file, no separate database server needed.
// Every row carries vendor_slug, so vendors never see each other's data.

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type Anthropic from "@anthropic-ai/sdk";
import type { CartLine } from "./cart.js";
import type { LatLng } from "./delivery.js";

export type Fulfilment = "delivery" | "pickup";
export type OrderStatus =
  | "new"
  | "accepted"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "picked_up"
  | "rejected";
export type PaymentMethod = "cod" | "online";
export type PaymentStatus = "cod" | "awaiting" | "claimed" | "verified" | "not_received";

export interface Session {
  id: number;
  vendorSlug: string;
  customer: string;
  customerName: string | null;
  startedAt: number;
  lastAt: number;
  configHash: string;
  messages: Anthropic.MessageParam[];
  cart: CartLine[];
  location: LatLng | null;
  fulfilment: Fulfilment | null;
  mode: "bot" | "human";
  humanUntil: number | null;
  handoffReason: string | null;
  closed: boolean;
}

export interface Order {
  id: number;
  vendorSlug: string;
  number: string;
  customer: string;
  customerName: string | null;
  branchId: string;
  fulfilment: Fulfilment;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentNote: string | null;
  location: LatLng | null;
  addressNote: string | null;
  status: OrderStatus;
  etaMin: number;
  etaMax: number;
  /** Pre-orders: when the customer wants it (ms). Null = as soon as possible. */
  scheduledFor: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface VendorState {
  /** Owner paused new orders (e.g. kitchen overloaded). */
  paused: boolean;
  /** Menu item ids switched off for now (sold out). */
  unavailable: string[];
}

/** A cart built on the menu web page, waiting for the customer's WhatsApp message. */
export interface PendingCart {
  code: string;
  vendorSlug: string;
  cart: CartLine[];
  fulfilment: Fulfilment | null;
  customerName: string | null;
  paymentMethod: PaymentMethod | null;
  note: string | null;
  createdAt: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS processed_messages (
  id TEXT PRIMARY KEY,
  at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_slug TEXT NOT NULL,
  customer TEXT NOT NULL,
  customer_name TEXT,
  started_at INTEGER NOT NULL,
  last_at INTEGER NOT NULL,
  config_hash TEXT NOT NULL,
  messages TEXT NOT NULL DEFAULT '[]',
  cart TEXT NOT NULL DEFAULT '[]',
  location TEXT,
  fulfilment TEXT,
  mode TEXT NOT NULL DEFAULT 'bot',
  human_until INTEGER,
  handoff_reason TEXT,
  closed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sessions_lookup ON sessions(vendor_slug, customer, closed);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_slug TEXT NOT NULL,
  number TEXT NOT NULL,
  customer TEXT NOT NULL,
  customer_name TEXT,
  branch_id TEXT NOT NULL,
  fulfilment TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  payment_note TEXT,
  location TEXT,
  address_note TEXT,
  status TEXT NOT NULL,
  eta_min INTEGER NOT NULL,
  eta_max INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(vendor_slug, number)
);
CREATE INDEX IF NOT EXISTS orders_vendor ON orders(vendor_slug, created_at);
CREATE INDEX IF NOT EXISTS orders_customer ON orders(vendor_slug, customer, created_at);
CREATE TABLE IF NOT EXISTS counters (
  vendor_slug TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vendor_state (
  vendor_slug TEXT PRIMARY KEY,
  paused INTEGER NOT NULL DEFAULT 0,
  unavailable TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pending_carts (
  code TEXT NOT NULL,
  vendor_slug TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (vendor_slug, code)
);
`;

/** Columns added after the first release; added to older databases on start. */
const MIGRATIONS: { table: string; column: string; ddl: string }[] = [
  { table: "orders", column: "scheduled_for", ddl: "ALTER TABLE orders ADD COLUMN scheduled_for INTEGER" },
];

type Row = Record<string, unknown>;

function rowToSession(r: Row): Session {
  return {
    id: Number(r.id),
    vendorSlug: String(r.vendor_slug),
    customer: String(r.customer),
    customerName: (r.customer_name as string | null) ?? null,
    startedAt: Number(r.started_at),
    lastAt: Number(r.last_at),
    configHash: String(r.config_hash),
    messages: JSON.parse(String(r.messages)),
    cart: JSON.parse(String(r.cart)),
    location: r.location ? JSON.parse(String(r.location)) : null,
    fulfilment: (r.fulfilment as Fulfilment | null) ?? null,
    mode: r.mode === "human" ? "human" : "bot",
    humanUntil: r.human_until == null ? null : Number(r.human_until),
    handoffReason: (r.handoff_reason as string | null) ?? null,
    closed: Number(r.closed) === 1,
  };
}

function rowToOrder(r: Row): Order {
  return {
    id: Number(r.id),
    vendorSlug: String(r.vendor_slug),
    number: String(r.number),
    customer: String(r.customer),
    customerName: (r.customer_name as string | null) ?? null,
    branchId: String(r.branch_id),
    fulfilment: r.fulfilment as Fulfilment,
    items: JSON.parse(String(r.items)),
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    paymentMethod: r.payment_method as PaymentMethod,
    paymentStatus: r.payment_status as PaymentStatus,
    paymentNote: (r.payment_note as string | null) ?? null,
    location: r.location ? JSON.parse(String(r.location)) : null,
    addressNote: (r.address_note as string | null) ?? null,
    status: r.status as OrderStatus,
    etaMin: Number(r.eta_min),
    etaMax: Number(r.eta_max),
    scheduledFor: r.scheduled_for == null ? null : Number(r.scheduled_for),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export const ACTIVE_KITCHEN_STATUSES: OrderStatus[] = ["new", "accepted"];
export const OPEN_STATUSES: OrderStatus[] = ["new", "accepted", "ready", "out_for_delivery"];

export class Store {
  readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    this.db.exec(SCHEMA);
    for (const m of MIGRATIONS) {
      const cols = this.db.prepare(`PRAGMA table_info(${m.table})`).all() as Row[];
      if (!cols.some((c) => c.name === m.column)) this.db.exec(m.ddl);
    }
  }

  /** True the first time a WhatsApp message id is seen (Meta sometimes delivers twice). */
  markProcessed(messageId: string, now = Date.now()): boolean {
    const res = this.db
      .prepare("INSERT OR IGNORE INTO processed_messages (id, at) VALUES (?, ?)")
      .run(messageId, now);
    return Number(res.changes) === 1;
  }

  pruneProcessed(olderThanMs: number, now = Date.now()): void {
    this.db.prepare("DELETE FROM processed_messages WHERE at < ?").run(now - olderThanMs);
  }

  // ---- sessions ----

  openSession(vendorSlug: string, customer: string): Session | undefined {
    const r = this.db
      .prepare(
        "SELECT * FROM sessions WHERE vendor_slug = ? AND customer = ? AND closed = 0 ORDER BY id DESC LIMIT 1",
      )
      .get(vendorSlug, customer) as Row | undefined;
    return r ? rowToSession(r) : undefined;
  }

  createSession(
    vendorSlug: string,
    customer: string,
    configHash: string,
    carry: { customerName?: string | null; location?: LatLng | null } = {},
    now = Date.now(),
  ): Session {
    this.db
      .prepare("UPDATE sessions SET closed = 1 WHERE vendor_slug = ? AND customer = ? AND closed = 0")
      .run(vendorSlug, customer);
    const res = this.db
      .prepare(
        `INSERT INTO sessions (vendor_slug, customer, customer_name, started_at, last_at, config_hash, location)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        vendorSlug,
        customer,
        carry.customerName ?? null,
        now,
        now,
        configHash,
        carry.location ? JSON.stringify(carry.location) : null,
      );
    return this.getSession(Number(res.lastInsertRowid))!;
  }

  getSession(id: number): Session | undefined {
    const r = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Row | undefined;
    return r ? rowToSession(r) : undefined;
  }

  saveSession(s: Session): void {
    this.db
      .prepare(
        `UPDATE sessions SET customer_name = ?, last_at = ?, messages = ?, cart = ?, location = ?,
         fulfilment = ?, mode = ?, human_until = ?, handoff_reason = ?, closed = ? WHERE id = ?`,
      )
      .run(
        s.customerName,
        s.lastAt,
        JSON.stringify(s.messages),
        JSON.stringify(s.cart),
        s.location ? JSON.stringify(s.location) : null,
        s.fulfilment,
        s.mode,
        s.humanUntil,
        s.handoffReason,
        s.closed ? 1 : 0,
        s.id,
      );
  }

  humanModeSessions(vendorSlug: string, now = Date.now()): Session[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM sessions WHERE vendor_slug = ? AND closed = 0 AND mode = 'human' AND human_until > ? ORDER BY last_at DESC",
      )
      .all(vendorSlug, now) as Row[];
    return rows.map(rowToSession);
  }

  // ---- orders ----

  nextOrderNumber(vendorSlug: string, prefix: string): string {
    this.db
      .prepare("INSERT OR IGNORE INTO counters (vendor_slug, next_number) VALUES (?, 1001)")
      .run(vendorSlug);
    const r = this.db
      .prepare(
        "UPDATE counters SET next_number = next_number + 1 WHERE vendor_slug = ? RETURNING next_number - 1 AS n",
      )
      .get(vendorSlug) as Row;
    return `${prefix}-${Number(r.n)}`;
  }

  createOrder(o: Omit<Order, "id" | "createdAt" | "updatedAt">, now = Date.now()): Order {
    const res = this.db
      .prepare(
        `INSERT INTO orders (vendor_slug, number, customer, customer_name, branch_id, fulfilment, items,
          subtotal, delivery_fee, total, payment_method, payment_status, payment_note, location, address_note,
          status, eta_min, eta_max, scheduled_for, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        o.vendorSlug,
        o.number,
        o.customer,
        o.customerName,
        o.branchId,
        o.fulfilment,
        JSON.stringify(o.items),
        o.subtotal,
        o.deliveryFee,
        o.total,
        o.paymentMethod,
        o.paymentStatus,
        o.paymentNote,
        o.location ? JSON.stringify(o.location) : null,
        o.addressNote,
        o.status,
        o.etaMin,
        o.etaMax,
        o.scheduledFor,
        now,
        now,
      );
    return this.getOrder(Number(res.lastInsertRowid))!;
  }

  getOrder(id: number): Order | undefined {
    const r = this.db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined;
    return r ? rowToOrder(r) : undefined;
  }

  findOrder(vendorSlug: string, number: string): Order | undefined {
    const r = this.db
      .prepare("SELECT * FROM orders WHERE vendor_slug = ? AND number = ?")
      .get(vendorSlug, number.toUpperCase()) as Row | undefined;
    return r ? rowToOrder(r) : undefined;
  }

  lastOrderOf(vendorSlug: string, customer: string): Order | undefined {
    const r = this.db
      .prepare("SELECT * FROM orders WHERE vendor_slug = ? AND customer = ? ORDER BY id DESC LIMIT 1")
      .get(vendorSlug, customer) as Row | undefined;
    return r ? rowToOrder(r) : undefined;
  }

  ordersByStatus(vendorSlug: string, statuses: OrderStatus[], sinceMs = 0): Order[] {
    const marks = statuses.map(() => "?").join(",");
    const rows = this.db
      .prepare(
        `SELECT * FROM orders WHERE vendor_slug = ? AND status IN (${marks}) AND created_at >= ? ORDER BY id ASC`,
      )
      .all(vendorSlug, ...statuses, sinceMs) as Row[];
    return rows.map(rowToOrder);
  }

  countActiveKitchen(vendorSlug: string, branchId: string): number {
    const marks = ACTIVE_KITCHEN_STATUSES.map(() => "?").join(",");
    const r = this.db
      .prepare(
        `SELECT COUNT(*) AS c FROM orders WHERE vendor_slug = ? AND branch_id = ? AND status IN (${marks})`,
      )
      .get(vendorSlug, branchId, ...ACTIVE_KITCHEN_STATUSES) as Row;
    return Number(r.c);
  }

  updateOrder(
    id: number,
    patch: Partial<Pick<Order, "status" | "paymentStatus" | "paymentNote" | "etaMin" | "etaMax">>,
    now = Date.now(),
  ): Order {
    const cur = this.getOrder(id);
    if (!cur) throw new Error(`Order ${id} not found`);
    const next = { ...cur, ...patch };
    this.db
      .prepare(
        "UPDATE orders SET status = ?, payment_status = ?, payment_note = ?, eta_min = ?, eta_max = ?, updated_at = ? WHERE id = ?",
      )
      .run(next.status, next.paymentStatus, next.paymentNote, next.etaMin, next.etaMax, now, id);
    return this.getOrder(id)!;
  }

  ordersBetween(vendorSlug: string, fromMs: number, toMs: number): Order[] {
    const rows = this.db
      .prepare("SELECT * FROM orders WHERE vendor_slug = ? AND created_at >= ? AND created_at < ? ORDER BY id ASC")
      .all(vendorSlug, fromMs, toMs) as Row[];
    return rows.map(rowToOrder);
  }

  // ---- vendor live state (pause, sold-out items) ----

  vendorState(vendorSlug: string): VendorState {
    const r = this.db.prepare("SELECT * FROM vendor_state WHERE vendor_slug = ?").get(vendorSlug) as Row | undefined;
    return r ? { paused: Number(r.paused) === 1, unavailable: JSON.parse(String(r.unavailable)) } : { paused: false, unavailable: [] };
  }

  setVendorState(vendorSlug: string, state: VendorState, now = Date.now()): VendorState {
    const clean = { paused: state.paused, unavailable: [...new Set(state.unavailable)].sort() };
    this.db
      .prepare(
        `INSERT INTO vendor_state (vendor_slug, paused, unavailable, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(vendor_slug) DO UPDATE SET paused = excluded.paused, unavailable = excluded.unavailable, updated_at = excluded.updated_at`,
      )
      .run(vendorSlug, clean.paused ? 1 : 0, JSON.stringify(clean.unavailable), now);
    return clean;
  }

  // ---- carts from the menu web page ----

  savePendingCart(p: Omit<PendingCart, "createdAt">, now = Date.now()): void {
    this.db.prepare("DELETE FROM pending_carts WHERE created_at < ?").run(now - 24 * 3600_000);
    const { code, vendorSlug, ...payload } = p;
    this.db
      .prepare("INSERT INTO pending_carts (code, vendor_slug, payload, created_at) VALUES (?, ?, ?, ?)")
      .run(code, vendorSlug, JSON.stringify(payload), now);
  }

  /** Returns the cart once and removes it (a code works one time only). */
  takePendingCart(vendorSlug: string, code: string, maxAgeMs: number, now = Date.now()): PendingCart | undefined {
    const r = this.db
      .prepare("DELETE FROM pending_carts WHERE vendor_slug = ? AND code = ? RETURNING *")
      .get(vendorSlug, code.toUpperCase()) as Row | undefined;
    if (!r || now - Number(r.created_at) > maxAgeMs) return undefined;
    return { code: String(r.code), vendorSlug: String(r.vendor_slug), createdAt: Number(r.created_at), ...JSON.parse(String(r.payload)) };
  }

  /** Simple daily numbers for the owner. */
  dailyStats(vendorSlug: string, sinceMs: number): { orders: number; revenue: number; rejected: number } {
    const r = this.db
      .prepare(
        `SELECT
           SUM(CASE WHEN status != 'rejected' THEN 1 ELSE 0 END) AS orders,
           SUM(CASE WHEN status != 'rejected' THEN total ELSE 0 END) AS revenue,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
         FROM orders WHERE vendor_slug = ? AND created_at >= ?`,
      )
      .get(vendorSlug, sinceMs) as Row;
    return { orders: Number(r.orders ?? 0), revenue: Number(r.revenue ?? 0), rejected: Number(r.rejected ?? 0) };
  }
}
