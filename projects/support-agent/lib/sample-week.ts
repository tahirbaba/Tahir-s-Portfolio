/**
 * Deterministic SIMULATED week of support traffic for the manager dashboard.
 * It illustrates what a manager would see; it is not production data.
 */
export type Outcome = "auto" | "approval" | "human";
export type DayRow = { day: string; auto: number; approval: number; human: number };

function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BASE = [96, 104, 99, 112, 121, 78, 64];
export const MINUTES_PER_TICKET = 6; // assumption used for "hours saved"

export function sampleWeek() {
  const r = rng(42);
  const days: DayRow[] = DAYS.map((day, i) => {
    const total = BASE[i];
    const human = Math.round(total * (0.14 + r() * 0.06));
    const approval = Math.round(total * (0.04 + r() * 0.03));
    return { day, auto: total - human - approval, approval, human };
  });
  const total = days.reduce((t, d) => t + d.auto + d.approval + d.human, 0);
  const auto = days.reduce((t, d) => t + d.auto, 0);
  const human = days.reduce((t, d) => t + d.human, 0);
  const approval = days.reduce((t, d) => t + d.approval, 0);
  const languages = [
    { label: "English", value: Math.round(total * 0.41) },
    { label: "Arabic", value: Math.round(total * 0.27) },
    { label: "Roman Urdu", value: Math.round(total * 0.19) },
  ];
  languages.push({ label: "Urdu", value: total - languages.reduce((t, l) => t + l.value, 0) });
  const categories = [
    { label: "Where is my order", value: Math.round(total * 0.34) },
    { label: "Damaged or defective", value: Math.round(total * 0.18) },
    { label: "Returns", value: Math.round(total * 0.14) },
    { label: "Address change", value: Math.round(total * 0.11) },
    { label: "Late or lost parcel", value: Math.round(total * 0.1) },
    { label: "Policy questions", value: Math.round(total * 0.08) },
  ];
  return {
    days, total, auto, human, approval,
    autoRate: +((100 * auto) / total).toFixed(1),
    hoursSaved: Math.round((auto * MINUTES_PER_TICKET) / 60),
    refundsIssuedUsd: 4180,
    languages, categories,
  };
}

export type Approval = { id: string; order: string; customer: string; lang: string; amount: number; reason: string; summary: string; policy: string; age: string };

export const APPROVALS: Approval[] = [
  { id: "APR-4101", order: "NH-1015", customer: "Khalid M.", lang: "Arabic", amount: 1290, reason: "Damaged on arrival", summary: "Three-seat velvet sofa delivered 19 Oct with a split frame. Customer sent photos. Delivered 13 days ago, inside the 30-day window.", policy: "POL-1 · POL-2", age: "12 min" },
  { id: "APR-4097", order: "NH-1016", customer: "Maria G.", lang: "English", amount: 600, reason: "Not as described", summary: "Marble coffee table has a visible crack along the edge. Delivered 18 days ago. Customer prefers a refund over a replacement.", policy: "POL-1 · POL-2", age: "1 h" },
  { id: "APR-4093", order: "NH-1014", customer: "Grace L.", lang: "English", amount: 165, reason: "Lost parcel", summary: "No carrier scan since 7 Oct (25 days). Treated as lost under POL-4. Full order total requested.", policy: "POL-4 · POL-2", age: "3 h" },
  { id: "APR-4090", order: "NH-1002", customer: "Omar F.", lang: "Arabic", amount: 289, reason: "Damaged on arrival", summary: "Handwoven rug arrived with water damage. Delivered 21 days ago. Customer will keep the item for disposal.", policy: "POL-1 · POL-2", age: "5 h" },
];
