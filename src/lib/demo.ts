import type { Architecture, Discovery, Rollout } from "./plan-types";

/** Offline answers used when no ANTHROPIC_API_KEY is set. */
const KB: { k: string[]; a: string }[] = [
  { k: ["project", "built", "deploy", "work", "case", "example", "agent"], a: "Tahir has six AI agents live, each with a demo you can try: Relay (customer support in four languages), Leadline (speed-to-lead sales), Gatekeeper (an MCP security gateway, 40/40 attacks stopped), Ledger (accounts payable controls, 30/30 correct), Compass (a permission-aware knowledge assistant) and Verity (fair CV screening, reviewed by a privacy expert). Open the Live projects section for the links." },
  { k: ["forward", "fde", "deployed", "embed"], a: "As a Forward Deployed Engineer, Tahir embeds with the customer team, maps the real workflow, ships a working agent slice inside their tools by week two, and stays through rollout until the metric moves. The Playbook section shows the week-by-week approach." },
  { k: ["stack", "framework", "tech", "tool", "python", "typescript", "langgraph", "crewai", "mcp"], a: "His core stack: Claude Agent SDK, OpenAI Agents SDK, LangGraph and CrewAI for agents; Model Context Protocol for tool access; pgvector, Pinecone or Qdrant for RAG; Temporal and n8n for automation; Python, TypeScript, FastAPI and Next.js; Langfuse and LangSmith for evals and tracing; Docker, Kubernetes and Terraform on AWS, Azure or GCP." },
  { k: ["remote", "available", "hire", "open", "role", "job", "relocat", "time"], a: "Yes. Tahir is based in Islamabad, Pakistan (UTC+5) and open to remote Forward Deployed Engineer and AI engineering roles. He overlaps comfortably with Gulf and European hours and covers US mornings. The Contact section has his details." },
  { k: ["safe", "guardrail", "eval", "hallucin", "trust", "monitor", "risk"], a: "Every agent ships with an eval set built from real historical cases, guardrails for PII and policy, scoped tool permissions, tracing on every step and human approval for high-impact actions. Cost and latency budgets are agreed before rollout." },
  { k: ["experience", "background", "year", "career"], a: "Since 2024 Tahir has run his own company, Nexora, building AI agents and automation for businesses, and has freelanced for clients in the US, UAE and other markets. He trained in Agentic AI, AI agents, Digital FTE and full-stack development at GIAIC and PIAIC. He speaks English, Arabic and Urdu." },
  { k: ["contact", "email", "reach", "call", "linkedin"], a: "Email muhammadtahirhasni@gmail.com or message him on WhatsApp at +92 312 9114002. LinkedIn, GitHub and his résumé are in the Contact section." },
  { k: ["nexora", "company", "founder", "agency"], a: "Nexora is Tahir's company, founded in 2024 in Islamabad. It designs, builds and deploys AI agents and automation for businesses, from scoping to production." },
  { k: ["language", "arabic", "urdu", "english", "speak"], a: "Tahir speaks English, Arabic and Urdu, and his agents work in all three, plus Roman Urdu." },
  { k: ["review", "feedback", "recommend", "testimonial"], a: "Razan N. Alomrani, a cybersecurity and data governance researcher, reviewed Verity's privacy controls and sent 10 recommendations. All 10 were implemented in Verity v1.2. See the Reviews section." },
  { k: ["certif", "giaic", "piaic", "training", "course"], a: "Tahir trained at GIAIC and PIAIC in Agentic AI development, AI agents, Digital FTE and full-stack development. His Anthropic (Claude) certifications are in progress." },
  { k: ["hello", "hi", "hey", "salam", "assalam"], a: "Hi! I'm Tahir's AI twin. Ask me about his deployments, how he works as a Forward Deployed Engineer, his stack or his availability." },
];

export function demoTwinAnswer(q: string): string {
  const s = q.toLowerCase();
  let best: (typeof KB)[number] | null = null;
  let score = 0;
  for (const item of KB) {
    const sc = item.k.reduce((n, w) => (s.includes(w) ? n + w.length : n), 0);
    if (sc > score) { score = sc; best = item; }
  }
  return (best?.a ?? "I don't have that detail in my notes. Tahir can answer it directly through the Contact section. You can also ask me about his deployments, stack or availability.") +
    "\n\n(Demo mode: connect a Claude API key for live answers.)";
}

export function demoPlan(company: string): { discovery: Discovery; architecture: Architecture; rollout: Rollout } {
  const c = company || "your company";
  return {
    discovery: {
      summary: `${c} handles a high volume of repetitive requests by hand. Most of the work follows a few patterns that can be automated safely, while a small share needs human judgment.`,
      north_star_metric: "Median time from request to resolution",
      pain_points: [
        { title: "Manual triage", detail: "Every request is read and routed by a person before any work starts." },
        { title: "Context hunting", detail: "Staff switch between three or four systems to find the data needed to respond." },
        { title: "Slow follow-up", detail: "Simple requests wait in the same queue as complex ones." },
      ],
      constraints: ["Customer data must stay in the existing CRM", "High-value actions need human approval"],
    },
    architecture: {
      agents: [
        { id: "intake", name: "Intake agent", role: "Classifies and prioritises each request", tools: ["Inbox", "Classifier"] },
        { id: "research", name: "Context agent", role: "Gathers records and history for the case", tools: ["CRM via MCP", "Knowledge base"] },
        { id: "resolver", name: "Resolver agent", role: "Drafts or executes the resolution within policy", tools: ["Policy RAG", "Action API"] },
        { id: "qa", name: "QA guard", role: "Checks accuracy, tone and policy before anything is sent", tools: ["Eval rubric"] },
      ],
      flow: [
        { from: "intake", to: "research" },
        { from: "research", to: "resolver" },
        { from: "resolver", to: "qa" },
      ],
      human_checkpoints: ["Refunds or credits above the policy limit", "Low-confidence classifications"],
      integrations: ["Email / helpdesk", "CRM", "Knowledge base", "Slack alerts"],
    },
    rollout: {
      phases: [
        { when: "Week 0", title: "Embed", deliverable: "Process map, 300-case eval set, agreed success metric" },
        { when: "Week 2", title: "First slice", deliverable: "Intake and context agents live with human review" },
        { when: "Week 4", title: "Automate", deliverable: "Resolver live for the top three request types" },
        { when: "Week 6", title: "Hand over", deliverable: "Dashboards, alerts and runbook owned by the team" },
      ],
      impact_estimates: [
        { value: "55–70%", label: "requests resolved without manual work" },
        { value: "−80%", label: "time to first response" },
        { value: "2–3 FTE", label: "hours redeployed per month" },
      ],
      risks: [
        { risk: "Edge cases not in the eval set", mitigation: "Weekly review of escalations feeds new eval cases" },
        { risk: "Integration access delays", mitigation: "Start with read-only MCP access and widen scope after review" },
      ],
    },
  };
}
