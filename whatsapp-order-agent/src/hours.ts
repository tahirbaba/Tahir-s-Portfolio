// Opening hours in Pakistan time (Asia/Karachi, UTC+5, no daylight saving).

import type { Branch, Day } from "./vendors.js";

const DAY_KEYS: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const KARACHI_OFFSET_MIN = 5 * 60;

export interface LocalTime {
  day: Day;
  minutes: number; // minutes since local midnight
  label: string; // e.g. "Fri 21:35"
}

export function karachiTime(now: Date): LocalTime {
  const local = new Date(now.getTime() + KARACHI_OFFSET_MIN * 60_000);
  const day = DAY_KEYS[local.getUTCDay()]!;
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return { day, minutes, label: `${day[0]!.toUpperCase()}${day.slice(1)} ${hh}:${mm}` };
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
