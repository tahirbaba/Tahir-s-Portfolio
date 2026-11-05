export type Discovery = {
  summary: string;
  north_star_metric: string;
  pain_points: { title: string; detail: string }[];
  constraints: string[];
};
export type Architecture = {
  agents: { id: string; name: string; role: string; tools: string[] }[];
  flow: { from: string; to: string }[];
  human_checkpoints: string[];
  integrations: string[];
};
export type Rollout = {
  phases: { when: string; title: string; deliverable: string }[];
  impact_estimates: { value: string; label: string }[];
  risks: { risk: string; mitigation: string }[];
};
export type StepName = "discovery" | "architecture" | "rollout";
export type LabEvent =
  | { type: "mode"; mode: "live" | "demo" }
  | { type: "step"; step: StepName; status: "running" }
  | { type: "result"; step: "discovery"; data: Discovery; ms: number }
  | { type: "result"; step: "architecture"; data: Architecture; ms: number }
  | { type: "result"; step: "rollout"; data: Rollout; ms: number }
  | { type: "done" }
  | { type: "error"; message: string };
