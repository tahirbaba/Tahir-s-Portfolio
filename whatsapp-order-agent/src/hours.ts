// Opening hours in Pakistan time (Asia/Karachi, UTC+5, no daylight saving).

import type { Branch, Day } from "./vendors.js";

const DAY_KEYS: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const KARACHI_OFFSET_MIN = 5 * 60;

export interface LocalTime {
  day: Day;
  minutes: number; // minutes since local midnight
  label: string; // e.g. "Fri 21:35"
  date: string; // e.g. "2026-11-13"
}

export function karachiTime(now: Date): LocalTime {
  const local = new Date(now.getTime() + KARACHI_OFFSET_MIN * 60_000);
  const day = DAY_KEYS[local.getUTCDay()]!;
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return {
    day,
    minutes,
    label: `${day[0]!.toUpperCase()}${day.slice(1)} ${hh}:${mm}`,
    date: local.toISOString().slice(0, 10),
  };
}

/** "2026-11-13 14:30" (Karachi time) -> Date. Returns null for anything else. */
export function parseKarachiDateTime(text: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as number[];
  if (h! > 23 || mi! > 59 || mo! < 1 || mo! > 12 || d! < 1 || d! > 31) return null;
  const utc = Date.UTC(y!, mo! - 1, d!, h!, mi!) - KARACHI_OFFSET_MIN * 60_000;
  const date = new Date(utc);
  return karachiTime(date).date === `${m[1]}-${m[2]}-${m[3]}` ? date : null; // rejects 2026-02-31
}

/** "Thu 13 Nov, 14:30" in Karachi time. */
export function formatKarachi(ms: number): string {
  const t = karachiTime(new Date(ms));
  const local = new Date(ms + KARACHI_OFFSET_MIN * 60_000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${t.label.slice(0, 3)} ${local.getUTCDate()} ${months[local.getUTCMonth()]}, ${t.label.slice(4)}`;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

function prevDay(day: Day): Day {
  return DAY_KEYS[(DAY_KEYS.indexOf(day) + 6) % 7]!;
}

/**
 * Is the branch open right now? Handles shops that close after midnight
 * (e.g. Friday 12:00 -> 04:00 means open until 4am Saturday morning).
 */
export function isOpen(branch: Branch, now: Date): boolean {
  const t = karachiTime(now);
  const today = branch.hours[t.day];
  if (today) {
    const open = toMin(today.open);
    const close = toMin(today.close);
    if (close > open) {
      if (t.minutes >= open && t.minutes < close) return true;
    } else if (t.minutes >= open) {
      return true; // overnight shift, before midnight part
    }
  }
  const yesterday = branch.hours[prevDay(t.day)];
  if (yesterday) {
    const open = toMin(yesterday.open);
    const close = toMin(yesterday.close);
    if (close <= open && t.minutes < close) return true; // after-midnight part
  }
  return false;
}

export function hoursText(branch: Branch): string {
  return DAY_KEYS.map((d) => {
    const h = branch.hours[d];
    return `${d}: ${h ? `${h.open}-${h.close}` : "closed"}`;
  }).join(", ");
}
