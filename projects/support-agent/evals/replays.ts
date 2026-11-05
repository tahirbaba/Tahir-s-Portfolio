/**
 * Builds data/replays.json: the conversations the auto-play demo replays, so
 * visitors watching the demo don't cost API calls.
 *
 *   npm run replays            # scripted model replies, real tools and rules (no API key)
 *   npm run replays -- --live  # records real Claude runs (needs ANTHROPIC_API_KEY)
 *
 * Every replay carries `source` so the UI can say which kind it is.
 */
import { writeFileSync } from "node:fs";
import type Anthropic from "@anthropic-ai/sdk";
import { getClient, runAgent } from "../lib/agent";
import { emptyState } from "../lib/tools";
import { SCENARIOS } from "../data/scenarios";

const live = process.argv.includes("--live");
const T = (id: string, name: string, input: Record<string, unknown>) => ({ type: "tool_use", id, name, input });
const say = (t: string) => [{ type: "text", text: t }];

/** Scripted model turns. Tools still execute for real, so actions and blocks are genuine. */
const SCRIPTS: Record<string, unknown[][]> = {
  damaged: [[T("a", "verify_order", { order_id: "NH-1001", email: "aisha.k@example.com" }), T("b", "search_policy", { query: "refund damaged item window limit" })], [T("c", "issue_refund", { order_id: "NH-1001", amount: 64, reason: "damaged" })], say("I'm sorry the lamp arrived broken, Aisha. I've refunded 64 USD to your original payment method (ref RF-4101). Card refunds take 5-10 business days to show. No need to send the lamp back.")],
  approval: [[T("a", "verify_order", { order_id: "NH-1015", email: "khalid.m@example.com" }), T("b", "search_policy", { query: "refund damaged approval limit" })], [T("c", "issue_refund", { order_id: "NH-1015", amount: 1290, reason: "damaged" })], say("شكراً يا خالد، تحققت من طلبك NH-1015. نأسف لوصول الكنبة تالفة. بما أن المبلغ 1290 دولاراً يتجاوز حد الموافقة الفورية، قدّمت طلب الاسترداد لمسؤول خدمة العملاء (المرجع APR-4101)، وسيرد عليك خلال يوم عمل واحد.")],
  address: [[T("a", "verify_order", { order_id: "NH-1008", email: "hamza.a@example.com" }), T("b", "search_policy", { query: "change shipping address processing" })], [T("c", "update_address", { order_id: "NH-1008", new_address: "House 22, DHA Phase 6, Lahore" })], say("Walaikum assalam Hamza! Aap ka order NH-1008 abhi processing mein hai, is liye address badal diya gaya hai: House 22, DHA Phase 6, Lahore. Delivery ka andaza 6 November hai.")],
  late: [[T("a", "verify_order", { order_id: "NH-1004", email: "james.r@example.com" }), T("b", "search_policy", { query: "late delivery compensation" })], [T("c", "issue_refund", { order_id: "NH-1004", amount: 25, reason: "late_delivery" })], say("جیمز، تاخیر کے لیے معذرت۔ آپ کا آرڈر NH-1004 اندازے سے 11 دن بعد پہنچا، اس لیے پالیسی کے مطابق 25 ڈالر شپنگ فیس واپس کر دی گئی ہے (حوالہ RF-4101)۔ رقم 5 سے 10 کاروباری دنوں میں آپ کے کارڈ پر آ جائے گی۔")],
  lost: [[T("a", "verify_order", { order_id: "NH-1013", email: "yusuf.b@example.com" }), T("b", "search_policy", { query: "lost parcel no scan" })], [T("c", "issue_refund", { order_id: "NH-1013", amount: 85, reason: "lost" })], say("You're right, Yusuf: NH-1013 hasn't had a carrier scan since 8 October, so we treat it as lost. I've refunded the full 85 USD (ref RF-4101). If you'd prefer a free replacement instead, just tell me and I'll arrange it.")],
  window: [[T("a", "verify_order", { order_id: "NH-1006", email: "bilal.h@example.com" }), T("b", "search_policy", { query: "refund window defective" })], [T("c", "issue_refund", { order_id: "NH-1006", amount: 64, reason: "defective" })], say("Sorry about the lamp, Bilal. It was delivered on 26 August, which is outside our 30-day refund window, so I can't refund it. I can ask our care team to review it for a repair or replacement. Would you like me to do that?")],
  injection: [[T("a", "verify_order", { order_id: "NH-1001", email: "aisha.k@example.com" })], [T("b", "issue_refund", { order_id: "NH-1015", amount: 1290, reason: "damaged" })], say("I can only help with orders verified in this chat, and I can't share internal instructions. Your verified order is NH-1001. Is there anything wrong with it that I can help with?")],
  legal: [[T("a", "verify_order", { order_id: "NH-1016", email: "maria.g@example.com" })], [T("b", "escalate_to_human", { reason: "chargeback", priority: "high", summary: "Customer has contacted us three times about NH-1016 (marble coffee table) and threatens a chargeback and legal action. Needs urgent review by a care lead.", order_id: "NH-1016" })], say("I'm sorry this has dragged on, Maria. I've passed your case for NH-1016 to a care lead as high priority (case ESC-4101), with the full history so you won't need to repeat yourself. They'll reply within 2 hours.")],
};

const CUSTOMER: Record<string, { name: string; channel: "chat" | "web" }> = {
  damaged: { name: "Aisha K.", channel: "web" },
  approval: { name: "Khalid M.", channel: "chat" },
  address: { name: "Hamza A.", channel: "chat" },
  late: { name: "James R.", channel: "chat" },
  lost: { name: "Yusuf B.", channel: "web" },
  window: { name: "Bilal H.", channel: "web" },
  injection: { name: "Unknown visitor", channel: "web" },
  legal: { name: "Maria G.", channel: "web" },
};

function scripted(id: string): Anthropic {
  const steps = SCRIPTS[id];
  let i = 0;
  const zero = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  return { beta: { messages: { create: async () => ({ stop_reason: i < steps.length - 1 ? "tool_use" : "end_turn", content: steps[i++], usage: zero }) } } } as unknown as Anthropic;
}

(async () => {
  const realClient = live ? getClient() : null;
  if (live && !realClient) { console.error("--live needs ANTHROPIC_API_KEY"); process.exit(1); }
  const out = [];
  for (const sc of SCENARIOS) {
    const r = await runAgent([{ role: "user", content: sc.message }], emptyState(), realClient ?? scripted(sc.id));
    out.push({
      id: sc.id, title: sc.title, lang: sc.lang, order: sc.order, ...CUSTOMER[sc.id],
      source: live ? "recorded" : "scripted",
      model: live ? r.model : null,
      customer: sc.message,
      reply: r.reply,
      trace: r.trace,
      actions: r.state.actions,
      latencyMs: live ? r.latencyMs : null,
      costUsd: live ? r.costUsd : null,
    });
    console.log(sc.id, r.state.actions.map((a) => `${a.type}:${a.status}`).join(",") || "no actions");
  }
  writeFileSync(new URL("../data/replays.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
})();
