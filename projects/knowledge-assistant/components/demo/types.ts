export type Hit = { id: string; doc: string; title: string; heading: string; text: string; updated: string; score: number };
export type Search = { query?: string; hits: Hit[]; hidden_by_access: number; hidden_as_outdated: number; answerable: boolean };
export type Replay = { id: string; role: string; title: string; question: string; kind: string; model: string | null; reply: string; raw_reply: string; guarded: boolean; citations: { cited: string[]; invalid: string[]; ok: boolean }; trace: Search[] };
export const ROLE_LABEL: Record<string, string> = { employee: "Employee", manager: "Manager", hr: "HR", finance: "Finance" };
const URDU_ONLY = /[ٹڈڑںےۓہھ]/;
const ARABIC = /[؀-ۿ]/;
export const scriptClass = (t: string) => (URDU_ONLY.test(t) ? "urdu" : ARABIC.test(t) ? "arabic" : "");
