(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme toggle ---------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var saved = store("theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  var themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    var next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store("theme", next);
  });

  /* ---------- nav border on scroll ---------- */
  var nav = document.querySelector(".nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- workflow canvas animation ---------- */
  var nodes = document.querySelectorAll(".node");
  var edges = document.querySelectorAll(".edges path");
  var logLine = document.getElementById("logLine");
  var logs = [
    "→ trigger: new inbound lead from website form · Acme Logistics",
    "→ orchestrator: lead scored 87/100, fanning out to 3 specialist agents",
    "→ research: 14 sources read · knowledge: 3 matching case studies · tools: CRM record created",
    "✔ guardrails: draft passed tone, PII and policy checks · sent to rep for approval"
  ];
  var stage = 0;
  function step() {
    nodes.forEach(function (n) { n.classList.toggle("on", Number(n.dataset.n) === stage); });
    edges.forEach(function (e) { e.classList.toggle("on", Number(e.dataset.e) === stage); });
    if (logLine) {
      logLine.style.opacity = 0;
      setTimeout(function () { logLine.textContent = logs[stage]; logLine.style.opacity = 1; }, 200);
    }
    stage = (stage + 1) % 4;
  }
  if (nodes.length) { step(); if (!reduce) setInterval(step, 2200); }

  /* ---------- reveal on scroll (content stays visible without JS) ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var items = document.querySelectorAll(".b, .svc, .case, .process li, .timeline li, .stk, .certs li");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.classList.add("rv");
      if (r.top > window.innerHeight) { el.classList.add("pre"); io.observe(el); }
    });
  }

  /* ---------- copy email ---------- */
  var copyBtn = document.getElementById("copyEmail");
  var emailText = document.getElementById("emailText");
  if (copyBtn && emailText) copyBtn.addEventListener("click", function () {
    function selectIt() { var r = document.createRange(); r.selectNodeContents(emailText); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try {
      navigator.clipboard.writeText(emailText.textContent.trim()).then(function () {
        copyBtn.textContent = "Copied"; setTimeout(function () { copyBtn.textContent = "Copy"; }, 1600);
      }).catch(selectIt);
    } catch (e) { selectIt(); }
  });

  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- AI twin (rule-based, runs locally; swap answer() for an LLM call later) ---------- */
  var KB = [
    { k: ["project", "built", "build", "agents has", "work", "case", "portfolio", "example"],
      a: "Highlights: an autonomous support desk that resolves 71% of tickets end to end, an invoice-to-ERP agent running 92% hands-free, a lead research crew that tripled qualified meetings, a CV screening agent, a 24/7 voice booking agent and an open MCP server toolkit. Scroll to Selected work for details." },
    { k: ["framework", "stack", "tech", "tool", "langgraph", "crewai", "sdk", "language", "python"],
      a: "Core stack: OpenAI Agents SDK, Claude Agent SDK, LangGraph, CrewAI and AutoGen for agents; MCP for tool access; LlamaIndex with pgvector, Pinecone or Qdrant for RAG; n8n and Temporal for automation; Python, TypeScript and FastAPI; Langfuse and LangSmith for tracing; Docker and Kubernetes on AWS, Azure or GCP." },
    { k: ["remote", "available", "availability", "hire", "open to", "job", "role", "relocat", "time zone", "timezone"],
      a: "Yes. Tahir is based in Karachi, Pakistan (UTC+5) and open to remote full-time or contract roles. He overlaps well with EU mornings and US East afternoons. Use the Contact section below to reach him." },
    { k: ["safe", "safety", "guardrail", "eval", "hallucinat", "trust", "risk", "monitor", "observab"],
      a: "Every agent ships with an evaluation set built from real historical cases, guardrails for PII, tone and policy, scoped tool permissions, tracing on every step and a human approval point for high-impact actions. Accuracy, cost and latency thresholds are agreed before rollout." },
    { k: ["mcp", "model context", "protocol", "integrat", "api", "crm", "erp"],
      a: "Tahir builds custom MCP servers and tool layers that give agents permissioned access to databases, CRMs, ERPs, Google Workspace and internal APIs, with OAuth, scopes and full audit logs." },
    { k: ["rag", "knowledge", "document", "retriev", "vector", "search"],
      a: "His RAG systems answer from company documents with citations, role-based access control, hybrid search and freshness checks, evaluated with Ragas and DeepEval." },
    { k: ["voice", "call", "phone", "whatsapp", "chatbot"],
      a: "He builds voice and chat agents on OpenAI Realtime, Vapi, Retell, Twilio and the WhatsApp Cloud API. One real-estate voice agent books viewings 24/7 and raised bookings by 38%." },
    { k: ["experience", "year", "background", "career", "previous"],
      a: "He started as a full-stack Python developer, moved into AI automation in 2023 delivering for 15+ SMB clients, and since 2024 has worked as an independent AI Agents Architect for clients in the US, UK, GCC and Pakistan." },
    { k: ["contact", "email", "reach", "linkedin", "call", "meeting"],
      a: "The quickest way is email or a 30-minute call. Both are in the Contact section at the bottom of this page." },
    { k: ["rate", "price", "cost", "charge", "salary", "budget"],
      a: "That depends on scope and engagement type. Share a short description of your process or role in an email and Tahir will reply with a proposal, usually within a day." },
    { k: ["certif", "course", "education", "degree", "learn"],
      a: "Certifications include Agentic & Robotic AI Engineering (Panaversity / PIAIC), LangGraph from LangChain Academy, the Hugging Face AI Agents course, and Azure AI Engineer. See the Certifications section." },
    { k: ["hello", "hi", "hey", "salam", "assalam"],
      a: "Hello! Ask me about Tahir's agent projects, his stack, how he keeps agents safe, or whether he's available." }
  ];
  function answer(q) {
    var s = q.toLowerCase(), best = null, score = 0;
    KB.forEach(function (item) {
      var sc = 0; item.k.forEach(function (w) { if (s.indexOf(w) > -1) sc += w.length; });
      if (sc > score) { score = sc; best = item; }
    });
    return best ? best.a : "I don't have that in my notes yet. Tahir can answer it directly: use the Contact section below, or ask me about his projects, stack, safety approach or availability.";
  }
  var log = document.getElementById("chatLog"), form = document.getElementById("chatForm"),
      input = document.getElementById("chatInput"), sugg = document.getElementById("chatSugg");
  function add(text, who) {
    var d = document.createElement("div"); d.className = "msg " + who; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function ask(q) {
    q = (q || "").trim(); if (!q) return;
    add(q, "me");
    var t = add("typing…", "bot typing");
    setTimeout(function () { t.classList.remove("typing"); t.textContent = answer(q); log.scrollTop = log.scrollHeight; }, reduce ? 0 : 650);
  }
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });
  if (sugg) sugg.addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
})();
