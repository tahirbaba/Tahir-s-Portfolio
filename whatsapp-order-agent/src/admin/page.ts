// Single-file HTML for the admin panel.

export function adminPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin · WhatsApp Order Agent</title>
<style>
  :root { --bg:#f5f5f3; --card:#fff; --ink:#1c1c1a; --muted:#6c6c66; --line:#e2e2dc; --info:#1d4ed8; --ok:#15803d; --bad:#b91c1c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#131312; --card:#1e1e1c; --ink:#f2f2ee; --muted:#a2a29b; --line:#34342f; --info:#60a5fa; --ok:#4ade80; --bad:#f87171; } }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); }
  header { padding:14px 16px; background:var(--card); border-bottom:1px solid var(--line); display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  header h1 { margin:0; font-size:18px; flex:1; }
  .wrap { max-width:1100px; margin:0 auto; padding:16px; display:grid; gap:16px; grid-template-columns:minmax(0,1fr); }
  @media (min-width: 900px) { .wrap { grid-template-columns: 340px minmax(0,1fr); } }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px; }
  .v { padding:10px; border:1px solid var(--line); border-radius:10px; margin-bottom:8px; cursor:pointer; }
  .v.on { outline:2px solid var(--info); }
  .v b { display:block; }
  .tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
  .tag { font-size:12px; padding:1px 7px; border-radius:6px; background:var(--line); }
  .tag.ok { background:var(--ok); color:#fff; } .tag.bad { background:var(--bad); color:#fff; }
  .muted { color:var(--muted); font-size:13px; }
  textarea { width:100%; min-height:62vh; font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; padding:10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--ink); tab-size:2; }
  button { min-height:40px; border:0; border-radius:8px; padding:8px 14px; font-size:15px; font-weight:600; background:var(--info); color:#fff; }
  button.ghost { background:var(--line); color:var(--ink); } button.ok { background:var(--ok); }
  .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:10px 0; }
  input { min-height:40px; border:1px solid var(--line); border-radius:8px; padding:6px 10px; font-size:15px; background:var(--bg); color:var(--ink); }
  .msg { white-space:pre-wrap; font-size:14px; padding:10px; border-radius:8px; margin-top:8px; display:none; }
  .msg.err { display:block; background:color-mix(in srgb, var(--bad) 14%, transparent); }
  .msg.good { display:block; background:color-mix(in srgb, var(--ok) 14%, transparent); }
  a { color:var(--info); }
  h2 { font-size:16px; margin:0 0 10px; }
</style>
</head>
<body>
<header><h1>🛠️ Admin: Vendors</h1><span class="muted">Save karte hi naya menu/settings live ho jaate hain.</span></header>
<div class="wrap">
  <div>
    <div class="card">
      <h2>Vendors</h2>
      <div id="list" class="muted">Loading…</div>
      <div class="row"><input id="newslug" placeholder="naya-vendor-slug" pattern="[a-z0-9-]+" aria-label="New vendor slug"><button class="ghost" id="new">+ Naya vendor</button></div>
      <div class="muted">Slug: chhote harf, digits aur "-" (jaise karachi-broast).</div>
    </div>
  </div>
  <div class="card">
    <h2 id="title">Vendor chunein</h2>
    <div id="links" class="muted"></div>
    <textarea id="editor" spellcheck="false" placeholder="Vendor ki JSON yahan aayegi" aria-label="Vendor JSON"></textarea>
    <div class="row"><button class="ghost" id="validate">Check karo</button><button class="ok" id="save">Save karo</button></div>
    <div id="msg" class="msg"></div>
    <div class="muted">Fields ki tafseel: docs/ADD-VENDOR.md. Tokens aur keys (.env) yahan nahi daalte; sirf un ke naam.</div>
  </div>
</div>
<script>
const KEY = new URLSearchParams(location.search).get("key") || "";
let current = null;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
async function api(path, method = "GET", body){
  const res = await fetch(path, { method, headers: { "x-admin-key": KEY, ...(body ? {"content-type":"application/json"} : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function msg(text, good){ const m = document.getElementById("msg"); m.textContent = text; m.className = "msg " + (good ? "good" : "err"); }
function tag(ok, yes, no){ return '<span class="tag '+(ok?"ok":"bad")+'">'+(ok?yes:no)+'</span>'; }

async function loadList(){
  const { vendors } = await api("/admin/api/vendors");
  document.getElementById("list").innerHTML = vendors.map(v =>
    '<div class="v '+(v.slug===current?"on":"")+'" data-slug="'+esc(v.slug)+'"><b>'+esc(v.name)+'</b><span class="muted">'+esc(v.slug)+' · '+v.branches+' branch · '+v.menuItems+' items</span>' +
    '<div class="tags">'+tag(v.phoneReady,"Number ✓","Number ID missing")+tag(v.tokenSet,"Token ✓",esc(v.tokenEnv)+" missing")+tag(v.opsKeySet,"Kitchen key ✓",esc(v.opsKeyEnv)+" missing")+tag(v.owners>0,"Owner ✓","No owner")+'</div></div>'
  ).join("") || "Koi vendor nahi.";
}

async function open(slug){
  current = slug;
  const d = await api("/admin/api/vendors/" + encodeURIComponent(slug));
  document.getElementById("editor").value = d.json;
  document.getElementById("title").textContent = (d.exists ? "Edit: " : "Naya vendor: ") + slug;
  document.getElementById("msg").className = "msg";
  await loadList();
  showLinks();
}

async function showLinks(){
  try {
    const { vendors } = await api("/admin/api/vendors");
    const v = vendors.find(x => x.slug === current);
    document.getElementById("links").innerHTML = v ? 'Kitchen: <code>'+esc(v.opsUrl)+'</code>' + (v.menuUrl ? ' · Menu page: <a href="'+esc(v.menuUrl)+'" target="_blank" rel="noopener">'+esc(v.menuUrl)+'</a>' : ' · Menu page: displayNumber add karein') + ' · Prompt ~'+v.promptTokens+' tokens' : "Abhi save nahi hua.";
  } catch {}
}

document.getElementById("list").addEventListener("click", e => { const v = e.target.closest("[data-slug]"); if (v) open(v.dataset.slug).catch(err => msg(err.message)); });
document.getElementById("new").onclick = () => {
  const s = document.getElementById("newslug").value.trim();
  if (!/^[a-z0-9-]+$/.test(s)) return msg("Slug sirf chhote harf, digits aur - ho sakta hai.");
  open(s).catch(err => msg(err.message));
};
document.getElementById("validate").onclick = async () => {
  if (!current) return msg("Pehle vendor chunein.");
  try { const r = await api("/admin/api/vendors/"+current+"/validate", "POST", { json: document.getElementById("editor").value }); msg("✅ Sab theek hai: " + r.summary.menuItems + " items, " + r.summary.branches + " branch.", true); }
  catch (e) { msg("❌ " + e.message); }
};
document.getElementById("save").onclick = async () => {
  if (!current) return msg("Pehle vendor chunein.");
  if (!confirm("Save karna hai? Ye foran live ho jayega.")) return;
  try { await api("/admin/api/vendors/"+current, "PUT", { json: document.getElementById("editor").value }); msg("✅ Save ho gaya aur live hai.", true); await loadList(); showLinks(); }
  catch (e) { msg("❌ " + e.message); }
};
loadList().catch(e => msg("Login masla: " + e.message));
</script>
</body>
</html>`;
}
