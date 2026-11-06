export type Fields = { vendor_name: string; vendor_tax_id: string; invoice_number: string; invoice_date: string; po_number: string; currency: string; lines: { description: string; qty: number; unit_price: number }[]; subtotal: number; tax: number; total: number; bank_iban: string };
export type Decision = { decision: "post" | "exception" | "reject" | "hold" | "approval"; type: string; reasons: string[]; checks: any };
export type Replay = { id: string; title: string; doc: string; kind: string; model: string | null; reply: string; trace: any[]; decision: Decision; posted: { erp_id: string; amount: number; currency: string } | null; exception: { queue_id: string; type: string; clerk_note: string; vendor_message: string } | null; fields: Fields };
export const DECISION: Record<string, { label: string; cls: string }> = {
  post: { label: "POSTED FOR PAYMENT", cls: "bg-ok/15 text-ok border-ok/40" }, approval: { label: "NEEDS CONTROLLER APPROVAL", cls: "bg-amber/15 text-amber border-amber/40" },
  exception: { label: "EXCEPTION QUEUE", cls: "bg-coral/15 text-coral border-coral/40" }, reject: { label: "REJECTED · DUPLICATE", cls: "bg-coral/15 text-coral border-coral/40" },
  hold: { label: "PAYMENT HOLD · POSSIBLE FRAUD", cls: "bg-rose/15 text-rose border-rose/40" },
};
const URDU_ONLY = /[ٹڈڑںےۓہھ]/;
const ARABIC = /[؀-ۿ]/;
export const scriptClass = (t: string) => (URDU_ONLY.test(t) ? "urdu" : ARABIC.test(t) ? "arabic" : "");
export const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
