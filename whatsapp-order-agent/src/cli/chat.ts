// Terminal simulator: chat with a vendor's agent without WhatsApp or Meta. Needs only ANTHROPIC_API_KEY.
//
//   npm run chat -- demo-pizza
//
// Commands:
//   /loc 24.92,67.09     share a location pin
//   /img path/to.png     send an image (e.g. payment screenshot)
//   /orders              show open orders (what the kitchen screen shows)
//   /set CC-1001 ready   move an order: accepted | ready | out_for_delivery | delivered | picked_up | rejected
//   /as 923001234567     switch to another customer number
//   /vendor demo-fastfood switch shop
//   /quit

import { readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { AnthropicLLM } from "../agent/llm.js";
import { config } from "../config.js";
import { OPEN_STATUSES, type OrderStatus, Store } from "../db.js";
import { Engine } from "../engine.js";
import { changeStatus } from "../orders.js";
import { VendorRegistry, type Vendor } from "../vendors.js";
import type { MediaFile, WhatsAppSender } from "../whatsapp/client.js";
import type { InboundMessage } from "../whatsapp/webhook.js";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Set ANTHROPIC_API_KEY in .env first.");
  process.exit(1);
}

const vendors = VendorRegistry.fromDir(config.vendorsDir);
let vendor = vendors.get(process.argv[2] ?? "") ?? vendors.all()[0]!;
let customer = "923001112223";
const store = new Store(process.env.SIM_DB_PATH ?? "data/simulator.db");
const images = new Map<string, MediaFile>();

const printer: WhatsAppSender = {
  async sendText(v: Vendor, to: string, text: string) {
    console.log(`\n\x1b[32m[${v.name} → ${to}]\x1b[0m\n${text}\n`);
  },
  async markRead() {},
  async downloadMedia(_v, id) {
    const f = images.get(id);
    if (!f) throw new Error("no such image");
    return f;
  },
};

const engine = new Engine({
  store,
  vendors,
  llm: new AnthropicLLM(),
  wa: printer,
  log: {
    info: (o) => console.log(`\x1b[90m${JSON.stringify(o)}\x1b[0m`),
    warn: (o, m) => console.warn(m, o),
    error: (o, m) => console.error(m, o),
  },
});

let n = 0;
function msg(partial: Partial<InboundMessage>): InboundMessage {
  return {
    id: `sim-${Date.now()}-${n++}`,
    phoneNumberId: vendor.whatsapp.phoneNumberId,
    from: customer,
    profileName: "Test Customer",
    timestamp: Date.now(),
    kind: "text",
    originalType: "text",
    ...partial,
  };
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log(`Chatting with ${vendor.name} as +${customer}. Type /quit to exit.\n`);

for (;;) {
  const line = (await rl.question("you> ")).trim();
  if (!line) continue;
  if (line === "/quit") break;
  const [cmd, ...rest] = line.split(" ");
  const arg = rest.join(" ").trim();
  if (cmd === "/loc") {
    const [lat, lng] = arg.split(",").map(Number);
    await engine.enqueue(msg({ kind: "location", originalType: "location", location: { lat: lat!, lng: lng! } }));
  } else if (cmd === "/img") {
    const id = `img-${n++}`;
    const ext = path.extname(arg).toLowerCase();
    images.set(id, { data: readFileSync(arg), mimeType: ext === ".png" ? "image/png" : "image/jpeg" });
    await engine.enqueue(msg({ kind: "image", originalType: "image", mediaId: id }));
  } else if (cmd === "/orders") {
    for (const o of store.ordersByStatus(vendor.slug, OPEN_STATUSES)) {
      console.log(`${o.number} [${o.status}] ${o.items.map((i) => `${i.qty}x ${i.name}${i.variant ? ` ${i.variant}` : ""}`).join(", ")} = ${o.total} (${o.paymentMethod}/${o.paymentStatus})`);
    }
  } else if (cmd === "/set") {
    const [num, to] = rest;
    const o = store.findOrder(vendor.slug, num ?? "");
    if (!o) console.log("no such order");
    else {
      try {
        const c = changeStatus(store, vendor, o, to as OrderStatus, { prepMinutes: to === "accepted" ? 20 : undefined });
        console.log(`${o.number} -> ${c.order.status}`);
        if (c.notify) await printer.sendText(vendor, o.customer, c.notify);
      } catch (e) {
        console.log((e as Error).message);
      }
    }
  } else if (cmd === "/as") {
    customer = arg.replace(/\D/g, "");
    console.log(`now chatting as +${customer}`);
  } else if (cmd === "/vendor") {
    const v = vendors.get(arg);
    if (v) {
      vendor = v;
      console.log(`now chatting with ${v.name}`);
    } else console.log(`unknown vendor; have: ${vendors.all().map((x) => x.slug).join(", ")}`);
  } else {
    await engine.enqueue(msg({ text: line }));
  }
}
rl.close();
