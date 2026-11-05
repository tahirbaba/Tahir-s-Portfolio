import { createHmac, timingSafeEqual } from "node:crypto";
import { emptyState, type SessionState } from "./tools";

/* The conversation state travels with the client, signed so it can't be edited
   (e.g. to mark an order as verified without the email). */
const secret = () => process.env.STATE_SECRET || process.env.ANTHROPIC_API_KEY || "dev-only-secret";

export function sign(state: SessionState): string {
  const body = Buffer.from(JSON.stringify(state)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(token: unknown): SessionState | null {
  if (!token) return emptyState();
  if (typeof token !== "string" || token.length > 20_000) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()) as SessionState; } catch { return null; }
}
