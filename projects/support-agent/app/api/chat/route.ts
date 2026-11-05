import Anthropic from "@anthropic-ai/sdk";
import { getClient, runAgent, type Turn } from "@/lib/agent";
import { sign, verify } from "@/lib/session";
import { redactText } from "@/lib/pii";

export const runtime = "nodejs";
export const maxDuration = 60;

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 30;
}

export async function POST(req: Request) {
  const client = getClient();
  if (!client) return Response.json({ error: "The live agent is offline: no API key is configured for this deployment." }, { status: 503 });

  let body: { history?: unknown; state?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  const history = Array.isArray(body.history) ? (body.history as Turn[]) : [];
  const valid = history.length > 0 && history.length <= 20 && history.every((t, i) =>
    t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim().length > 0 && t.content.length <= 1200 && (i % 2 === 0 ? t.role === "user" : t.role === "assistant"),
  ) && history[history.length - 1].role === "user";
  if (!valid) return Response.json({ error: "Bad request" }, { status: 400 });

  const state = verify(body.state);
  if (!state) return Response.json({ error: "This conversation expired. Please start a new one." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || "local").trim();
  if (limited(ip)) return Response.json({ error: "Too many messages. Please wait a few minutes." }, { status: 429 });

  try {
    const r = await runAgent(history, state, client);
    return Response.json({ reply: r.reply, state: sign(r.state), actions: r.state.actions, verified: r.state.verified, trace: r.trace, usage: r.usage, costUsd: r.costUsd, latencyMs: r.latencyMs, model: r.model });
  } catch (err) {
    console.error("agent error", redactText(String(err)));
    const msg = err instanceof Anthropic.RateLimitError ? "The agent is busy. Try again in a minute." : "The agent hit an error. Please try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}

export async function GET() {
  return Response.json({ live: !!getClient() });
}
