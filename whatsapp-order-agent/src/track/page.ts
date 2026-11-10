// Single-file HTML for the customer tracking page. Refreshes itself every 15 seconds.

import type { trackingData } from "./routes.js";

type TrackData = ReturnType<typeof trackingData>;

function scriptJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029");
}

export function trackPage(data: TrackData | null): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Order tracking</title>
<style>
  :root { --bg:#f6f4ef; --card:#fff; --ink:#1f1d1a; --muted:#736d65; --line:#e7e1d8; --done:#15803d; --now:#c2410c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141311; --card:#1f1d1a; --ink:#f3f0eb; --muted:#a69f95; --line:#37332e; --done:#4ade80; --now:#fb923c; } }
  * { box-sizing:border-box; }
  body { margin:0; font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); }
  main { max-width:520px; margin:0 auto; padding:20px 16px 40px; }
  h1 { font-size:20px; margin:0; }
  .sub { color:var(--muted); font-size:14px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; margin-top:14px; }
  .big { font-size:26px; font-weight:800; margin:4px 0; }
  ol.steps { list-style:none; padding:0; margin:6px 0 0; }
  .steps li { position:relative; padding:0 0 18px 30px; color:var(--muted); }
  .steps li:last-child { padding-bottom:0; }
  .steps li::before { content:""; position:absolute; left:6px; top:6px; width:12px; height:12px; border-radius:50%; border:2px solid var(--line); background:var(--card); }
  .steps li::after { content:""; position:absolute; left:12px; top:22px; bottom:2px; width:2px; background:var(--line); }
  .steps li:last-child::after { display:none; }
  .steps li.done { color:var(--ink); } .steps li.done::before { background:var(--done); border-color:var(--done); }
  .steps li.current { color:var(--ink); font-weight:700; } .steps li.current::before { background:var(--now); border-color:var(--now); box-shadow:0 0 0 4px color-mix(in srgb, var(--now) 25%, transparent); }
  .row { display:flex; justify-content:space-between; gap:8px; }
  .btns { display:flex; gap:8px; margin-top:12px; }
  .btn { flex:1; text-align:center; text-decoration:none; padding:12px; border-radius:12px; font-weight:700; background:var(--done); color:#fff; }
  .btn.alt { background:var(--line); color:var(--ink); }
  ul { margin:6px 0; padding-left:18px; }
  .bad { border-color:#dc2626; }
  .note { color:var(--muted); font-size:13px; margin-top:16px; text-align:center; }
</style>
</head>
<body>
<main id="app"></main>
<script>
let D = ${scriptJson(data)};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
function render(){
  const app = document.getElementById("app");
  if (!D) { app.innerHTML = '<div class="card"><h1>Link expire ho gaya</h1><p class="sub">Ye tracking link 24 ghante tak chalta hai. Order ke baare mein shop ko WhatsApp karein. / This tracking link has expired.</p></div>'; return; }
  const ur = D.lang === "roman_urdu";
  const mins = Math.round((Date.now() - D.placedAt) / 60000);
  let head;
  if (D.rejected) head = '<div class="card bad"><div class="big">'+(ur ? "Order cancel ho gaya" : "Order cancelled")+'</div><div class="sub">'+(ur ? "Shop ne ye order nahi liya. WhatsApp pe shop se baat karein." : "The shop could not take this order. Please message them on WhatsApp.")+'</div></div>';
  else if (D.status === "delivered" || D.status === "picked_up") head = '<div class="card"><div class="big">✅ '+(ur ? "Mil gaya!" : "Done!")+'</div><div class="sub">'+(ur ? "Shukriya! Khana kaisa laga, WhatsApp pe 1-5 rating bhej dein." : "Thank you! Reply on WhatsApp with a 1-5 rating.")+'</div></div>';
  else if (D.scheduledLabel) head = '<div class="card"><div class="sub">⏰ Pre-order</div><div class="big">'+esc(D.scheduledLabel)+'</div></div>';
  else head = '<div class="card"><div class="sub">'+(ur ? "Andazan waqt" : "Estimated time")+'</div><div class="big">'+D.eta.min+'–'+D.eta.max+' min</div><div class="sub">'+(ur ? "Order ko " + mins + " minute ho gaye" : "Placed " + mins + " min ago")+'</div></div>';
  let rider = "";
  if (D.rider) {
    rider = '<div class="card"><div class="row"><b>🛵 '+esc(D.rider.name)+'</b>' +
      (D.rider.km != null ? '<span>'+D.rider.km+' km · ~'+D.rider.minutes+' min</span>' : "") + '</div>' +
      (D.rider.km == null ? '<div class="sub">'+(ur ? "Rider raste mein hai." : "Your rider is on the way.")+'</div>' : '<div class="sub">'+(ur ? "Location " : "Updated ")+D.rider.ageMin+(ur ? " min pehle update hui" : " min ago")+'</div>') +
      '<div class="btns">' + (D.rider.phone ? '<a class="btn" href="tel:+'+esc(D.rider.phone)+'">📞 '+(ur ? "Rider ko call" : "Call rider")+'</a>' : "") +
      (D.rider.mapUrl ? '<a class="btn alt" href="'+esc(D.rider.mapUrl)+'" target="_blank" rel="noopener">📍 Map</a>' : "") + '</div></div>';
  }
  const pickup = D.fulfilment === "pickup" && D.branch ? '<div class="sub">🏪 '+esc(D.branch.name)+' — '+esc(D.branch.address)+'</div>' : "";
  app.innerHTML =
    '<h1>'+esc(D.shop)+'</h1><div class="sub">Order # <b>'+esc(D.number)+'</b></div>' + head + rider +
    (D.rejected ? "" : '<div class="card"><ol class="steps">'+D.steps.map(s => '<li class="'+(s.current?"current":s.done?"done":"")+'">'+esc(s.label)+'</li>').join("")+'</ol></div>') +
    '<div class="card"><ul>'+D.items.map(i => '<li>'+esc(i)+'</li>').join("")+'</ul>' +
    '<div class="row"><b>Total</b><b>'+esc(D.total)+'</b></div><div class="sub">'+esc(D.payment)+'</div>'+pickup+'</div>' +
    '<div class="note">'+(ur ? "Ye page khud update hota rehta hai." : "This page updates by itself.")+'</div>';
}
async function refresh(){
  if (!D || ["delivered","picked_up","rejected"].includes(D.status)) return;
  try { const r = await fetch(location.pathname.replace(/\\/$/, "") + "/api", { cache: "no-store" }); if (r.status === 404) D = null; else if (r.ok) D = await r.json(); render(); } catch {}
}
render(); setInterval(refresh, 15000);
</script>
</body>
</html>`;
}
