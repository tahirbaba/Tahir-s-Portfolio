export type ToolEvent = { kind: "tool"; name: string; input: Record<string, unknown>; output: Record<string, unknown>; isError: boolean; ms: number };
export type ModelEvent = { kind: "model"; step: number; ms: number; stop: string | null };
export type TraceEvent = ToolEvent | ModelEvent;
export type Action = { id: string; type: string; orderId?: string; amount?: number; reason?: string; status: string; detail?: string };
export type Replay = {
  id: string; title: string; lang: string; order: string; name: string; channel: "chat" | "web";
  source: "scripted" | "recorded"; model: string | null;
  customer: string; reply: string; trace: TraceEvent[]; actions: Action[];
  latencyMs: number | null; costUsd: number | null;
};

const URDU_ONLY = /[ٹڈڑںےۓہھ]/;
const ARABIC = /[؀-ۿ]/;
export const scriptClass = (t: string) => (URDU_ONLY.test(t) ? "urdu" : ARABIC.test(t) ? "arabic" : "");
