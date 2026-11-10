// Parsing and verifying WhatsApp Cloud API webhook calls.

import { createHmac, timingSafeEqual } from "node:crypto";

export type InboundKind = "text" | "location" | "image" | "audio" | "unsupported";

export interface InboundMessage {
  id: string;
  /** Which business number received it: this is how we know the vendor. */
  phoneNumberId: string;
  /** Customer's WhatsApp number (international format, digits only). */
  from: string;
  profileName: string | null;
  timestamp: number; // ms
  kind: InboundKind;
  text?: string;
  location?: { lat: number; lng: number; name?: string; address?: string };
  mediaId?: string;
  mimeType?: string;
  caption?: string;
  originalType: string;
}

/** Checks X-Hub-Signature-256 so only Meta can call the webhook. Accepts any of the given app secrets. */
export function verifySignature(rawBody: string, header: string | undefined, appSecrets: string | string[]): boolean {
  const secrets = (Array.isArray(appSecrets) ? appSecrets : [appSecrets]).filter(Boolean);
  if (!header?.startsWith("sha256=")) return false;
  const got = header.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(got)) return false;
  return secrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    return timingSafeEqual(Buffer.from(got.toLowerCase(), "hex"), Buffer.from(expected, "hex"));
  });
}

type Json = Record<string, any>;

/** Extracts customer messages from a webhook body. Status updates (sent/delivered/read) are ignored. */
export function parseWebhook(body: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const b = body as Json;
  if (b?.object !== "whatsapp_business_account" || !Array.isArray(b.entry)) return out;
  for (const entry of b.entry) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value as Json | undefined;
      if (change?.field !== "messages" || !value?.messages) continue;
      const phoneNumberId = String(value.metadata?.phone_number_id ?? "");
      const names = new Map<string, string>();
      for (const c of value.contacts ?? []) {
        if (c?.wa_id && c?.profile?.name) names.set(String(c.wa_id), String(c.profile.name));
      }
      for (const m of value.messages as Json[]) {
        if (!m?.id || !m?.from) continue;
        const base = {
          id: String(m.id),
          phoneNumberId,
          from: String(m.from),
          profileName: names.get(String(m.from)) ?? null,
          timestamp: Number(m.timestamp ?? 0) * 1000,
          originalType: String(m.type ?? "unknown"),
        };
        out.push({ ...base, ...classify(m) });
      }
    }
  }
  return out;
}

function classify(m: Json): Pick<InboundMessage, "kind" | "text" | "location" | "mediaId" | "mimeType" | "caption"> {
  switch (m.type) {
    case "text":
      return { kind: "text", text: String(m.text?.body ?? "") };
    case "interactive": {
      const reply = m.interactive?.button_reply ?? m.interactive?.list_reply;
      return { kind: "text", text: String(reply?.title ?? reply?.id ?? "") };
    }
    case "button":
      return { kind: "text", text: String(m.button?.text ?? m.button?.payload ?? "") };
    case "location":
      return {
        kind: "location",
        location: {
          lat: Number(m.location?.latitude),
          lng: Number(m.location?.longitude),
          name: m.location?.name ? String(m.location.name) : undefined,
          address: m.location?.address ? String(m.location.address) : undefined,
        },
      };
    case "image":
      return {
        kind: "image",
        mediaId: String(m.image?.id ?? ""),
        mimeType: String(m.image?.mime_type ?? "image/jpeg"),
        caption: m.image?.caption ? String(m.image.caption) : undefined,
      };
    case "audio":
      return { kind: "audio", mediaId: String(m.audio?.id ?? ""), mimeType: String(m.audio?.mime_type ?? "audio/ogg") };
    default:
      return { kind: "unsupported" };
  }
}
