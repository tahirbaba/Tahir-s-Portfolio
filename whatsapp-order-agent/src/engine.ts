// The heart of the system: routes every incoming WhatsApp message to the right vendor and chat.
//
//   message arrives on number X  ->  vendor = the one whose phoneNumberId is X
//   chat = (vendor, customer number)  ->  same customer at two shops = two separate chats

import { runTurn, type TurnInput } from "./agent/agent.js";
import type { LLM } from "./agent/llm.js";
import { config } from "./config.js";
import type { Order, Session, Store } from "./db.js";
import { cartSummary } from "./cart.js";
import { handleOwnerCommand, isOwner } from "./owner.js";
import type { Transcriber } from "./stt.js";
import type { LoadedVendor, VendorRegistry } from "./vendors.js";
import { pktDay, record } from "./usage.js";
import { splitText, type WhatsAppSender } from "./whatsapp/client.js";
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
  /** Recent message times per vendor:customer, for the hourly spam limit. */
  private recent = new Map<string, number[]>();
  /** When each vendor last received a customer message (go-live checklist). */
  readonly lastInbound = new Map<string, number>();

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
    record(store, vendor.slug, "conversations", 1, now);
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
    this.lastInbound.set(vendor.slug, this.now().getTime());
    record(store, vendor.slug, "wa_in", 1, this.now());

    // Owner commands ("#report", "#pause", ...) are answered by code, without the AI.
    if (msg.kind === "text" && msg.text && isOwner(vendor, msg.from)) {
      const answer = handleOwnerCommand(store, vendor, msg.text, this.now().getTime());
      if (answer) {
        await this.send(vendor, msg.from, answer);
        return;
      }
    }

    // Spam protection: one customer flooding the shop must not run up AI and WhatsApp costs.
    const flood = this.floodCheck(vendor.slug, msg.from);
    if (flood !== "ok") {
      if (flood === "warn") {
        await this.send(
          vendor,
          msg.from,
          vendor.notifyLanguage === "roman_urdu"
            ? "Bohat zyada messages aa gaye hain. Thori der baad dobara message karein, ya hamari team jaldi jawab degi."
            : "We've received a lot of messages. Please try again a little later, or our team will reply soon.",
        );
      }
      return;
    }

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

    // Vendor's daily AI budget: once used up, chats go to the staff instead of the AI.
    const cap = vendor.limits.aiTurnsPerDay;
    if (cap > 0 && (store.usageBetween(vendor.slug, pktDay(nowMs), pktDay(nowMs)).ai_turns ?? 0) >= cap) {
      session.mode = "human";
      session.humanUntil = nowMs + config.humanModeMinutes * 60_000;
      session.handoffReason = "daily AI limit reached";
      store.saveSession(session);
      await this.send(
        vendor,
        msg.from,
        vendor.notifyLanguage === "roman_urdu"
          ? "Shukriya! Hamari team ka member jaldi isi chat mein jawab dega."
          : "Thanks! A team member will reply in this chat shortly.",
      );
      return;
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
      const at = this.now();
      record(store, vendor.slug, "ai_turns", 1, at);
      record(store, vendor.slug, "ai_input", result.usage.input, at);
      record(store, vendor.slug, "ai_cache_read", result.usage.cacheRead, at);
      record(store, vendor.slug, "ai_cache_write", result.usage.cacheWrite, at);
      record(store, vendor.slug, "ai_output", result.usage.output, at);
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
        // Keep what the customer already gave us (pin, menu-page cart), but not the half-finished AI turn.
        fresh.location = session.location;
        fresh.cart = session.cart;
        fresh.fulfilment = session.fulfilment;
        fresh.customerName = session.customerName;
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
      case "text": {
        if (!msg.text?.trim()) return null;
        const fromMenu = this.loadMenuPageCart(vendor, session, msg.text);
        return { text: fromMenu ?? msg.text };
      }
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

  /**
   * The menu web page sends "... (code ABCDE)" to WhatsApp. If the code is ours, the cart is loaded
   * by code (exact items and prices), so the AI does not have to read the order text.
   */
  private loadMenuPageCart(vendor: LoadedVendor, session: Session, text: string): string | null {
    const m = /\bcode[:\s#]*([A-HJ-NP-Z2-9]{5})\b/i.exec(text);
    if (!m) return null;
    const pending = this.deps.store.takePendingCart(vendor.slug, m[1]!, 6 * 3600_000, this.now().getTime());
    if (!pending) {
      return `${text}\n(menu page code ${m[1]!.toUpperCase()} was not found or already used; the cart was NOT loaded. Ask the customer to confirm the items in chat or open the menu link again.)`;
    }
    session.cart = pending.cart;
    if (pending.fulfilment) session.fulfilment = pending.fulfilment;
    if (pending.customerName) session.customerName = pending.customerName;
    const details = [
      `cart loaded: ${cartSummary(pending.cart, vendor.currency).replace(/\n/g, " | ")}`,
      `wants: ${pending.fulfilment ?? "not chosen"}`,
      `name: ${pending.customerName ?? "not given"}`,
      `payment: ${pending.paymentMethod ?? "not chosen"}`,
      pending.note ? `note: ${pending.note}` : null,
    ].filter(Boolean);
    return `(order from the menu page)\n[${details.join("; ")}]`;
  }

  private async send(vendor: LoadedVendor, to: string, text: string): Promise<void> {
    try {
      await this.deps.wa.sendText(vendor, to, text);
      // Every outgoing message may be billed by Meta: count it for the usage meter.
      record(this.deps.store, vendor.slug, "wa_service", splitText(text).length, this.now());
    } catch (err) {
      this.log.error({ err: String(err), vendor: vendor.slug, to }, "WhatsApp send failed");
    }
  }

  /** Sends an approved template (allowed outside the 24h window). Returns false when Meta refused it. */
  async sendTemplate(vendor: LoadedVendor, to: string, template: string, language: string, params: string[]): Promise<boolean> {
    try {
      await this.deps.wa.sendTemplate(vendor, to, template, language, params);
      record(this.deps.store, vendor.slug, "wa_template", 1, this.now());
      return true;
    } catch (err) {
      this.log.error({ err: String(err), vendor: vendor.slug, to, template }, "WhatsApp template failed");
      return false;
    }
  }

  /** Used by the kitchen/rider screen to tell the customer about their order. */
  async notifyCustomer(vendor: LoadedVendor, order: Order, text: string): Promise<void> {
    await this.send(vendor, order.customer, text);
  }

  /** "ok", "warn" (first message over the limit: tell the customer once) or "drop". */
  private floodCheck(vendorSlug: string, customer: string): "ok" | "warn" | "drop" {
    const limit = config.customerMessagesPerHour;
    if (limit <= 0) return "ok";
    const key = `${vendorSlug}:${customer}`;
    const now = this.now().getTime();
    const times = (this.recent.get(key) ?? []).filter((t) => now - t < 3600_000);
    times.push(now);
    this.recent.set(key, times);
    if (this.recent.size > 50_000) this.recent.clear(); // memory guard
    if (times.length <= limit) return "ok";
    return times.length === limit + 1 ? "warn" : "drop";
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
