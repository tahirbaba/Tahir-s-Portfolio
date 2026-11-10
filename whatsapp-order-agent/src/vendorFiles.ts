// Saving vendor files safely, for both the admin panel and the owner portal:
// validate -> keep the old version in vendors/.history/ -> atomic write -> apply live (no restart).

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { parseVendor, type LoadedVendor, type VendorRegistry } from "./vendors.js";

/** How many old versions to keep per vendor. */
const HISTORY_KEEP = 30;

export type ValidateResult = { ok: true; vendor: LoadedVendor } | { ok: false; error: string };

export function vendorFile(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("bad slug");
  return path.join(config.vendorsDir, `${slug}.json`);
}

function historyDir(): string {
  return path.join(config.vendorsDir, ".history");
}

export function readVendorRaw(slug: string): Record<string, unknown> | null {
  const file = vendorFile(slug);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

export function validateVendorRaw(raw: unknown, slug: string, registry: VendorRegistry): ValidateResult {
  try {
    const v = parseVendor(raw, `${slug}.json`);
    if (v.slug !== slug) return { ok: false, error: `"slug" ("${v.slug}") file ke naam ("${slug}") jaisa hona chahiye.` };
    const other = registry.byPhoneNumberId(v.whatsapp.phoneNumberId);
    if (other && other.slug !== slug) return { ok: false, error: `phoneNumberId pehle se "${other.slug}" ka hai.` };
    const prefixClash = registry.all().find((x) => x.slug !== slug && x.orderPrefix === v.orderPrefix);
    if (prefixClash) return { ok: false, error: `orderPrefix "${v.orderPrefix}" pehle se "${prefixClash.slug}" use kar raha hai.` };
    return { ok: true, vendor: v };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export interface HistoryEntry {
  name: string;
  at: number;
  by: string;
}

/** Validates and saves; the previous file goes to the history first. Throws nothing: returns the result. */
export function saveVendorRaw(raw: unknown, slug: string, registry: VendorRegistry, by: "admin" | "owner", now = Date.now()): ValidateResult {
  const r = validateVendorRaw(raw, slug, registry);
  if (!r.ok) return r;
  const file = vendorFile(slug);
  if (existsSync(file)) {
    mkdirSync(historyDir(), { recursive: true });
    const name = `${slug}.${now}.${by}.json`;
    writeFileSync(path.join(historyDir(), name), readFileSync(file));
    for (const old of listHistory(slug).slice(HISTORY_KEEP)) unlinkSync(path.join(historyDir(), old.name));
  }
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(raw, null, 2) + "\n");
  renameSync(tmp, file); // atomic: never a half-written file
  registry.upsert(r.vendor);
  return r;
}

export function listHistory(slug: string): HistoryEntry[] {
  const dir = historyDir();
  if (!existsSync(dir)) return [];
  const re = new RegExp(`^${slug}\\.(\\d+)\\.(admin|owner|undo)\\.json$`);
  return readdirSync(dir)
    .map((name) => {
      const m = re.exec(name);
      return m ? { name, at: Number(m[1]), by: m[2]! } : null;
    })
    .filter((x): x is HistoryEntry => x !== null)
    .sort((a, b) => b.at - a.at);
}

/** Puts back the most recent old version (the current one goes to the history, so undo can be undone). */
export function undoLast(slug: string, registry: VendorRegistry, now = Date.now()): ValidateResult {
  const last = listHistory(slug)[0];
  if (!last) return { ok: false, error: "Wapas jaane ke liye koi purani version nahi hai." };
  const raw = JSON.parse(readFileSync(path.join(historyDir(), last.name), "utf8"));
  const r = validateVendorRaw(raw, slug, registry);
  if (!r.ok) return r;
  unlinkSync(path.join(historyDir(), last.name));
  const file = vendorFile(slug);
  mkdirSync(historyDir(), { recursive: true });
  writeFileSync(path.join(historyDir(), `${slug}.${now}.undo.json`), readFileSync(file));
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(raw, null, 2) + "\n");
  renameSync(tmp, file);
  registry.upsert(r.vendor);
  return r;
}
