// Single-file HTML for the kitchen/rider screen. Polls the server every 5 seconds.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function opsPage(vendorName: string): string {
  const title = escapeHtml(vendorName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Orders</title>
<style>
  :root { --bg:#f6f6f4; --card:#fff; --ink:#1d1d1b; --muted:#6b6b66; --line:#e3e3de;
          --new:#d9480f; --ok:#2b8a3e; --info:#1864ab; --warn:#e8590c; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#141413; --card:#1f1f1d; --ink:#f1f1ee; --muted:#a3a39d; --line:#33332f; }
  }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--ink); }
  header { position:sticky; top:0; background:var(--card); border-bottom:1px solid var(--line); padding:10px 16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; z-index:2; }
  header h1 { font-size:17px; margin:0; flex:1; min-width:140px; }
  .stat { font-size:13px; color:var(--muted); }
  .tabs { display:flex; gap:6px; padding:10px 16px 0; flex-wrap:wrap; }
  .tabs button { border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:999px; padding:6px 12px; font-size:14px; }
  .tabs button.on { background:var(--ink); color:var(--bg); }
  main { padding:12px 16px 40px; display:grid; gap:12px; grid-template-columns:repeat(auto-fill, minmax(290px, 1fr)); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; }
  .card.new { border-left:5px solid var(--new); }
  .row { display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
  .num { font-weight:700; font-size:18px; }
  .badge { font-size:12px; border-radius:6px; padding:2px 8px; background:var(--line); white-space:nowrap; }
  .badge.new { background:var(--new); color:#fff; } .badge.ok { background:var(--ok); color:#fff; }
  .badge.info { background:var(--info); color:#fff; } .badge.warn { background:var(--warn); color:#fff; }
  ul { margin:0; padding-left:18px; }
  .muted { color:var(--muted); font-size:13px; }
  .btns { display:flex; gap:6px; flex-wrap:wrap; }
  .btns button { flex:1 1 auto; min-height:42px; border:0; border-radius:8px; font-size:15px; font-weight:600; padding:8px 10px; background:var(--info); color:#fff; }
  .btns button.ok { background:var(--ok); } .btns button.bad { background:#c92a2a; } .btns button.ghost { background:var(--line); color:var(--ink); }
  input { width:100%; min-height:38px; border:1px solid var(--line); border-radius:8px; padding:6px 8px; background:var(--bg); color:var(--ink); font-size:15px; }
  a { color:var(--info); }
  .section { grid-column:1/-1; font-weight:700; margin-top:6px; }
  .empty { grid-column:1/-1; color:var(--muted); text-align:center; padding:30px 0; }
  #sound { border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:8px; padding:6px 10px; }
</style>
</head>
<body>
<header>
  <h1>${title}</h1>
  <span class="stat" id="stats">…</span>
  <button id="sound">🔔 Sound on</button>
</header>
<div class="tabs" id="tabs">
  <button data-v="all" class="on">Sab</button>
  <button data-v="kitchen">Kitchen</button>
  <button data-v="rider">Rider</button>
  <button data-v="chats">Chats</button>
  <button data-v="done">Aaj complete</button>
  <button data-v="menu">Menu</button>
  <button data-v="report">Report</button>
</div>
<main id="list"><div class="empty">Loading…</div></main>
<script>
const KEY = new URLSearchParams(location.search).get("key") || "";
const BASE = location.pathname.replace(/\\/$/, "");
let view = localStorageGet("view") || "all";
let state = null, seen = new Set(), firstLoad = true, soundOn = false, ctx = null;

function localStorageGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k,v){ try { localStorage.setItem(k,v); } catch {} }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
function ago(ms){ const m = Math.round((Date.now()-ms)/60000); return m < 1 ? "abhi" : m + " min pehle"; }
function money(n){ return "Rs " + Number(n).toLocaleString("en-US"); }

async function api(path, body){
  const res = await fetch(BASE + path, { method: body ? "POST" : "GET",
    headers: { "x-ops-key": KEY, ...(body ? {"content-type":"application/json"} : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function beep(){
  if (!soundOn) return;
  try {
    ctx = ctx || new AudioContext();
    [0, 0.25, 0.5].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22); });
  } catch {}
}

const STATUS = { new:["NAYA","new"], accepted:["Kitchen mein","info"], ready:["Tayyar","ok"],
  out_for_delivery:["Rider raste mein","info"], delivered:["Delivered","ok"], picked_up:["Le gaya","ok"], rejected:["Reject","warn"] };
const PAY = { cod:"COD", awaiting:"Online: intezar", claimed:"Online: screenshot aaya", verified:"Online: mil gayi ✅", not_received:"Online: nahi mili ❌" };

function card(o){
  const [label, cls] = STATUS[o.status] || [o.status, ""];
  const b = [];
  if (o.status === "new") b.push(
    '<button class="ok" data-a="accept" data-p="15" data-id="'+o.id+'">Accept 15m</button>',
    '<button class="ok" data-a="accept" data-p="25" data-id="'+o.id+'">25m</button>',
    '<button class="ok" data-a="accept" data-p="40" data-id="'+o.id+'">40m</button>',
    '<button class="bad" data-a="reject" data-id="'+o.id+'">Reject</button>');
  if (o.status === "accepted") b.push('<button data-a="ready" data-id="'+o.id+'">Tayyar ho gaya</button>');
  let rider = "";
  if (o.status === "ready" && o.fulfilment === "delivery") {
    rider = (state.riders && state.riders.length)
      ? '<select id="ri'+o.id+'" aria-label="Rider"><option value="">Rider chunein…</option>'+state.riders.map((r,i) => '<option value="'+i+'">'+esc(r)+'</option>').join("")+'</select>'
      : '<input placeholder="Rider ka naam (optional)" id="rn'+o.id+'"><input placeholder="Rider ka number (optional)" id="rp'+o.id+'" inputmode="tel">';
    b.push('<button data-a="out" data-id="'+o.id+'">Rider nikal gaya 🛵</button>');
  }
  if (o.status === "ready" && o.fulfilment === "pickup") b.push('<button class="ok" data-a="picked" data-id="'+o.id+'">Customer le gaya</button>');
  if (o.status === "out_for_delivery") b.push(o.paymentMethod === "cod"
    ? '<button class="ok" data-a="delivered" data-c="1" data-id="'+o.id+'">Deliver + cash mil gaya</button>'
    : '<button class="ok" data-a="delivered" data-id="'+o.id+'">Deliver ho gaya</button>');
  if (o.paymentMethod === "online" && (o.paymentStatus === "claimed" || o.paymentStatus === "awaiting")) b.push(
    '<button class="ok" data-a="paid" data-id="'+o.id+'">Payment mil gayi</button>',
    '<button class="ghost" data-a="unpaid" data-id="'+o.id+'">Nahi mili</button>');
  const wa = "https://wa.me/" + encodeURIComponent(o.customer);
  return '<div class="card '+(o.status==="new"?"new":"")+'">' +
    '<div class="row"><span class="num">'+esc(o.number)+'</span><span class="badge '+cls+'">'+label+'</span></div>' +
    (o.scheduledLabel ? '<div class="badge warn" style="align-self:flex-start">⏰ Pre-order: '+esc(o.scheduledLabel)+'</div>' : "") +
    '<div class="muted">'+esc(o.fulfilment === "delivery" ? "🛵 Delivery" : "🏪 Pickup")+' · '+esc(o.branch)+' · '+ago(o.createdAt)+(o.scheduledLabel ? "" : ' · ETA '+o.etaMin+'-'+o.etaMax+' min')+'</div>' +
    '<ul>'+o.items.map(i => '<li>'+esc(i)+'</li>').join("")+'</ul>' +
    '<div class="row"><b>'+money(o.total)+'</b><span class="badge">'+esc(PAY[o.paymentStatus] || o.paymentStatus)+'</span></div>' +
    (o.paymentNote ? '<div class="muted">'+esc(o.paymentNote)+'</div>' : "") +
    '<div class="muted">'+esc(o.customerName || "")+' · <a href="'+wa+'" target="_blank" rel="noopener">+'+esc(o.customer)+'</a>' +
      (o.mapUrl ? ' · <a href="'+o.mapUrl+'" target="_blank" rel="noopener">📍 Map</a>' : "") + '</div>' +
    (o.addressNote ? '<div class="muted">🏠 '+esc(o.addressNote)+'</div>' : "") +
    (o.riderName ? '<div class="muted">🛵 Rider: '+esc(o.riderName)+(o.paymentMethod === "cod" && o.status === "delivered" ? (o.cashCollected ? " · cash ✅" : " · cash baqi") : "")+'</div>' : "") +
    rider + (b.length ? '<div class="btns">'+b.join("")+'</div>' : "") + '</div>';
}

function chatCard(h){
  return '<div class="card new"><div class="row"><b>'+esc(h.customerName || "Customer")+'</b><span class="badge new">Staff chahiye</span></div>' +
    '<div>'+esc(h.reason || "")+'</div><div class="muted">'+ago(h.lastAt)+'</div>' +
    '<div class="btns"><a href="https://wa.me/'+encodeURIComponent(h.customer)+'" target="_blank" rel="noopener"><button class="ghost">WhatsApp kholo</button></a>' +
    '<button data-a="release" data-id="'+h.sessionId+'">Bot ko wapas do</button></div>' +
    '<div class="muted">Jawab apni WhatsApp Business app se dein. Kaam khatam ho to "Bot ko wapas do" dabayein.</div></div>';
}

let menuState = null, reportState = null, reportRange = "today";

async function loadMenu(){ menuState = await api("/api/menu"); render(); }
async function loadReport(){ reportState = await api("/api/report?range=" + reportRange); render(); }

function menuView(){
  if (!menuState) return '<div class="empty">Loading…</div>';
  let h = '<div class="card '+(menuState.paused?"new":"")+'"><div class="row"><b>Naye orders</b><span class="badge '+(menuState.paused?"warn":"ok")+'">'+(menuState.paused?"BAND":"Chalu")+'</span></div>' +
    '<div class="muted">Kitchen bohat busy ho to orders thori der ke liye band kar dein. Bot customers ko bata dega.</div>' +
    '<div class="btns"><button class="'+(menuState.paused?"ok":"bad")+'" data-a="pause" data-p="'+(menuState.paused?"0":"1")+'">'+(menuState.paused?"Orders chalu karo":"Orders band karo")+'</button></div></div>';
  const cats = [...new Set(menuState.items.map(i => i.category))];
  for (const c of cats) {
    h += '<div class="section">'+esc(c)+'</div>';
    h += menuState.items.filter(i => i.category === c).map(i =>
      '<div class="card"><div class="row"><span>'+esc(i.name)+'</span><span class="badge '+(i.soldOut?"warn":"ok")+'">'+(i.soldOut?"Khatam":"Available")+'</span></div>' +
      '<div class="btns"><button class="'+(i.soldOut?"ok":"ghost")+'" data-a="item" data-id="'+esc(i.id)+'" data-s="'+(i.soldOut?"0":"1")+'">'+(i.soldOut?"Wapas available karo":"Khatam (sold out) karo")+'</button></div></div>').join("");
  }
  return h;
}

function reportView(){
  const tabs = [["today","Aaj"],["yesterday","Kal"],["week","7 din"]].map(([k,l]) =>
    '<button class="'+(k===reportRange?"":"ghost")+'" data-a="range" data-id="'+k+'">'+l+'</button>').join("");
  let h = '<div class="card"><div class="btns">'+tabs+'</div></div>';
  if (!reportState) return h + '<div class="empty">Loading…</div>';
  const r = reportState;
  h += '<div class="card"><div class="row"><b>'+esc(r.label)+'</b></div>' +
    '<div class="row"><span>Orders</span><b>'+r.orders+'</b></div>' +
    '<div class="row"><span>Sale</span><b>'+money(r.revenue)+'</b></div>' +
    '<div class="row"><span>Average order</span><span>'+money(r.avgOrder)+'</span></div>' +
    '<div class="row"><span>Delivery / Pickup</span><span>'+r.delivery+' / '+r.pickup+'</span></div>' +
    '<div class="row"><span>COD / Online</span><span>'+r.cod+' / '+r.online+'</span></div>' +
    (r.preorders ? '<div class="row"><span>Pre-orders</span><span>'+r.preorders+'</span></div>' : "") +
    (r.rejected ? '<div class="row"><span>Reject</span><span>'+r.rejected+'</span></div>' : "") + '</div>';
  h += '<div class="card"><b>🔥 Top items</b>' + (r.topItems.length ? '<ul>'+r.topItems.map(t => '<li>'+esc(t.name)+' × '+t.qty+'</li>').join("")+'</ul>' : '<div class="muted">Abhi koi order nahi.</div>') + '</div>';
  if (r.riders && r.riders.length) h += '<div class="card"><b>🛵 Riders ka hisaab</b>' + r.riders.map(x =>
    '<div class="row"><span>'+esc(x.name)+' · '+x.deliveries+' delivery</span><span>'+money(x.cash)+(x.cashPending ? ' <span class="badge warn">baqi '+money(x.cashPending)+'</span>' : "")+'</span></div>').join("") + '</div>';
  return h;
}

function render(){
  if (view === "menu") { document.getElementById("list").innerHTML = menuView(); return; }
  if (view === "report") { document.getElementById("list").innerHTML = reportView(); return; }
  if (!state) return;
  const t = state.today;
  document.getElementById("stats").textContent = (state.paused ? "⏸️ ORDERS BAND · " : "") + "Aaj: " + t.orders + " orders · " + money(t.revenue);
  const open = state.open;
  let html = "";
  const kitchen = open.filter(o => o.status === "new" || o.status === "accepted");
  const rider = open.filter(o => o.status === "ready" || o.status === "out_for_delivery");
  const pay = open.filter(o => o.paymentMethod === "online" && o.paymentStatus === "claimed" && !kitchen.includes(o) && !rider.includes(o));
  if (view === "all" || view === "chats") {
    if (state.handoffs.length) html += '<div class="section">Staff ke liye chats</div>' + state.handoffs.map(chatCard).join("");
    else if (view === "chats") html += '<div class="empty">Koi chat staff ka intezar nahi kar rahi.</div>';
  }
  if (view === "all" || view === "kitchen") html += '<div class="section">Kitchen</div>' + (kitchen.map(card).join("") || '<div class="empty">Koi order kitchen mein nahi.</div>');
  if (view === "all" || view === "rider") html += '<div class="section">Rider / Pickup</div>' + (rider.map(card).join("") || '<div class="empty">Koi order tayyar nahi.</div>');
  if (view === "all" && pay.length) html += '<div class="section">Payment check</div>' + pay.map(card).join("");
  if (view === "done") html += state.done.map(card).join("") || '<div class="empty">Aaj abhi koi order complete nahi hua.</div>';
  document.getElementById("list").innerHTML = html;
}

async function load(){
  try {
    state = await api("/api/state");
    const ids = state.open.filter(o => o.status === "new").map(o => o.id);
    const fresh = ids.filter(id => !seen.has(id));
    ids.forEach(id => seen.add(id));
    if (!firstLoad && (fresh.length || state.handoffs.some(h => !seen.has("h"+h.sessionId)))) beep();
    state.handoffs.forEach(h => seen.add("h"+h.sessionId));
    firstLoad = false;
    render();
  } catch (e) { document.getElementById("stats").textContent = "Connection masla: " + e.message; }
}

document.getElementById("list").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-a]"); if (!btn) return;
  const id = btn.dataset.id, a = btn.dataset.a;
  btn.disabled = true;
  try {
    if (a === "accept") await api("/api/orders/"+id+"/status", { to:"accepted", prepMinutes:Number(btn.dataset.p) });
    if (a === "reject" && confirm("Order reject karna hai? Customer ko message jayega.")) await api("/api/orders/"+id+"/status", { to:"rejected" });
    if (a === "ready") await api("/api/orders/"+id+"/status", { to:"ready" });
    if (a === "out") await api("/api/orders/"+id+"/status", { to:"out_for_delivery",
      riderIndex: document.getElementById("ri"+id) && document.getElementById("ri"+id).value !== "" ? Number(document.getElementById("ri"+id).value) : undefined,
      riderName: (document.getElementById("rn"+id)||{}).value, riderPhone: (document.getElementById("rp"+id)||{}).value });
    if (a === "picked") await api("/api/orders/"+id+"/status", { to:"picked_up" });
    if (a === "delivered") await api("/api/orders/"+id+"/status", { to:"delivered", cashCollected: btn.dataset.c === "1" ? true : undefined });
    if (a === "paid") await api("/api/orders/"+id+"/payment", { status:"verified" });
    if (a === "unpaid" && confirm("Customer ko batana hai ke payment nahi mili?")) await api("/api/orders/"+id+"/payment", { status:"not_received" });
    if (a === "release") await api("/api/handoffs/"+id+"/release", {});
    if (a === "pause") { await api("/api/menu", { paused: btn.dataset.p === "1" }); await loadMenu(); }
    if (a === "item") { await api("/api/menu", { itemId: id, soldOut: btn.dataset.s === "1" }); await loadMenu(); }
    if (a === "range") { reportRange = id; reportState = null; render(); await loadReport(); }
  } catch (err) { alert(err.message); }
  await load();
});

document.getElementById("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-v]"); if (!b) return;
  view = b.dataset.v; localStorageSet("view", view);
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("on", x === b));
  render();
  if (view === "menu") loadMenu().catch(e => alert(e.message));
  if (view === "report") loadReport().catch(e => alert(e.message));
});
document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("on", x.dataset.v === view));
document.getElementById("sound").addEventListener("click", (e) => {
  soundOn = !soundOn; e.target.textContent = soundOn ? "🔔 Sound: ON" : "🔔 Sound on"; if (soundOn) beep();
});

load(); setInterval(load, 5000);
if (view === "menu") loadMenu(); if (view === "report") loadReport();
</script>
</body>
</html>`;
}
