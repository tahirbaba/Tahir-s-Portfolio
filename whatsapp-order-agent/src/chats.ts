// Turns a stored conversation into a readable transcript for the admin chat viewer.

import type Anthropic from "@anthropic-ai/sdk";
import type { Session } from "./db.js";

export type Line =
  | { who: "customer"; text: string; context: string | null; image: boolean }
  | { who: "bot"; text: string }
  | { who: "tool"; name: string; input: string }
  | { who: "result"; text: string; error: boolean };

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

export function transcript(session: Session): Line[] {
  const out: Line[] = [];
  for (const m of session.messages as Anthropic.MessageParam[]) {
    const blocks = typeof m.content === "string" ? [{ type: "text", text: m.content } as Anthropic.TextBlockParam] : m.content;
    if (m.role === "user") {
      const image = blocks.some((b) => b.type === "image");
      for (const b of blocks) {
        if (b.type === "text") {
          const match = /^(\[context [^\n]*\])\n?/.exec(b.text);
          out.push({ who: "customer", text: match ? b.text.slice(match[0].length) : b.text, context: match ? match[1]! : null, image });
        } else if (b.type === "tool_result") {
          const text = typeof b.content === "string" ? b.content : JSON.stringify(b.content);
          out.push({ who: "result", text: short(text, 400), error: Boolean(b.is_error) || /"ok":false/.test(text) });
        }
      }
    } else {
      for (const b of blocks) {
        if (b.type === "text" && b.text.trim()) out.push({ who: "bot", text: b.text });
        else if (b.type === "tool_use") out.push({ who: "tool", name: b.name, input: short(JSON.stringify(b.input), 300) });
      }
    }
  }
  return out;
}

export function sessionSummary(s: Session) {
  const first = transcript(s).find((l) => l.who === "customer");
  return {
    id: s.id,
    customer: s.customer,
    customerName: s.customerName,
    startedAt: s.startedAt,
    lastAt: s.lastAt,
    mode: s.mode,
    handoffReason: s.handoffReason,
    turns: s.messages.filter((m) => m.role === "user" && Array.isArray(m.content) && m.content.some((b) => b.type === "text")).length,
    preview: first && first.who === "customer" ? short(first.text, 80) : "",
  };
}
