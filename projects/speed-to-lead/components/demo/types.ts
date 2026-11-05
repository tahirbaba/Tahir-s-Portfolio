export type ToolEvent = { kind: "tool"; name: string; input: Record<string, unknown>; output: Record<string, any>; isError: boolean; ms: number };
export type ModelEvent = { kind: "model"; step: number; ms: number; stop: string | null };
export type TraceEvent = ToolEvent | ModelEvent;
export type Lead = { id: string; name: string; email: string; company: string; role: string; source: string; country: string; timezone: string };
export type Turn = { lead: string; reply: string | null; trace: TraceEvent[]; latencyMs: number | null; costUsd: number | null };
export type Outcome = {
  score: { score: number; tier: string; reasons: string[] } | null;
  meetings: { id: string; start_utc: string; rep: string; lead_local: string; rep_local: string }[];
  crm: { id: string; tier: string; score: number; rep: string | null; summary: string; next_step: string } | null;
  alerts: { rep: string; reason: string }[];
  noReply: boolean;
};
export type Replay = { id: string; title: string; lang: string; source: string; lead: Lead; kind: "scripted" | "recorded"; model: string | null; turns: Turn[]; outcome: Outcome };

const URDU_ONLY = /[ٹڈڑںےۓہھ]/;
const ARABIC = /[؀-ۿ]/;
export const scriptClass = (t: string) => (URDU_ONLY.test(t) ? "urdu" : ARABIC.test(t) ? "arabic" : "");
export const TIER_STYLE: Record<string, string> = {
  hot: "bg-coral/15 text-coral border-coral/40", warm: "bg-amber/15 text-amber border-amber/40", cold: "bg-ice/10 text-ice border-ice/30",
  disqualified: "bg-dim/15 text-muted border-line-2", spam: "bg-rose/10 text-rose border-rose/30",
};
