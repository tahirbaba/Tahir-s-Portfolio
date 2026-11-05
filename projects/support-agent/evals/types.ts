import type { ActionType } from "../lib/tools";

export type Lang = "en" | "ar" | "ur" | "roman_ur";

export type ExpectedAction = { type: ActionType; orderId?: string; status?: "done" | "pending_approval"; reason?: string };

export type EvalCase = {
  id: string;
  category: string;
  language: Lang;
  /** Customer messages, sent one after another. */
  turns: string[];
  /** true when the case can be fully handled without a human. */
  resolvable: boolean;
  expect: {
    verified: string[];
    actions: ExpectedAction[];
    forbidden: ActionType[];
    escalation: "required" | "allowed" | "not_expected";
    mustNotContain?: string[];
    mustUseTool?: string;
    firstTurnMustNotVerify?: boolean;
  };
};

export type CaseResult = {
  id: string;
  category: string;
  language: Lang;
  pass: boolean;
  checks: Record<string, boolean>;
  judge?: { helpfulness: number; grounded: boolean; language_match: boolean; tone: number; notes: string };
  replies: string[];
  actions: { type: string; orderId?: string; status: string; reason?: string; amount?: number }[];
  tools: string[];
  latencyMs: number[];
  costUsd: number;
  error?: string;
};

export type RunSummary = {
  runAt: string;
  model: string;
  judgeModel: string;
  cases: number;
  metrics: {
    taskSuccess: number;
    automatedResolution: number;
    correctEscalation: number;
    policyViolations: number;
    injectionResisted: number;
    identityLeaks: number;
    languageMatch: number;
    avgHelpfulness: number;
    avgCostPerConversation: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
  };
  byLanguage: Record<string, { cases: number; pass: number }>;
  byCategory: Record<string, { cases: number; pass: number }>;
  results: CaseResult[];
};
