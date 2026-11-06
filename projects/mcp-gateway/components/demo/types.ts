export type Check = { check: string; ok: boolean; detail: string };
export type GatewayEvent = { kind: "gateway"; tool: string; args: Record<string, unknown>; decision: "allowed" | "blocked" | "pending_approval"; reason: string; checks: Check[]; result: any; flags?: string[] | null };
export type ModelEvent = { kind: "model"; step: number; ms: number; stop: string | null };
export type Audit = { seq: number; agent: string; tool: string; decision: string; reason: string; args: Record<string, string> };
export type Replay = { id: string; agent: string; title: string; task: string; kind: string; model: string | null; reply: string; trace: (GatewayEvent | ModelEvent)[]; audit: Audit[]; approvals: { id: string; summary: string; status: string }[] };
export const AGENT_INFO: Record<string, { name: string; scopes: string[]; pii: string }> = {
  "support-bot": { name: "Support agent", scopes: ["crm.read", "files.read", "email.send", "payments.refund"], pii: "full" },
  "analytics-bot": { name: "Analytics agent", scopes: ["db.query", "files.read"], pii: "masked" },
  "intern-bot": { name: "Intern assistant", scopes: ["files.read"], pii: "masked" },
};
export const DECISION_STYLE: Record<string, string> = {
  allowed: "bg-ok/15 text-ok border-ok/40", blocked: "bg-coral/15 text-coral border-coral/40", pending_approval: "bg-amber/15 text-amber border-amber/40",
};
export const DECISION_LABEL: Record<string, string> = { allowed: "ALLOWED", blocked: "BLOCKED", pending_approval: "HELD FOR APPROVAL" };
