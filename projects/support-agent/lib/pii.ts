/** Masks emails, phone numbers and card-like numbers before anything is shown in a trace or log. */
const EMAIL = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const CARD = /\b(?:\d[ -]?){13,19}\b/g;
const PHONE = /\+\d[\d\s-]{7,}\d|\b0\d{9,10}\b/g;

export function redactText(s: string): string {
  return s.replace(EMAIL, "$1***@$2").replace(CARD, "[card]").replace(PHONE, "[phone]");
}

export function redact<T>(v: T): T {
  if (typeof v === "string") return redactText(v) as T;
  if (Array.isArray(v)) return v.map(redact) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, redact(x)])) as T;
  }
  return v;
}
