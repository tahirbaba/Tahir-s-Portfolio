// Sending messages through the WhatsApp Cloud API (Meta Graph API).

import { config } from "../config.js";
import type { Vendor } from "../vendors.js";

export interface MediaFile {
  data: Buffer;
  mimeType: string;
}

/** What the rest of the app needs from WhatsApp. Swapped for a fake in tests and the CLI simulator. */
export interface WhatsAppSender {
  sendText(vendor: Vendor, to: string, text: string): Promise<void>;
  markRead(vendor: Vendor, messageId: string): Promise<void>;
  downloadMedia(vendor: Vendor, mediaId: string): Promise<MediaFile>;
}

const MAX_TEXT = 4000; // WhatsApp limit is 4096 characters

export function splitText(text: string, max = MAX_TEXT): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max / 2) cut = max;
    parts.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

export class CloudApiSender implements WhatsAppSender {
  private base = `https://graph.facebook.com/${config.graphApiVersion}`;

  private token(vendor: Vendor): string {
    const t = process.env[vendor.whatsapp.accessTokenEnv];
    if (!t) throw new Error(`Missing env ${vendor.whatsapp.accessTokenEnv} (WhatsApp token for ${vendor.slug})`);
    return t;
  }

  private async post(vendor: Vendor, body: unknown): Promise<void> {
    const res = await fetch(`${this.base}/${vendor.whatsapp.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token(vendor)}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`WhatsApp API ${res.status}: ${(await res.text()).slice(0, 500)}`);
    }
  }

  async sendText(vendor: Vendor, to: string, text: string): Promise<void> {
    for (const part of splitText(text)) {
      await this.post(vendor, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: part, preview_url: false },
      });
    }
  }

  async markRead(vendor: Vendor, messageId: string): Promise<void> {
    await this.post(vendor, { messaging_product: "whatsapp", status: "read", message_id: messageId });
  }

  async downloadMedia(vendor: Vendor, mediaId: string): Promise<MediaFile> {
    const auth = { Authorization: `Bearer ${this.token(vendor)}` };
    const meta = await fetch(`${this.base}/${mediaId}`, { headers: auth, signal: AbortSignal.timeout(15_000) });
    if (!meta.ok) throw new Error(`Media lookup ${meta.status}`);
    const info = (await meta.json()) as { url?: string; mime_type?: string };
    if (!info.url) throw new Error("Media has no url");
    const file = await fetch(info.url, { headers: auth, signal: AbortSignal.timeout(30_000) });
    if (!file.ok) throw new Error(`Media download ${file.status}`);
    const data = Buffer.from(await file.arrayBuffer());
    if (data.length > 5 * 1024 * 1024) throw new Error("Media larger than 5 MB");
    return { data, mimeType: info.mime_type ?? "application/octet-stream" };
  }
}
