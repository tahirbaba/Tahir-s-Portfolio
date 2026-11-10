// Nightly sales report to owners, sent as an approved WhatsApp template.
// The owner usually hasn't messaged the shop number in the last 24 hours, so a normal text
// message is not allowed; a "utility" template is. Checked every minute; sent once per day.

import type { Store } from "./db.js";
import type { Engine } from "./engine.js";
import { formatKarachi, karachiTime } from "./hours.js";
import { buildReport, rangeBounds } from "./report.js";
import type { LoadedVendor, VendorRegistry } from "./vendors.js";

/** Reports are only sent within this many minutes after the set time (no stale reports after downtime). */
const WINDOW_MIN = 6 * 60;

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

/** Template variables, in order: {{1}} shop, {{2}} date, {{3}} orders, {{4}} sale, {{5}} top item. */
export function reportParams(store: Store, vendor: LoadedVendor, now: number): { day: string; params: string[] } {
  const early = toMin(vendor.dailyReport.time) < 6 * 60;
  const range = early ? "yesterday" : "today";
  const r = buildReport(store, vendor, range, now);
  const { from } = rangeBounds(range, now);
  const dayLabel = formatKarachi(from).split(",")[0]!; // e.g. "Wed 11 Nov"
  const top = r.topItems[0] ? `${r.topItems[0].name} x${r.topItems[0].qty}` : "-";
  return {
    day: karachiTime(new Date(from + 60_000)).date,
    params: [vendor.name, dayLabel, String(r.orders), `${vendor.currency} ${r.revenue.toLocaleString("en-US")}`, top],
  };
}

/** Is it time to send this vendor's report? Returns the report day (YYYY-MM-DD) or null. */
export function reportDue(vendor: LoadedVendor, now: number): boolean {
  const cfg = vendor.dailyReport;
  if (!cfg.enabled || vendor.owners.length === 0) return false;
  const t = karachiTime(new Date(now));
  const since = t.minutes - toMin(cfg.time);
  return since >= 0 && since < WINDOW_MIN;
}

export async function sendReport(engine: Engine, store: Store, vendor: LoadedVendor, now: number): Promise<number> {
  const { params } = reportParams(store, vendor, now);
  let sent = 0;
  for (const owner of vendor.owners) {
    if (await engine.sendTemplate(vendor, owner, vendor.dailyReport.template, vendor.dailyReport.language, params)) sent++;
  }
  return sent;
}

/** Runs once a minute. Returns the slugs whose report went out. */
export async function runDailyReports(engine: Engine, store: Store, vendors: VendorRegistry, now = Date.now()): Promise<string[]> {
  const done: string[] = [];
  for (const vendor of vendors.all()) {
    if (!reportDue(vendor, now)) continue;
    const { day } = reportParams(store, vendor, now);
    if (!store.claimReportDay(vendor.slug, day, now)) continue; // already sent today
    if ((await sendReport(engine, store, vendor, now)) > 0) done.push(vendor.slug);
  }
  return done;
}
