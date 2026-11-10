// WhatsApp commands for the shop owner/manager. Only numbers listed in the vendor's "owners" can use them.
// Commands start with "#", so the owner can still chat with the bot like a customer to test it.
//
//   #report          today's sales        #report kal    yesterday     #report week   last 7 days
//   #pause           stop new orders      #resume        take orders again
//   #off zinger      mark sold out        #on zinger     available again
//   #status          what is paused / sold out
//   #help

import type { Store } from "./db.js";
import { buildReport, reportText, type ReportRange } from "./report.js";
import type { LoadedVendor, MenuItem } from "./vendors.js";

export function isOwner(vendor: LoadedVendor, from: string): boolean {
  return vendor.owners.includes(from);
}

const HELP = [
  "🛠️ *Owner commands*",
  "#report — aaj ki sale",
  "#report kal — kal ki sale",
  "#report week — 7 din",
  "#pause — naye orders band",
  "#resume — orders dobara chalu",
  "#off zinger — item khatam (sold out)",
  "#on zinger — item wapas available",
  "#status — kya band hai",
].join("\n");

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Finds menu items by id or by words in the name ("tikka" -> all tikka pizzas). */
export function findItems(vendor: LoadedVendor, query: string): MenuItem[] {
  const q = norm(query);
  if (!q) return [];
  const exact = vendor.menu.filter((m) => m.id === q.replace(/ /g, "-") || norm(m.name) === q);
  if (exact.length) return exact;
  const words = q.split(" ");
  return vendor.menu.filter((m) => {
    const hay = `${norm(m.name)} ${m.id.replace(/-/g, " ")}`;
    return words.every((w) => hay.includes(w));
  });
}

function statusText(vendor: LoadedVendor, store: Store): string {
  const st = store.vendorState(vendor.slug);
  const names = st.unavailable.map((id) => vendor.menu.find((m) => m.id === id)?.name ?? id);
  return [
    st.paused ? "⏸️ Naye orders: *BAND* (#resume se chalu karein)" : "✅ Naye orders: chalu",
    names.length ? `❌ Sold out: ${names.join(", ")}` : "✅ Sab items available",
  ].join("\n");
}

/** Returns the reply text, or null when the message is not a command. */
export function handleOwnerCommand(store: Store, vendor: LoadedVendor, text: string, now = Date.now()): string | null {
  const t = text.trim();
  if (!t.startsWith("#")) return null;
  const [cmdRaw, ...rest] = t.slice(1).trim().split(/\s+/);
  const cmd = (cmdRaw ?? "").toLowerCase();
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "report": {
      const a = arg.toLowerCase();
      const range: ReportRange = ["kal", "yesterday"].includes(a) ? "yesterday" : ["week", "hafta", "7"].includes(a) ? "week" : "today";
      return reportText(vendor, buildReport(store, vendor, range, now));
    }
    case "pause":
    case "band": {
      const st = store.vendorState(vendor.slug);
      store.setVendorState(vendor.slug, { ...st, paused: true }, now);
      return "⏸️ Naye orders band kar diye. Bot customers ko bata dega. Wapas chalu karne ke liye: #resume";
    }
    case "resume":
    case "chalu":
    case "start": {
      const st = store.vendorState(vendor.slug);
      store.setVendorState(vendor.slug, { ...st, paused: false }, now);
      return "✅ Orders dobara chalu.";
    }
    case "off":
    case "on": {
      if (!arg) return `Item ka naam likhein, jaise: #${cmd} zinger`;
      const items = findItems(vendor, arg);
      if (items.length === 0) return `"${arg}" menu mein nahi mila. #status ya menu ka naam check karein.`;
      if (items.length > 5) return `"${arg}" se ${items.length} items milte hain. Thora aur exact naam likhein.`;
      const st = store.vendorState(vendor.slug);
      const ids = new Set(st.unavailable);
      for (const i of items) cmd === "off" ? ids.add(i.id) : ids.delete(i.id);
      store.setVendorState(vendor.slug, { ...st, unavailable: [...ids] }, now);
      const names = items.map((i) => i.name).join(", ");
      return cmd === "off" ? `❌ Sold out: ${names}` : `✅ Available: ${names}`;
    }
    case "status":
      return statusText(vendor, store);
    case "help":
    case "commands":
      return HELP;
    default:
      return `Ye command samajh nahi aayi.\n\n${HELP}`;
  }
}
