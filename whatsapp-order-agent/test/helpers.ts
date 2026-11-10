import type Anthropic from "@anthropic-ai/sdk";
import type { LLM } from "../src/agent/llm.js";
import type { Vendor } from "../src/vendors.js";
import type { MediaFile, WhatsAppSender } from "../src/whatsapp/client.js";
import type { InboundMessage } from "../src/whatsapp/webhook.js";

export type Step = { text: string } | { tool: string; input: Record<string, unknown> };

let idCounter = 0;

function message(content: Anthropic.ContentBlock[], stop: Anthropic.StopReason): Anthropic.Message {
  return {
    id: `msg_${idCounter++}`,
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  } as unknown as Anthropic.Message;
}

/** A fake model that plays back a script, one step per API call, and records every request. */
export class ScriptedLLM implements LLM {
  calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  constructor(private script: Step[]) {}

  push(...steps: Step[]) {
    this.script.push(...steps);
  }

  async create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> {
    // Deep copy so later mutations of the session don't change what we recorded.
    this.calls.push(JSON.parse(JSON.stringify(params)));
    const step = this.script.shift();
    if (!step) throw new Error("ScriptedLLM: script ran out");
    if ("text" in step) return message([{ type: "text", text: step.text, citations: null } as Anthropic.TextBlock], "end_turn");
    return message(
      [{ type: "tool_use", id: `toolu_${idCounter++}`, name: step.tool, input: step.input } as Anthropic.ToolUseBlock],
      "tool_use",
    );
  }
}

export class FakeWhatsApp implements WhatsAppSender {
  sent: { vendor: string; to: string; text: string }[] = [];
  async sendText(vendor: Vendor, to: string, text: string) {
    this.sent.push({ vendor: vendor.slug, to, text });
  }
  async markRead() {}
  async downloadMedia(): Promise<MediaFile> {
    return { data: Buffer.from("fake"), mimeType: "image/png" };
  }
}

let msgId = 0;
export function inbound(phoneNumberId: string, from: string, partial: Partial<InboundMessage> = {}): InboundMessage {
  return {
    id: `wamid.${msgId++}`,
    phoneNumberId,
    from,
    profileName: "Ali",
    timestamp: Date.now(),
    kind: "text",
    originalType: "text",
    text: "hi",
    ...partial,
  };
}
