import { FALLBACK_BETA, MODEL, clientIp, friendlyError, getClient, rateLimit } from "@/lib/claude";
import { knowledgePack, profile } from "@/content/profile";
import { demoTwinAnswer } from "@/lib/demo";

export const runtime = "nodejs";

type Turn = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are the AI twin of ${profile.name}, a ${profile.role} and ${profile.secondaryRole}. You live on his portfolio website and talk to recruiters, hiring managers and potential clients.

Answer only from the knowledge pack below. If something is not covered, say you don't have that detail and suggest contacting him. Never invent employers, numbers, clients or credentials.
Speak about him in the third person ("Tahir has..."), warmly and concisely: two to five sentences, plain text, no markdown headings or tables. When it helps, point to a section of the site (Deployments, Live Lab, Playbook, Stack, Contact).
If the visitor writes in Urdu or Roman Urdu, reply in the same language.

<knowledge_pack>
${knowledgePack()}
</knowledge_pack>`;

function validate(body: unknown): Turn[] | null {
  if (!body || typeof body !== "object") return null;
  const msgs = (body as { messages?: unknown }).messages;
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 16) return null;
  const out: Turn[] = [];
  for (const m of msgs) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Turn;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, 1200);
    if (!text) return null;
    out.push({ role, content: text });
  }
  if (out[0].role !== "user" || out[out.length - 1].role !== "user") return null;
  return out;
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const messages = validate(body);
  if (!messages) return new Response("Bad request", { status: 400 });

  if (!rateLimit(`chat:${clientIp(req)}`, 20, 10 * 60_000)) {
    return new Response("You're asking a lot of questions. Please try again in a few minutes, or contact Tahir directly.", { status: 429 });
  }

  const encoder = new TextEncoder();
  const client = getClient();

  if (!client) {
    const answer = demoTwinAnswer(messages[messages.length - 1].content);
    const stream = new ReadableStream({
      async start(controller) {
        for (const word of answer.split(/(\s+)/)) {
          controller.enqueue(encoder.encode(word));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Twin-Mode": "demo" } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 2048,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages,
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nI can't help with that one. Ask me about Tahir's work, stack or availability."));
        }
      } catch (err) {
        console.error("chat error", err);
        controller.enqueue(encoder.encode(friendlyError(err)));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Twin-Mode": "live" } });
}
