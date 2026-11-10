// Single-file HTML for the rider page. Big buttons, works on cheap phones, polls every 10 seconds.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function riderPage(vendorName: string): string {
  const title = escapeHtml(vendorName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Rider</title>
<style>
  :root { --bg:#f4f6f8; --card:#fff; --ink:#15191e; --muted:#5f6b76; --line:#dfe4e9; --go:#0b7a3e; --info:#1d4ed8; --warn:#c2410c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0f1316; --card:#1a2026; --ink:#eef2f5; --muted:#9aa7b2; --line:#2b333b; --go:#22c55e; --info:#60a5fa; --warn:#fb923c; } }
  * { box-sizing:border-box; }
  body { margin:0; font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); }
  header { background:var(--card); border-bottom:1px solid var(--line); padding:12px 16px; position:sticky; top:0; z-index:2; }
  header h1 { margin:0; font-size:18px; }
  .who { display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap:wrap; }
  select { font:inherit; padding:8px 10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); min-height:44px; flex:1; }
  main { padding:12px 16px 40px; max-width:640px; margin:0 auto; }
  h2 { font-size:16px; margin:18px 0 8px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:12px; }
  .row { display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
  .num { font-weight:800; font-size:20px; }
  .muted { color:var(--muted); font-size:14px; }
  .cash { font-size:22px; font-weight:800; color:var(--warn); }
  .paid { font-weight:700; color:var(--go); }
  ul { margin:6px 0; padding-left:18px; }
  .btn { display:block; width:100%; min-height:52px; border:0; border-radius:12px; font-size:17px; font-weight:700; color:#fff; background:var(--info); margin-top:10px; text-align:center; text-decoration:none; line-height:52px; }
  .btn.go { background:var(--go); }
  .btn.ghost { background:var(--line); color:var(--ink); }
  .links { display:flex; gap:8px; }
  .links .btn { flex:1; }
  label.chk { display:flex; gap:10px; align-items:center; margin-top:10px; font-weight:600; }
  label.chk input { width:24px; height:24px; }
  .empty { color:var(--muted); text-align:center; padding:20px 0; }
  .stat { font-size:14px; color:var(--muted); }
</style>
</head>
<body>
<header>
  <h1>🛵 ${title}</h1>
  <div class="who"><select id="me" aria-label="Rider name"><option value="">Apna naam chunein…</option></select></div>
  <div class="stat" id="stat"></div>
</header>
<main id="list"><div class="empty">Loading…</div></main>
<script>
const KEY = new URLSearchParams(location.search).get("key") || "";
const BASE = location.pathname.replace(/\\/$/, "");
let me = null, cur = "PKR";
try { me = localStorage.getItem("rider:" + BASE); } catch {}
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const money = n => cur + " " + Number(n).toLocaleString("en-US");
async function api(path, body){
  const res = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: { "x-rider-key": KEY, ...(body ? {"content-type":"application/json"} : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function readyCard(o){
  return '<div class="card"><div class="row"><span class="num">'+esc(o.number)+'</span>' +
    (o.collect ? '<span class="cash">'+money(o.collect)+'</span>' : '<span class="paid">Paid online</span>') + '</div>' +
    (o.scheduledLabel ? '<div class="muted">⏰ Pre-order: '+esc(o.scheduledLabel)+'</div>' : "") +
    '<div class="muted">Uthana: '+esc(o.branch)+'</div>' +
    '<div class="muted">Dena: '+esc(o.customerName || "Customer")+(o.addressNote ? " · "+esc(o.addressNote) : "")+'</div>' +
    '<button class="btn go" data-a="take" data-id="'+o.id+'">Main le ja raha hoon</button></div>';
}
function mineCard(o){
  return '<div class="card"><div class="row"><span class="num">'+esc(o.number)+'</span>' +
    (o.collect ? '<span class="cash">Cash: '+money(o.collect)+'</span>' : '<span class="paid">Paid online</span>') + '</div>' +
    '<div><b>'+esc(o.customerName || "Customer")+'</b></div>' +
    (o.addressNote ? '<div>🏠 '+esc(o.addressNote)+'</div>' : "") +
    '<ul>'+o.items.map(i => '<li>'+esc(i)+'</li>').join("")+'</ul>' +
    '<div class="links">' + (o.mapUrl ? '<a class="btn" href="'+o.mapUrl+'" target="_blank" rel="noopener">📍 Map</a>' : "") +
    '<a class="btn ghost" href="tel:+'+esc(o.customer)+'">📞 Call</a></div>' +
    (o.collect ? '<label class="chk"><input type="checkbox" id="cash'+o.id+'"> '+money(o.collect)+' cash mil gaya</label>' : "") +
    '<button class="btn go" data-a="done" data-id="'+o.id+'" data-cod="'+(o.collect?1:0)+'">Deliver ho gaya ✅</button></div>';
}
async function load(){
  try {
    const s = await api("/api/state?rider=" + encodeURIComponent(me ?? ""));
    cur = s.currency;
    const sel = document.getElementById("me");
    if (sel.options.length <= 1) for (const r of s.riders) sel.add(new Option(r.name, String(r.i)));
    if (me !== null) sel.value = me;
    document.getElementById("stat").textContent = s.me ? "Aaj: " + s.today.delivered + " delivery · cash " + money(s.today.cash) : "";
    let h = "";
    if (!s.me) h += '<div class="card">Upar se apna naam chunein, phir orders dikhenge.</div>';
    else {
      h += '<h2>Meri deliveries</h2>' + (s.mine.map(mineCard).join("") || '<div class="empty">Abhi koi order aap ke paas nahi.</div>');
      h += '<h2>Tayyar orders (uthane ke liye)</h2>' + (s.ready.map(readyCard).join("") || '<div class="empty">Koi order tayyar nahi.</div>');
    }
    document.getElementById("list").innerHTML = h;
  } catch (e) { document.getElementById("stat").textContent = "Connection masla: " + e.message; }
}
document.getElementById("me").addEventListener("change", e => { me = e.target.value || null; try { localStorage.setItem("rider:" + BASE, me ?? ""); } catch {} load(); });
document.getElementById("list").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  b.disabled = true;
  try {
    if (b.dataset.a === "take") await api("/api/orders/"+b.dataset.id+"/take", { rider: Number(me) });
    if (b.dataset.a === "done") {
      const box = document.getElementById("cash"+b.dataset.id);
      if (b.dataset.cod === "1" && !(box && box.checked) && !confirm("Cash mila? Agar nahi mila to OK dabayein, owner ko 'baqi' dikhega.")) { b.disabled = false; return; }
      await api("/api/orders/"+b.dataset.id+"/delivered", { rider: Number(me), cash: Boolean(box && box.checked) });
    }
  } catch (err) { alert(err.message); }
  load();
});
load(); setInterval(load, 10000);
</script>
</body>
</html>`;
}
