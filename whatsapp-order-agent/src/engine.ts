// The heart of the system: routes every incoming WhatsApp message to the right vendor and chat.
//
//   message arrives on number X  ->  vendor = the one whose phoneNumberId is X
//   chat = (vendor, customer number)  ->  same customer at two shops = two separate chats

import { runTurn, type TurnInput } from "./agent/agent.js";
import type { LLM } from "./agent/llm.js";
import { config } from "./config.js";
import type { Order, Session, Store } from "./db.js";
import type { Transcriber } from "./stt.js";
import type { LoadedVendor, VendorRegistry } from "./vendors.js";
import type { WhatsAppSender } from "./whatsapp/client.js";
import type { InboundMessage } from "./whatsapp/webhook.js";

export interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

const consoleLogger: Logger = {
  info: (o, m) => console.log(m ?? "", o),
  warn: (o, m) => console.warn(m ?? "", o),
  error: (o, m) => console.error(m ?? "", o),
};

export class Engine {
  private queues = new Map<string, Promise<void>>();

  constructor(
    private deps: {
      store: Store;
      vendors: VendorRegistry;
      llm: LLM;
      wa: WhatsAppSender;
      stt?: Transcriber;
      log?: Logger;
      now?: () => Date;
    },
  ) {}

  private get log(): Logger {
    return this.deps.log ?? consoleLogger;
  }

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }

  /** Accepts a message and processes it in the background, one at a time per chat. */
  enqueue(msg: InboundMessage): Promise<void> {
    const key = `${msg.phoneNumberId}:${msg.from}`;
    const prev = this.queues.get(key) ?? Promise.resolve();
    const next = prev
      .then(() => this.handle(msg))
      .catch((err) => this.log.error({ err: String(err), key }, "message handling failed"));
    this.queues.set(key, next);
    void next.finally(() => {
      if (this.queues.get(key) === next) this.queues.delete(key);
    });
    return next;
  }

  /** Waits for all queued work (used in tests and on shutdown). */
  async idle(): Promise<void> {
    while (this.queues.size > 0) await Promise.all([...this.queues.values()]);
  }

  private sessionFor(vendor: LoadedVendor, customer: string, profileName: string | null): Session {
    const { store } = this.deps;
    const now = this.now().getTime();
    const s = store.openSession(vendor.slug, customer);
    const stale =
      !s ||
      s.configHash !== vendor.configHash || // menu/prices changed: start clean
      now - s.lastAt > config.sessionIdleMinutes * 60_000 ||
      s.messages.length >= config.sessionMaxMessages;
    if (!stale) return s;
    const last = store.lastOrderOf(vendor.slug, customer);
    return store.createSession(
      vendor.slug,
      customer,
      vendor.configHash,
      { customerName: s?.customerName ?? last?.customerName ?? profileName, location: s?.location ?? last?.location },
      now,
    );
  }

  private async handle(msg: InboundMessage): Promise<void> {
    const { store, vendors, wa } = this.deps;
    const vendor = vendors.byPhoneNumberId(msg.phoneNumberId);
    if (!vendor) {
      this.log.warn({ phoneNumberId: msg.phoneNumberId }, "message for unknown number, ignored");
      return;
    }
    if (!store.markProcessed(msg.id)) return; // duplicate delivery from Meta

    wa.markRead(vendor, msg.id).catch(() => {}); // blue ticks; free, best-effort

    const session = this.sessionFor(vendor, msg.from, msg.profileName);
    const nowMs = this.now().getTime();
    session.lastAt = nowMs;

    if (session.mode === "human") {
      if ((session.humanUntil ?? 0) > nowMs) {
        store.saveSession(session); // staff is handling this chat in the WhatsApp Business app
        return;
      }
      session.mode = "bot";
      session.humanUntil = null;
      session.handoffReason = null;
    }

    const input = await this.toTurnInput(vendor, session, msg);
    if (input === null) {
      store.saveSession(session);
      return;
    }

    let reply: string;
    try {
      const result = await runTurn(this.deps.llm, store, vendor, session, input, this.now());
      reply = result.reply;
      this.log.info(
        { vendor: vendor.slug, customer: msg.from, handoff: result.handedOff ?? null, order: result.orderPlaced, usage: result.usage },
        "turn done",
      );
    } catch (err) {
      this.log.error({ err: String(err), vendor: vendor.slug }, "AI call failed");
      // Roll back this turn so the stored conversation stays valid.
      const fresh = store.getSession(session.id);
      if (fresh) {
        fresh.lastAt = nowMs;
        fresh.location = session.location; // keep a pin the customer just shared
        store.saveSession(fresh);
      }
      reply =
        vendor.notifyLanguage === "roman_urdu"
          ? "Maazrat, system mein thora masla aa gaya. 1-2 minute baad dobara message karein."
          : "Sorry, we hit a technical problem. Please message again in a minute or two.";
      await this.send(vendor, msg.from, reply);
      return;
    }

    store.saveSession(session);
    await this.send(vendor, msg.from, reply);
  }

  private async toTurnInput(vendor: LoadedVendor, session: Session, msg: InboundMessage): Promise<TurnInput | null> {
    const { wa, stt } = this.deps;
    switch (msg.kind) {
      case "text":
        return msg.text?.trim() ? { text: msg.text } : null;
      case "location": {
        const loc = msg.location!;
        if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
        session.location = { lat: loc.lat, lng: loc.lng };
        const label = [loc.name, loc.address].filter(Boolean).join(", ");
        return { text: `(customer shared a location pin${label ? `: ${label}` : ""})` };
      }
      case "image": {
        try {
          const file = await wa.downloadMedia(vendor, msg.mediaId!);
          return { image: file, text: msg.caption ?? "(customer sent an image, maybe a payment screenshot)" };
        } catch (err) {
          this.log.warn({ err: String(err) }, "image download failed");
          return { text: "(customer sent an image that could not be opened)" };
        }
      }
      case "audio": {
        if (!stt?.enabled) {
          await this.send(
            vendor,
            msg.from,
            vendor.notifyLanguage === "roman_urdu"
              ? "Maazrat, voice note abhi sun nahi sakte. Please likh kar bhej dein 🙏"
              : "Sorry, we can't listen to voice notes yet. Please type your message 🙏",
          );
          return null;
        }
        try {
          const file = await wa.downloadMedia(vendor, msg.mediaId!);
          const text = await stt.transcribe(file);
          return { text: text ? `(voice note) ${text}` : "(customer sent a voice note that was empty or unclear)" };
        } catch (err) {
          this.log.warn({ err: String(err) }, "voice note failed");
          return { text: "(customer sent a voice note that could not be understood; ask them to type)" };
        }
      }
      default:
        return { text: `(customer sent a ${msg.originalType} message, which this bot cannot read)` };
    }
  }

  private async send(vendor: LoadedVendor, to: string, text: string): Promise<void> {
    try {
      await this.deps.wa.sendText(vendor, to, text);
    } catch (err) {
      this.log.error({ err: String(err), vendor: vendor.slug, to }, "WhatsApp send failed");
    }
  }

  /** Used by the kitchen/rider screen to tell the customer about their order. */
  async notifyCustomer(vendor: LoadedVendor, order: Order, text: string): Promise<void> {
    await this.send(vendor, order.customer, text);
  }

  /** Staff finished with a handed-off chat: the bot answers again. */
  releaseToBot(vendor: LoadedVendor, sessionId: number): boolean {
    const s = this.deps.store.getSession(sessionId);
    if (!s || s.vendorSlug !== vendor.slug) return false;
    s.mode = "bot";
    s.humanUntil = null;
    s.handoffReason = null;
    this.deps.store.saveSession(s);
    return true;
  }
}
