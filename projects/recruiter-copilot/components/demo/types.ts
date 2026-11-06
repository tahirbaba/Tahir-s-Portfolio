export type Row = { id: string; label: string; weight: number; must: boolean; met: boolean; evidence: string | null; points: number };
export type Flag = { type: string; severity: "high" | "medium" | "info"; detail: string };
export type Result = { score: { total: number; max: number; rows: Row[]; computed_years: number; missing_must: string[]; unverified_evidence: { criterion: string; quote: string }[] }; flags: Flag[]; recommendation: string; why: string; checklist: { item: string; because: string }[]; decided_by: string; audit?: Audit };
export type Audit = { at: string; rules_version: string; model: string; redacted_before_model: Record<string, number>; reidentification_notes: string[]; stored: boolean; retention: string; decision: string };
export type Replay = { id: string; title: string; name: string; cv: string; redacted: string; form: { claimed_years: number; degree_year: number; current_title: string; current_company: string }; public: { roles: { company: string; title: string }[] }; kind: string; model: string | null; reply: string; result: Result };
export const REC: Record<string, { label: string; cls: string }> = {
  advance: { label: "ADVANCE TO INTERVIEW", cls: "bg-ok/15 text-ok border-ok/40" }, interview_and_verify: { label: "INTERVIEW + VERIFY", cls: "bg-amber/15 text-amber border-amber/40" },
  verify_first: { label: "VERIFY BEFORE INTERVIEW", cls: "bg-coral/15 text-coral border-coral/40" }, not_a_fit_yet: { label: "NOT A FIT FOR THIS ROLE YET", cls: "bg-dim/15 text-muted border-line-2" },
};
export const SEV: Record<string, string> = { high: "border-coral/40 text-coral", medium: "border-amber/40 text-amber", info: "border-ice/30 text-ice" };
