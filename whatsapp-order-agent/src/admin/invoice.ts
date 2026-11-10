// Printable invoice (browser "Print" -> "Save as PDF" to send it to the vendor).

import type { Invoice } from "../billing.js";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function invoicePage(inv: Invoice, business: { name: string; contact: string }, invoiceNo: string): string {
  const money = (n: number) => `${inv.currency} ${n.toLocaleString("en-US")}`;
  const [y, m] = inv.month.split("-").map(Number);
  const monthName = new Date(Date.UTC(y!, m! - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${esc(invoiceNo)}</title>
<style>
  body { margin:0; background:#f2f2ef; color:#1b1b19; font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .page { max-width:720px; margin:24px auto; background:#fff; padding:40px; border-radius:12px; }
  .top { display:flex; justify-content:space-between; gap:20px; flex-wrap:wrap; }
  h1 { margin:0; font-size:26px; letter-spacing:.5px; }
  .muted { color:#6b6b66; }
  table { width:100%; border-collapse:collapse; margin-top:24px; }
  th, td { text-align:left; padding:10px 0; border-bottom:1px solid #e4e4df; }
  td.r, th.r { text-align:right; }
  tfoot td { font-weight:800; font-size:18px; border-bottom:0; }
  .box { margin-top:24px; padding:14px; background:#f7f7f4; border-radius:8px; font-size:14px; }
  .print { margin:0 auto 24px; display:block; padding:10px 20px; border:0; border-radius:8px; background:#1d4ed8; color:#fff; font-size:15px; font-weight:600; }
  @media print { body { background:#fff; } .page { margin:0; padding:0; } .print { display:none; } }
  @media (max-width:600px) { .page { margin:0; border-radius:0; padding:20px 16px; } }
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div><h1>INVOICE</h1><div class="muted"># ${esc(invoiceNo)}</div></div>
    <div style="text-align:right"><b>${esc(business.name)}</b><br><span class="muted">${esc(business.contact)}</span></div>
  </div>
  <div class="top" style="margin-top:24px">
    <div><div class="muted">Bill to</div><b>${esc(inv.name)}</b></div>
    <div style="text-align:right"><div class="muted">Period</div><b>${esc(monthName)}</b></div>
  </div>
  <table>
    <thead><tr><th>Detail</th><th class="r">Amount</th></tr></thead>
    <tbody>
      ${inv.lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="r">${money(l.amount)}</td></tr>`).join("\n      ")}
    </tbody>
    <tfoot><tr><td>Total</td><td class="r">${money(inv.total)}</td></tr></tfoot>
  </table>
  <div class="box">
    WhatsApp orders this month: <b>${inv.orders}</b>${inv.includedOrders ? ` (plan includes ${inv.includedOrders})` : ""}.
    ${inv.trialUntil ? `<br>Free trial until ${esc(inv.trialUntil)}.` : ""}
    <br>WhatsApp (Meta) charges are billed by Meta directly to your account and are not part of this invoice.
  </div>
</div>
<button class="print" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;
}
