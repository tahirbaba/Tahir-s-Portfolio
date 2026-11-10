// Single-file HTML for the public menu page.

import type { menuData } from "./routes.js";

type MenuData = ReturnType<typeof menuData>;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** JSON that is safe to put inside a <script> tag. */
function scriptJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029");
}

export function menuPage(data: MenuData): string {
  const title = escapeHtml(data.name);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} · Menu</title>
<meta name="description" content="${title} menu: order on WhatsApp">
<style>
  :root { --bg:#faf7f2; --card:#fff; --ink:#22201c; --muted:#77716a; --line:#ebe5dc; --brand:#c2410c; --brand-ink:#fff; --ok:#15803d; --wa:#1f9d55; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#161412; --card:#211e1b; --ink:#f3efe9; --muted:#a8a097; --line:#36312b; --brand:#f97316; --brand-ink:#1b0f05; }
  }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { margin:0; font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); padding-bottom:96px; }
  header { padding:20px 16px 8px; max-width:760px; margin:0 auto; }
  h1 { margin:0 0 4px; font-size:24px; }
  .sub { color:var(--muted); font-size:14px; }
  .banner { margin:10px 0 0; padding:10px 12px; border-radius:10px; font-size:14px; background:var(--card); border:1px solid var(--line); }
  .banner.warn { border-color:var(--brand); }
  nav { position:sticky; top:0; z-index:5; background:var(--bg); border-bottom:1px solid var(--line); }
  nav .in { display:flex; gap:8px; overflow-x:auto; padding:10px 16px; max-width:760px; margin:0 auto; scrollbar-width:none; }
  nav a { flex:none; text-decoration:none; color:var(--ink); border:1px solid var(--line); background:var(--card); border-radius:999px; padding:6px 14px; font-size:14px; }
  main { max-width:760px; margin:0 auto; padding:0 16px; }
  h2 { font-size:18px; margin:22px 0 10px; scroll-margin-top:60px; }
  .item { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:12px 14px; margin-bottom:10px; display:flex; gap:12px; align-items:center; }
  .item.off { opacity:.5; }
  .info { flex:1; min-width:0; }
  .nm { font-weight:600; }
  .ds { color:var(--muted); font-size:13px; }
  .pr { font-weight:600; margin-top:2px; }
  select { margin-top:6px; font:inherit; font-size:14px; padding:6px 8px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--ink); max-width:100%; }
  .add { flex:none; min-width:44px; height:44px; border-radius:12px; border:0; background:var(--brand); color:var(--brand-ink); font-size:22px; font-weight:700; }
  .add:disabled { background:var(--line); color:var(--muted); font-size:13px; }
  .qty { display:flex; align-items:center; gap:8px; flex:none; }
  .qty button { width:34px; height:34px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); font-size:18px; }
  .bar { position:fixed; left:0; right:0; bottom:0; padding:12px 16px calc(12px + env(safe-area-inset-bottom)); background:var(--card); border-top:1px solid var(--line); z-index:10; }
  .bar button { width:100%; max-width:728px; display:block; margin:0 auto; min-height:52px; border:0; border-radius:14px; background:var(--wa); color:#fff; font-size:17px; font-weight:700; }
  .bar button:disabled { background:var(--line); color:var(--muted); }
  dialog { border:0; padding:0; width:100%; max-width:560px; border-radius:18px 18px 0 0; margin:auto auto 0; background:var(--card); color:var(--ink); max-height:92vh; }
  dialog::backdrop { background:rgba(0,0,0,.45); }
  .sheet { padding:18px 16px calc(18px + env(safe-area-inset-bottom)); overflow-y:auto; max-height:92vh; }
  .sheet h3 { margin:0 0 10px; font-size:19px; }
  .line { display:flex; justify-content:space-between; gap:10px; align-items:center; padding:8px 0; border-bottom:1px solid var(--line); }
  .total { display:flex; justify-content:space-between; font-weight:700; margin:12px 0 4px; }
  label.f { display:block; font-size:14px; font-weight:600; margin:14px 0 6px; }
  .seg { display:flex; gap:8px; }
  .seg label { flex:1; border:1px solid var(--line); border-radius:10px; padding:10px; text-align:center; font-size:15px; }
  .seg input { display:none; }
  .seg label:has(input:checked) { border-color:var(--brand); outline:2px solid var(--brand); }
  input[type=text], textarea { width:100%; font:inherit; padding:10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); }
  .hint { color:var(--muted); font-size:13px; margin-top:6px; }
  .actions { display:flex; gap:8px; margin-top:16px; }
  .actions button { flex:1; min-height:50px; border-radius:12px; border:0; font-size:16px; font-weight:700; }
  .send { background:var(--wa); color:#fff; } .close { background:var(--line); color:var(--ink); flex:0 0 30% !important; }
  .err { color:#dc2626; font-size:14px; margin-top:8px; min-height:1em; }
</style>
</head>
<body>
<header>
  <h1>${title}</h1>
  <div class="sub" id="sub"></div>
  <div id="banners"></div>
</header>
<nav><div class="in" id="cats"></div></nav>
<main id="menu"></main>
<div class="bar"><button id="open" disabled>Cart khaali hai</button></div>

<dialog id="dlg"><div class="sheet">
  <h3 id="t-cart">Aap ka order</h3>
  <div id="lines"></div>
  <div class="total"><span>Subtotal</span><span id="sum"></span></div>
  <div class="hint" id="t-fee">Delivery charges WhatsApp pe location ke baad bataye jayenge.</div>
  <label class="f" id="t-how">Delivery ya pickup?</label>
  <div class="seg" id="ful"></div>
  <label class="f" for="name" id="t-name">Aap ka naam</label>
  <input type="text" id="name" maxlength="60" autocomplete="name">
  <label class="f" id="t-pay">Payment</label>
  <div class="seg" id="pay"></div>
  <label class="f" for="note" id="t-note">Koi khaas baat? (optional)</label>
  <textarea id="note" rows="2" maxlength="300" placeholder="Jaise: spicy kam, extra sauce"></textarea>
  <div class="err" id="err"></div>
  <div class="actions"><button class="close" id="close">Wapas</button><button class="send" id="send">WhatsApp pe bhejein</button></div>
  <div class="hint" id="t-after">WhatsApp khulega: bas "Send" dabayein. Delivery ke liye wahan location pin bhi bhejna hoga.</div>
</div></dialog>

<script>
const D = ${scriptJson(data)};
const UR = D.lang === "roman_urdu";
const T = UR ? {} : {
  "open-empty":"Cart is empty", cart:"Your order", fee:"Delivery charges are shared on WhatsApp after your location.",
  how:"Delivery or pickup?", name:"Your name", pay:"Payment", note:"Anything special? (optional)",
  back:"Back", send:"Send on WhatsApp", after:"WhatsApp will open: just tap Send. For delivery, share your location pin there.",
  add:"Add", soldout:"Sold out", closed:"Closed now", paused:"The shop is not taking new orders right now. Please try a bit later.",
};
const tr = (k, ur) => T[k] || ur;
const money = n => D.currency + " " + Number(n).toLocaleString("en-US");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const key = (id, v) => id + "|" + (v || "");
let cart = [];
try { cart = JSON.parse(localStorage.getItem("cart:" + location.pathname) || "[]"); } catch {}
const byId = Object.fromEntries(D.items.map(i => [i.id, i]));
cart = cart.filter(l => byId[l.id] && byId[l.id].available);

function save(){ try { localStorage.setItem("cart:" + location.pathname, JSON.stringify(cart)); } catch {} }
function unit(l){ const i = byId[l.id]; return i.variants ? (i.variants.find(v => v.name === l.variant) || {}).price || 0 : i.price; }
function total(){ return cart.reduce((s,l) => s + unit(l) * l.qty, 0); }
function count(){ return cart.reduce((s,l) => s + l.qty, 0); }

// header
const anyOpen = D.branches.some(b => b.open);
document.getElementById("sub").textContent = D.branches.map(b => b.name).join(" · ");
let banners = "";
if (D.paused) banners += '<div class="banner warn">⏸️ ' + esc(tr("paused","Abhi naye orders band hain. Thori der baad try karein.")) + '</div>';
else if (!anyOpen) banners += '<div class="banner warn">🌙 ' + esc(tr("closed","Abhi band hai")) + (D.preorder ? (UR ? " — pre-order WhatsApp pe kar sakte hain." : " — you can pre-order on WhatsApp.") : "") + '<div class="hint">' + D.branches.map(b => esc(b.name) + ": " + esc(b.hours)).join("<br>") + '</div></div>';
const fa = D.branches.find(b => b.freeAbove);
if (fa) banners += '<div class="banner">🛵 ' + (UR ? "Free delivery " + money(fa.freeAbove) + " se upar" : "Free delivery above " + money(fa.freeAbove)) + '</div>';
document.getElementById("banners").innerHTML = banners;

// menu
const cats = [...new Set(D.items.map(i => i.category))];
document.getElementById("cats").innerHTML = cats.map((c,i) => '<a href="#c'+i+'">'+esc(c)+'</a>').join("");
document.getElementById("menu").innerHTML = cats.map((c,ci) =>
  '<h2 id="c'+ci+'">'+esc(c)+'</h2>' + D.items.filter(i => i.category === c).map(i => {
    const price = i.variants ? i.variants.map(v => esc(v.name)+" "+money(v.price)).join(" · ") : money(i.price);
    const sel = i.variants && i.available ? '<select data-v="'+esc(i.id)+'">' + i.variants.map(v => '<option value="'+esc(v.name)+'">'+esc(v.name)+' — '+money(v.price)+'</option>').join("") + '</select>' : "";
    return '<div class="item '+(i.available?"":"off")+'"><div class="info"><div class="nm">'+esc(i.name)+'</div>' +
      (i.description ? '<div class="ds">'+esc(i.description)+'</div>' : "") +
      '<div class="pr">'+price+'</div>'+sel+'</div>' +
      (i.available ? '<button class="add" data-add="'+esc(i.id)+'" aria-label="'+esc(tr("add","Add"))+' '+esc(i.name)+'">+</button>'
                   : '<button class="add" disabled>'+esc(tr("soldout","Khatam"))+'</button>') + '</div>';
  }).join("")).join("");

document.getElementById("menu").addEventListener("click", e => {
  const b = e.target.closest("button[data-add]"); if (!b) return;
  const id = b.dataset.add, s = document.querySelector('select[data-v="'+CSS.escape(id)+'"]');
  const variant = s ? s.value : null;
  const ex = cart.find(l => key(l.id,l.variant) === key(id,variant));
  if (ex) ex.qty = Math.min(50, ex.qty + 1); else cart.push({ id, variant, qty: 1 });
  save(); refresh();
  b.textContent = "✓"; setTimeout(() => b.textContent = "+", 600);
});

function refresh(){
  const btn = document.getElementById("open");
  btn.disabled = cart.length === 0 || D.paused;
  btn.textContent = cart.length ? (UR ? "Order dekhein · " : "View order · ") + count() + " · " + money(total()) : tr("open-empty","Cart khaali hai");
  document.getElementById("lines").innerHTML = cart.map((l,idx) => {
    const i = byId[l.id];
    return '<div class="line"><div><div>'+esc(i.name)+(l.variant?' ('+esc(l.variant)+')':'')+'</div><div class="ds">'+money(unit(l)*l.qty)+'</div></div>' +
      '<div class="qty"><button data-q="-1" data-i="'+idx+'" aria-label="minus">−</button><b>'+l.qty+'</b><button data-q="1" data-i="'+idx+'" aria-label="plus">+</button></div></div>';
  }).join("");
  document.getElementById("sum").textContent = money(total());
}

document.getElementById("lines").addEventListener("click", e => {
  const b = e.target.closest("button[data-q]"); if (!b) return;
  const l = cart[Number(b.dataset.i)]; l.qty += Number(b.dataset.q);
  if (l.qty <= 0) cart.splice(Number(b.dataset.i), 1);
  save(); refresh(); if (!cart.length) dlg.close();
});

// order sheet
const dlg = document.getElementById("dlg");
const canDeliver = true, canPickup = D.branches.some(b => b.pickup);
document.getElementById("ful").innerHTML =
  '<label><input type="radio" name="ful" value="delivery" checked>🛵 Delivery</label>' +
  (canPickup ? '<label><input type="radio" name="ful" value="pickup">🏪 Pickup</label>' : "");
document.getElementById("pay").innerHTML =
  (D.payment.cod ? '<label><input type="radio" name="pay" value="cod" checked>💵 Cash</label>' : "") +
  (D.payment.online ? '<label><input type="radio" name="pay" value="online" '+(D.payment.cod?"":"checked")+'>💳 Online</label>' : "");
for (const [id,k] of [["t-cart","cart"],["t-fee","fee"],["t-how","how"],["t-name","name"],["t-pay","pay"],["t-note","note"],["close","back"],["send","send"],["t-after","after"]])
  if (T[k]) document.getElementById(id).textContent = T[k];
try { document.getElementById("name").value = localStorage.getItem("name") || ""; } catch {}

document.getElementById("open").onclick = () => { refresh(); dlg.showModal(); };
document.getElementById("close").onclick = () => dlg.close();
document.getElementById("send").onclick = async () => {
  const err = document.getElementById("err"); err.textContent = "";
  const name = document.getElementById("name").value.trim();
  try { localStorage.setItem("name", name); } catch {}
  const btn = document.getElementById("send"); btn.disabled = true;
  try {
    const res = await fetch(location.pathname.replace(/\\/$/, "") + "/cart", { method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({ items: cart, fulfilment: (document.querySelector('input[name=ful]:checked')||{}).value,
        payment: (document.querySelector('input[name=pay]:checked')||{}).value, name, note: document.getElementById("note").value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    cart = []; save(); refresh(); dlg.close();
    location.href = data.waUrl;
  } catch (e) { err.textContent = e.message; }
  btn.disabled = false;
};
refresh();
</script>
</body>
</html>`;
}
