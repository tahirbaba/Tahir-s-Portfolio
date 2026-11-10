// Usage meter: what each vendor costs to run, per month. Used in the admin panel to price packages.
//
// Counted while the system runs (usage_daily table, Pakistan dates):
//   wa_service   free-form WhatsApp messages we sent (bot replies, status updates, owner replies)
//   wa_template  template messages we sent (nightly owner report)
//   ai_input / ai_cache_read / ai_cache_write / ai_output   Claude tokens
//   ai_turns     customer messages answered by the AI
//   conversations  new chats started
// Orders and sales come from the orders table.

import { config } from "./config.js";
import type { Store } from "./db.js";
import { karachiTime } from "./hours.js";
import type { LoadedVendor } from "./vendors.js";

export type Metric =
  | "wa_service"
  | "wa_template"
  | "ai_input"
  | "ai_cache_read"
  | "ai_cache_write"
  | "ai_output"
  | "ai_turns"
  | "conversations";

export function pktDay(now: Date | number): string {
  return karachiTime(new Date(now)).date;
}

export function record(store: Store, vendorSlug: string, metric: Metric, value: number, now: Date | number = Date.now()): void {
  store.addUsage(vendorSlug, pktDay(now), metric, value);
}

/** "2026-11" -> first and last day, plus the epoch range for order queries (Pakistan time). */
export function monthRange(month: string): { fromDay: string; toDay: string; fromMs: number; toMs: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error('month must look like "2026-11"');
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const offset = 5 * 3600_000;
  const fromMs = Date.UTC(y, mo - 1, 1) - offset;
  const toMs = Date.UTC(y, mo, 1) - offset;
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return { fromDay: `${month}-01`, toDay: `${month}-${String(lastDay).padStart(2, "0")}`, fromMs, toMs };
}

export function currentMonth(now = Date.now()): string {
  return pktDay(now).slice(0, 7);
}

export interface UsageSummary {
  vendor: string;
  name: string;
  month: string;
  conversations: number;
  aiTurns: number;
  orders: number;
  revenue: number;
  waService: number;
  waFree: number;
  waBillable: number;
  waTemplate: number;
  tokens: { input: number; cacheRead: number; cacheWrite: number; output: number };
  /** Estimates in PKR. */
  cost: { meta: number; ai: number; total: number; perOrder: number; perConversation: number };
}

export function usageSummary(store: Store, vendor: LoadedVendor, month: string): UsageSummary {
  const { fromDay, toDay, fromMs, toMs } = monthRange(month);
  const u = store.usageBetween(vendor.slug, fromDay, toDay);
  const orders = store.ordersBetween(vendor.slug, fromMs, toMs).filter((o) => o.status !== "rejected");
  const r = config.rates;

  const waService = u.wa_service ?? 0;
  const waFree = Math.min(waService, r.waFreePerMonth);
  const waBillable = waService - waFree;
  const waTemplate = u.wa_template ?? 0;
  const tokens = {
    input: u.ai_input ?? 0,
    cacheRead: u.ai_cache_read ?? 0,
    cacheWrite: u.ai_cache_write ?? 0,
    output: u.ai_output ?? 0,
  };
  const metaUsd = waBillable * r.waServiceUsd + waTemplate * r.waUtilityUsd;
  const aiUsd =
    (tokens.input * r.aiInputUsd +
      tokens.cacheRead * r.aiCacheReadUsd +
      tokens.cacheWrite * r.aiCacheWriteUsd +
      tokens.output * r.aiOutputUsd) /
    1_000_000;
  const pkr = (usd: number) => Math.round(usd * r.usdToPkr);
  const meta = pkr(metaUsd);
  const ai = pkr(aiUsd);
  const conversations = u.conversations ?? 0;

  return {
    vendor: vendor.slug,
    name: vendor.name,
    month,
    conversations,
    aiTurns: u.ai_turns ?? 0,
    orders: orders.length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
    waService,
    waFree,
    waBillable,
    waTemplate,
    tokens,
    cost: {
      meta,
      ai,
      total: meta + ai,
      perOrder: orders.length ? Math.round(((meta + ai) / orders.length) * 10) / 10 : 0,
      perConversation: conversations ? Math.round(((meta + ai) / conversations) * 10) / 10 : 0,
    },
  };
}
