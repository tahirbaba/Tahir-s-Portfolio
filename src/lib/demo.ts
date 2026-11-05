import type { Architecture, Discovery, Rollout } from "./plan-types";

/** Offline answers used when no ANTHROPIC_API_KEY is set. */
const KB: { k: string[]; a: string }[] = [
  { k: ["project", "built", "deploy", "work", "case", "example", "agent"], a: "Tahir's recent deployments include a five-agent support desk that resolves 71% of tickets end to end, an invoice-to-ERP agent running 92% hands-free, a sales research crew that tripled qualified meetings, a bilingual voice agent for a real-estate brokerage and a CV screening agent. Open the Deployments section for the full reports." },
  { k: ["forward", "fde", "deployed", "embed"], a: "As a Forward Deployed Engineer, Tahir embeds with the customer team, maps the real workflow, ships a working agent slice inside their tools by week two, and stays through rollout until the metric moves. The Playbook section shows the week-by-week approach." },
  { k: ["stack", "framework", "tech", "tool", "language", "python", "typescript", "langgraph", "crewai", "mcp"], a: "His core stack: Claude Agent SDK, OpenAI Agents SDK, LangGraph and CrewAI for agents; Model Context Protocol for tool access; pgvector, Pinecone or Qdrant for RAG; Temporal and n8n for automation; Python, TypeScript, FastAPI and Next.js; Langfuse and LangSmith for evals and tracing; Docker, Kubernetes and Terraform on AWS, Azure or GCP." },
  { k: ["remote", "available", "hire", "open", "role", "job", "relocat", "time"], a: "Yes. Tahir is based in Karachi (UTC+5) and open to remote Forward Deployed Engineer and AI engineering roles. He overlaps comfortably with Gulf and European hours and covers US mornings. The Contact section has his details." },
  { k: ["safe", "guardrail", "eval", "hallucin", "trust", "monitor", "risk"], a: "Every agent ships with an eval set built from real historical cases, guardrails for PII and policy, scoped tool permissions, tracing on every step and human approval for high-impact actions. Cost and latency budgets are agreed before rollout." },
  { k: ["experience", "background", "year", "career"], a: "He started as a full-stack Python developer in 2021, moved into AI automation in 2023 delivering for 15+ SMB clients, and since 2024 has worked as an independent Forward Deployed Engineer and AI Agents Architect for clients in the US, UK, GCC and Pakistan." },
  { k: ["contact", "email", "reach", "call", "linkedin"], a: "The fastest route is email or a short call. Both are in the Contact section at the bottom of the page." },
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
