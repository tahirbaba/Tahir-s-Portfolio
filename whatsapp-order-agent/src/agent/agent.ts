// One customer turn: send the conversation to Claude, run the tools it asks for, return the reply text.
//
// Cost notes:
// - Claude Haiku 5.5 at low effort.
// - The vendor's system prompt (menu, rules) and the tool list never change between messages,
//   so they are cached (cache reads cost ~10% of normal input).
// - The conversation is append-only: we never edit earlier turns. That keeps the cache valid and
//   keeps Haiku 5.5's thinking blocks valid (editing history would invalidate them).

import Anthropic from "@anthropic-ai/sdk";
import { cartSummary } from "../cart.js";
import { config } from "../config.js";
import type { Session, Store } from "../db.js";
import { isOpen, karachiTime } from "../hours.js";
import type { LoadedVendor } from "../vendors.js";
import type { LLM } from "./llm.js";
import { buildSystemPrompt } from "./prompt.js";
import { runTool, TOOLS, type ToolContext } from "./tools.js";

const MAX_STEPS = 6;

export interface TurnInput {
  text?: string;
  image?: { data: Buffer; mimeType: string };
}

export interface TurnResult {
  reply: string;
  handedOff?: string;
  orderPlaced: boolean;
  usage: { input: number; cacheRead: number; cacheWrite: number; output: number };
}

const systemCache = new Map<string, string>();

function systemPromptFor(vendor: LoadedVendor): string {
  const key = `${vendor.slug}:${vendor.configHash}`;
  let s = systemCache.get(key);
  if (!s) {
    s = buildSystemPrompt(vendor);
    systemCache.set(key, s);
  }
  return s;
}

/** The [context] line added to each customer turn. Lives in the user message, not the system prompt, so the cache stays valid. */
export function contextLine(vendor: LoadedVendor, session: Session, store: Store, now: Date): string {
  const t = karachiTime(now);
  const open = vendor.branches.filter((b) => isOpen(b, now)).map((b) => b.id);
  const last = store.lastOrderOf(vendor.slug, session.customer);
  const parts = [
    `time ${t.label} PKT`,
    `open branches: ${open.length ? open.join(", ") : "NONE (shop closed)"}`,
    `customer name: ${session.customerName ?? "unknown"}`,
    `location pin: ${session.location ? "shared" : "not shared"}`,
    `fulfilment: ${session.fulfilment ?? "not chosen"}`,
    `cart: ${session.cart.length ? cartSummary(session.cart, vendor.currency).replace(/\n/g, " | ") : "empty"}`,
  ];
  if (last) parts.push(`last order: ${last.number} (${last.status})`);
  return `[context ${parts.join("; ")}]`;
}

const SUPPORTED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageType = (typeof SUPPORTED_IMAGE)[number];

function userContent(context: string, input: TurnInput): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];
  if (input.image) {
    const mt = (SUPPORTED_IMAGE as readonly string[]).includes(input.image.mimeType)
      ? (input.image.mimeType as ImageType)
      : "image/jpeg";
    blocks.push({ type: "image", source: { type: "base64", media_type: mt, data: input.image.data.toString("base64") } });
  }
  blocks.push({ type: "text", text: `${context}\n${input.text?.trim() || (input.image ? "(customer sent an image)" : "")}` });
  return blocks;
}

export async function runTurn(
  llm: LLM,
  store: Store,
  vendor: LoadedVendor,
  session: Session,
  input: TurnInput,
  now = new Date(),
): Promise<TurnResult> {
  const ctx: ToolContext = { store, vendor, session, now };
  const usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  session.messages.push({ role: "user", content: userContent(contextLine(vendor, session, store, now), input) });

  let reply = "";
  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await llm.create({
      model: config.model,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { effort: config.effort },
      // Caches everything up to the latest message, so later steps of this turn are cheap too.
      cache_control: { type: "ephemeral" },
      system: [{ type: "text", text: systemPromptFor(vendor), cache_control: { type: "ephemeral", ttl: "1h" } }],
      tools: TOOLS,
      messages: session.messages,
    });
    usage.input += response.usage.input_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
    usage.output += response.usage.output_tokens;

    // Keep the assistant turn exactly as returned (thinking blocks included).
    if (response.content.length > 0) {
      session.messages.push({ role: "assistant", content: response.content });
    }

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (toolUses.length > 0) {
      // Every tool_use needs a matching tool_result, even when the response was cut off.
      const complete = response.stop_reason === "tool_use";
      const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
        const r = complete
          ? runTool(tu.name, tu.input as Record<string, unknown>, ctx)
          : { content: "Error: the request was cut off; nothing was done.", isError: true };
        return { type: "tool_result", tool_use_id: tu.id, content: r.content, is_error: r.isError };
      });
      session.messages.push({ role: "user", content: results });
      if (complete) continue;
    }

    if (response.stop_reason === "refusal") {
      reply = "";
      ctx.handedOff ??= "model declined to answer";
      break;
    }
    if (toolUses.length > 0) break; // cut off mid tool call: hand over below

    reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    break;
  }

  // The order confirmation must be exact; never trust a paraphrase of numbers.
  if (ctx.placedConfirmation && !reply.includes(ctx.placedConfirmation.split("\n")[0]!)) {
    reply = ctx.placedConfirmation;
  }
  if (!reply) {
    // Refused, ran out of steps, or got nothing usable: let a person take over rather than loop.
    ctx.handedOff ??= "agent could not finish the reply";
    session.mode = "human";
    session.humanUntil = now.getTime() + config.humanModeMinutes * 60_000;
    session.handoffReason = ctx.handedOff;
    reply =
      vendor.notifyLanguage === "roman_urdu"
        ? "Shukriya! Hamari team ka member jaldi isi chat mein jawab dega."
        : "Thanks! A team member will reply in this chat shortly.";
  }

  return { reply, handedOff: ctx.handedOff, orderPlaced: Boolean(ctx.placedConfirmation), usage };
}
