// Single-file HTML for the owner portal. Mobile first; everything in Roman Urdu.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function portalPage(vendorName: string): string {
  const title = escapeHtml(vendorName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · Owner</title>
<style>
  :root { --bg:#f5f4f0; --card:#fff; --ink:#1d1c1a; --muted:#706b63; --line:#e4dfd6; --brand:#b45309; --ok:#15803d; --bad:#b91c1c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#131211; --card:#1e1c1a; --ink:#f2efea; --muted:#a59e94; --line:#36322d; --brand:#f59e0b; --ok:#4ade80; --bad:#f87171; } }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); padding-bottom:90px; }
  header { background:var(--card); border-bottom:1px solid var(--line); padding:12px 16px 0; position:sticky; top:0; z-index:5; }
  header h1 { font-size:18px; margin:0 0 8px; }
  .tabs { display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; }
  .tabs button { flex:none; border:0; background:none; color:var(--muted); font-size:15px; font-weight:600; padding:8px 12px; border-bottom:3px solid transparent; }
  .tabs button.on { color:var(--ink); border-bottom-color:var(--brand); }
  main { max-width:720px; margin:0 auto; padding:12px 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:12px; }
  h2 { font-size:16px; margin:18px 0 8px; }
  h3 { font-size:15px; margin:0 0 8px; }
  label { display:block; font-size:13px; color:var(--muted); margin:8px 0 4px; }
  input[type=text], input[type=number], input[type=time], select, textarea { width:100%; font:inherit; padding:9px 10px; border-radius:9px; border:1px solid var(--line); background:var(--bg); color:var(--ink); min-height:40px; }
  textarea { min-height:90px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .row { display:flex; gap:8px; align-items:center; }
  .row > * { flex:1; }
  .chk { display:flex; gap:8px; align-items:center; font-size:14px; color:var(--ink); margin:8px 0; }
  .chk input { width:20px; height:20px; flex:none; }
  button.small { border:1px solid var(--line); background:var(--bg); color:var(--ink); border-radius:8px; padding:6px 10px; font-size:14px; min-height:36px; flex:none; }
  button.del { color:var(--bad); }
  .item.off { opacity:.6; }
  .muted { color:var(--muted); font-size:13px; }
  .bar { position:fixed; left:0; right:0; bottom:0; background:var(--card); border-top:1px solid var(--line); padding:10px 16px calc(10px + env(safe-area-inset-bottom)); z-index:6; }
  .bar .in { max-width:720px; margin:0 auto; display:flex; gap:8px; align-items:center; }
  .bar button { min-height:48px; border:0; border-radius:12px; font-size:16px; font-weight:700; padding:0 18px; }
  .save { background:var(--ok); color:#fff; flex:1; }
  .save:disabled { background:var(--line); color:var(--muted); }
  .msg { font-size:14px; flex:2; }
  .msg.err { color:var(--bad); } .msg.good { color:var(--ok); }
  .day { display:grid; grid-template-columns:62px minmax(0,1fr) minmax(0,1fr) auto; gap:6px; align-items:center; margin:4px 0; }
  .day b { font-size:13px; }
  .day input[type=time] { min-width:0; padding:6px 4px; font-size:14px; }
  .day input[type=time]::-webkit-calendar-picker-indicator { display:none; }
  .day .chk { font-size:13px; gap:4px; }
  .stat { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--line); }
  .stat:last-child { border-bottom:0; }
  .hide { display:none; }
</style>
</head>
<body>
<header>
  <h1>${title}</h1>
  <div class="tabs" id="tabs">
    <button data-t="menu" class="on">Menu</button>
    <button data-t="settings">Timing &amp; Delivery</button>
    <button data-t="money">Hisaab</button>
    <button data-t="history">History</button>
  </div>
</header>
<main id="main"><div class="card">Loading…</div></main>
<div class="bar"><div class="in"><span class="msg" id="msg"></span><button class="save" id="save" disabled>Save karo</button></div></div>
<script>
const KEY = new URLSearchParams(location.search).get("key") || "";
const BASE = location.pathname.replace(/\\/$/, "");
const DAYS = [["mon","Pir"],["tue","Mangal"],["wed","Budh"],["thu","Jumerat"],["fri","Juma"],["sat","Hafta"],["sun","Itwar"]];
let D = null, tab = "menu", dirty = false;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const money = n => (D ? D.currency : "PKR") + " " + Number(n).toLocaleString("en-US");
async function api(path, method = "GET", body){
  const res = await fetch(BASE + path, { method, headers: { "x-owner-key": KEY, ...(body ? {"content-type":"application/json"} : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function msg(t, good){ const m = document.getElementById("msg"); m.textContent = t; m.className = "msg " + (good ? "good" : t ? "err" : ""); }
function setDirty(v){ dirty = v; const s = document.getElementById("save"); s.disabled = !v || tab === "money" || tab === "history"; if (v) msg(""); }

// ---------- Menu ----------
function itemCard(it, i){
  const sizes = Array.isArray(it.variants) && it.variants.length;
  return '<div class="card item '+(it.available === false ? "off" : "")+'" data-i="'+i+'">' +
    '<div class="row"><input type="text" data-f="name" value="'+esc(it.name)+'" placeholder="Item ka naam" aria-label="Naam"><button class="small del" data-a="del">Hatao</button></div>' +
    '<div class="grid2"><div><label>Category</label><input type="text" data-f="category" list="cats" value="'+esc(it.category)+'"></div>' +
    (sizes ? '<div></div>' : '<div><label>Price</label><input type="number" inputmode="numeric" data-f="price" value="'+esc(it.price)+'"></div>') + '</div>' +
    (sizes ? '<label>Sizes aur price</label>' + it.variants.map((v, j) =>
      '<div class="row" style="margin-bottom:6px"><input type="text" data-v="'+j+'" data-vf="name" value="'+esc(v.name)+'" placeholder="Size"><input type="number" inputmode="numeric" data-v="'+j+'" data-vf="price" value="'+esc(v.price)+'" placeholder="Price"><button class="small del" data-a="delsize" data-j="'+j+'">✕</button></div>').join("") : "") +
    '<div class="row" style="margin-top:6px"><button class="small" data-a="addsize">+ Size</button>' + (sizes ? '<button class="small" data-a="nosize">Sizes hatao</button>' : "") + '<span></span></div>' +
    '<label>Detail (optional)</label><input type="text" data-f="description" value="'+esc(it.description || "")+'">' +
    '<label class="chk"><input type="checkbox" data-f="available" '+(it.available === false ? "" : "checked")+'> Menu pe dikhao (available)</label></div>';
}
function renderMenu(){
  const cats = [...new Set(D.menu.map(i => i.category).filter(Boolean))];
  let h = '<datalist id="cats">'+cats.map(c => '<option value="'+esc(c)+'">').join("")+'</datalist>' +
    '<div class="card muted">Price ya naam badal kar neeche <b>Save karo</b> dabayein; bot foran naya menu use karega. Aaj ke liye koi cheez khatam ho to kitchen screen ke Menu tab ya WhatsApp pe <b>#off</b> use karein.</div>';
  for (const c of cats) {
    h += '<h2>'+esc(c)+'</h2>' + D.menu.map((it, i) => it.category === c ? itemCard(it, i) : "").join("") +
      '<button class="small" data-a="add" data-cat="'+esc(c)+'">+ '+esc(c)+' mein item</button>';
  }
  h += D.menu.filter(i => !i.category).map(it => itemCard(it, D.menu.indexOf(it))).join("");
  h += '<h2>Nayi category</h2><div class="row"><input type="text" id="newcat" placeholder="Jaise: Desserts"><button class="small" data-a="newcat">+ Item</button></div>';
  document.getElementById("main").innerHTML = h;
}
function menuInput(e){
  const card = e.target.closest(".item"); if (!card) return;
  const it = D.menu[Number(card.dataset.i)];
  const f = e.target.dataset.f, vf = e.target.dataset.vf;
  if (f === "available") it.available = e.target.checked;
  else if (f === "price") it.price = e.target.value === "" ? "" : Number(e.target.value);
  else if (f) it[f] = e.target.value;
  else if (vf) { const v = it.variants[Number(e.target.dataset.v)]; v[vf] = vf === "price" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value; }
  setDirty(true);
}
function menuClick(e){
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const card = b.closest(".item"); const it = card ? D.menu[Number(card.dataset.i)] : null;
  const a = b.dataset.a;
  if (a === "del" && confirm('"' + (it.name || "Item") + '" menu se hatana hai?')) D.menu.splice(Number(card.dataset.i), 1);
  else if (a === "addsize") { if (!it.variants || !it.variants.length) { it.variants = [{ name: "Regular", price: it.price || "" }]; delete it.price; } else it.variants.push({ name: "", price: "" }); }
  else if (a === "delsize") { it.variants.splice(Number(b.dataset.j), 1); if (!it.variants.length) { delete it.variants; it.price = ""; } }
  else if (a === "nosize") { it.price = it.variants[0] ? it.variants[0].price : ""; delete it.variants; }
  else if (a === "add") D.menu.push({ name: "", category: b.dataset.cat, price: "", available: true });
  else if (a === "newcat") { const c = document.getElementById("newcat").value.trim(); if (!c) return; D.menu.push({ name: "", category: c, price: "", available: true }); }
  else return;
  setDirty(true); renderMenu();
}

// ---------- Timing & delivery ----------
function ruleFields(r, bi){
  const n = (k, v, ph) => '<div><label>'+ph+'</label><input type="number" inputmode="decimal" data-b="'+bi+'" data-r="'+k+'" value="'+esc(v ?? "")+'"></div>';
  if (r.type === "flat") return '<div class="grid2">'+n("fee", r.fee, "Har order pe charge")+'</div>';
  if (r.type === "per_km") return '<div class="grid2">'+n("baseFee", r.baseFee, "Base charge")+n("perKm", r.perKm, "Har km")+n("includedKm", r.includedKm, "Pehle kitne km base mein")+'</div>';
  if (r.type === "slabs") return (r.slabs || []).map((s, j) => '<div class="row" style="margin-top:6px"><span class="muted" style="flex:0 0 auto">Tak</span><input type="number" inputmode="decimal" data-b="'+bi+'" data-slab="'+j+'" data-sf="upToKm" value="'+esc(s.upToKm)+'" placeholder="km"><input type="number" inputmode="numeric" data-b="'+bi+'" data-slab="'+j+'" data-sf="fee" value="'+esc(s.fee)+'" placeholder="charge"><button class="small del" data-a="delslab" data-b="'+bi+'" data-j="'+j+'">✕</button></div>').join("") +
    '<button class="small" style="margin-top:6px" data-a="addslab" data-b="'+bi+'">+ Slab</button>';
  return '<div class="muted">Har jagah delivery free.</div>';
}
function renderSettings(){
  let h = "";
  D.branches.forEach((b, bi) => {
    const d = b.delivery, r = d.rule;
    h += '<div class="card"><h3>'+esc(b.name)+'</h3><div class="muted">'+esc(b.address)+'</div><h2>Timing (Pakistan time)</h2>' +
      DAYS.map(([k, label]) => { const t = b.hours[k];
        return '<div class="day"><b>'+label+'</b><input type="time" data-b="'+bi+'" data-day="'+k+'" data-hf="open" value="'+(t ? t.open : "")+'" '+(t ? "" : "disabled")+' aria-label="'+label+' open">' +
          '<input type="time" data-b="'+bi+'" data-day="'+k+'" data-hf="close" value="'+(t ? t.close : "")+'" '+(t ? "" : "disabled")+' aria-label="'+label+' close">' +
          '<label class="chk" style="margin:0"><input type="checkbox" data-b="'+bi+'" data-day="'+k+'" data-hf="closed" '+(t ? "" : "checked")+'> Band</label></div>'; }).join("") +
      '<div class="muted">Raat 12 ke baad band ho to close ka waqt chhota likhein, jaise 12:00 se 02:00.</div>' +
      '<h2>Delivery</h2><label>Charges kaise?</label><select data-b="'+bi+'" data-a2="ruletype">' +
      [["free","Free delivery"],["flat","Har order pe ek jaisa"],["slabs","Distance ke slabs"],["per_km","Base + har km"]].map(([v,l]) => '<option value="'+v+'" '+(r.type===v?"selected":"")+'>'+l+'</option>').join("") + '</select>' +
      ruleFields(r, bi) +
      '<div class="grid2"><div><label>Max delivery (km)</label><input type="number" inputmode="decimal" data-b="'+bi+'" data-d="maxKm" value="'+esc(d.maxKm)+'"></div>' +
      '<div><label>Free delivery is se upar (khaali = nahi)</label><input type="number" inputmode="numeric" data-b="'+bi+'" data-d="freeAbove" value="'+esc(d.freeAbove ?? "")+'"></div>' +
      '<div><label>Minimum order</label><input type="number" inputmode="numeric" data-b="'+bi+'" data-d="minOrder" value="'+esc(d.minOrder ?? 0)+'"></div>' +
      '<div><label>Kitchen ka aam time (min)</label><input type="number" inputmode="numeric" data-b="'+bi+'" data-bf="prepMinutes" value="'+esc(b.prepMinutes)+'"></div></div>' +
      '<label class="chk"><input type="checkbox" data-b="'+bi+'" data-bf="pickup" '+(b.pickup ? "checked" : "")+'> Pickup (customer khud le jaye)</label></div>';
  });
  h += '<div class="card"><h3>Payment</h3><label class="chk"><input type="checkbox" id="cod" '+(D.payment.cod !== false ? "checked" : "")+'> Cash on Delivery</label>' +
    '<label>Online payment ki detail (khaali = online nahi)</label><input type="text" id="online" value="'+esc(D.payment.online || "")+'" placeholder="Raast ID / JazzCash / Easypaisa number"></div>' +
    '<div class="card"><h3>Bot ke liye</h3><label>Upsell: bot order ke saath ye offer kare (optional)</label><input type="text" id="upsell" value="'+esc(D.upsell)+'" placeholder="Jaise: drink na ho to 1.5L drink offer karein">' +
    '<label>Shop ki baatein (har line alag): halal, parking, extra cheese ka rate…</label><textarea id="faq">'+esc(D.faq.join("\\n"))+'</textarea></div>';
  document.getElementById("main").innerHTML = h;
}
function settingsInput(e){
  const t = e.target, bi = t.dataset.b; const b = bi !== undefined ? D.branches[Number(bi)] : null;
  if (t.dataset.day) {
    const k = t.dataset.day;
    if (t.dataset.hf === "closed") { b.hours[k] = t.checked ? null : { open: "12:00", close: "23:00" }; renderSettings(); }
    else { b.hours[k] = b.hours[k] || { open: "12:00", close: "23:00" }; b.hours[k][t.dataset.hf] = t.value; }
  } else if (t.dataset.a2 === "ruletype") {
    const ty = t.value;
    b.delivery.rule = ty === "flat" ? { type: "flat", fee: 100 } : ty === "slabs" ? { type: "slabs", slabs: [{ upToKm: 3, fee: 100 }, { upToKm: 6, fee: 150 }] } : ty === "per_km" ? { type: "per_km", baseFee: 80, perKm: 25, includedKm: 2 } : { type: "free" };
    renderSettings();
  } else if (t.dataset.r) b.delivery.rule[t.dataset.r] = t.value;
  else if (t.dataset.slab !== undefined) b.delivery.rule.slabs[Number(t.dataset.slab)][t.dataset.sf] = t.value;
  else if (t.dataset.d) b.delivery[t.dataset.d] = t.value;
  else if (t.dataset.bf === "pickup") b.pickup = t.checked;
  else if (t.dataset.bf) b[t.dataset.bf] = t.value;
  else if (t.id === "cod") D.payment.cod = t.checked;
  else if (t.id === "online") D.payment.online = t.value;
  else if (t.id === "upsell") D.upsell = t.value;
  else if (t.id === "faq") D.faq = t.value.split("\\n");
  setDirty(true);
}
function settingsClick(e){
  const btn = e.target.closest("button[data-a]"); if (!btn) return;
  const b = D.branches[Number(btn.dataset.b)];
  if (btn.dataset.a === "addslab") b.delivery.rule.slabs.push({ upToKm: "", fee: "" });
  else if (btn.dataset.a === "delslab") b.delivery.rule.slabs.splice(Number(btn.dataset.j), 1);
  else return;
  setDirty(true); renderSettings();
}

// ---------- Hisaab & history ----------
function renderMoney(){
  const r = (x, label) => '<div class="card"><h3>'+label+'</h3>' +
    '<div class="stat"><span>Orders</span><b>'+x.orders+'</b></div><div class="stat"><span>Sale</span><b>'+money(x.revenue)+'</b></div>' +
    '<div class="stat"><span>Average order</span><span>'+money(x.avgOrder)+'</span></div>' +
    (x.topItems.length ? '<div class="stat"><span>Top item</span><span>'+esc(x.topItems[0].name)+' × '+x.topItems[0].qty+'</span></div>' : "") + '</div>';
  let h = r(D.today, "Aaj") + r(D.week, "Pichle 7 din");
  h += '<h2>Aap ke bills</h2>' + (D.invoices.length ? D.invoices.map(i => '<div class="card"><div class="stat"><b>'+esc(i.month)+'</b><b>'+money(i.total)+'</b></div>' +
    i.lines.map(l => '<div class="stat muted"><span>'+esc(l.label)+'</span><span>'+money(l.amount)+'</span></div>').join("") + '<div class="muted">WhatsApp orders: '+i.orders+'</div></div>').join("") : '<div class="card muted">Abhi koi bill nahi.</div>');
  document.getElementById("main").innerHTML = h;
}
function renderHistory(){
  const when = t => new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const who = { owner: "Aap ne badla", admin: "Admin ne badla", undo: "Undo kiya" };
  document.getElementById("main").innerHTML = '<div class="card"><h3>Aakhri tabdeeli wapas karein</h3><div class="muted">Ghalti se kuch badal gaya? Undo se pichli halat wapas aa jayegi (Undo bhi wapas ho sakta hai).</div>' +
    '<div class="row" style="margin-top:10px"><button class="small" id="undo"'+(D.history.length ? "" : " disabled")+'>↩️ Undo</button><span></span></div></div>' +
    '<div class="card"><h3>Pichli versions</h3>' + (D.history.map(h => '<div class="stat"><span>'+when(h.at)+'</span><span class="muted">'+(who[h.by] || h.by)+'</span></div>').join("") || '<div class="muted">Abhi koi tabdeeli nahi hui.</div>') + '</div>';
}

function render(){
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
  ({ menu: renderMenu, settings: renderSettings, money: renderMoney, history: renderHistory })[tab]();
  setDirty(dirty);
}
const main = document.getElementById("main");
main.addEventListener("input", e => { if (tab === "menu") menuInput(e); else if (tab === "settings") settingsInput(e); });
main.addEventListener("change", e => { if (tab === "settings" && (e.target.dataset.hf === "closed" || e.target.dataset.a2)) return; if (e.target.type === "checkbox") { if (tab === "menu") menuInput(e); else settingsInput(e); } });
main.addEventListener("click", async e => {
  if (tab === "menu") menuClick(e);
  if (tab === "settings") settingsClick(e);
  if (e.target.id === "undo" && confirm("Aakhri tabdeeli wapas karni hai?")) {
    try { D = (await api("/api/undo", "POST", {})).data; dirty = false; msg("✅ Wapas ho gaya", true); render(); } catch (err) { msg("❌ " + err.message); }
  }
});
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]"); if (!b) return;
  if (dirty && !confirm("Save nahi kiya. Tabdeeliyan chhod deni hain?")) return;
  if (dirty) { dirty = false; load(); }
  tab = b.dataset.t; render();
});
document.getElementById("save").onclick = async () => {
  const btn = document.getElementById("save"); btn.disabled = true; msg("Save ho raha hai…", true);
  try {
    const r = tab === "menu"
      ? await api("/api/menu", "PUT", { menu: D.menu })
      : await api("/api/settings", "PUT", { branches: D.branches, payment: D.payment, faq: D.faq.filter(f => f.trim()), upsell: D.upsell });
    D = r.data; dirty = false; msg("✅ Save ho gaya. Bot ab naya use karega.", true); render();
  } catch (err) { msg("❌ " + err.message); btn.disabled = false; }
};
window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
async function load(){ try { D = await api("/api/data"); render(); } catch (e) { document.getElementById("main").innerHTML = '<div class="card">Link sahi nahi ya expire: ' + esc(e.message) + '</div>'; } }
load();
</script>
</body>
</html>`;
}
