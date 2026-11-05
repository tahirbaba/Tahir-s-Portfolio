/**
 * Single source of truth for portfolio content.
 * The UI renders from this file and the AI twin answers from it.
 * Items marked `placeholder: true` (or commented PLACEHOLDER) are sample content to replace.
 */

export const profile = {
  name: "Muhammad Tahir Hasni",
  shortName: "Tahir Hasni",
  initials: "MTH",
  role: "Forward Deployed Engineer",
  secondaryRole: "AI Agents Architect",
  location: "Karachi, Pakistan",
  coords: "24.86° N, 67.01° E",
  timezone: "UTC+5",
  availability: "Open to remote FDE and AI engineering roles",
  // PLACEHOLDER contact details
  email: "tahir.hasni@example.com",
  linkedin: "https://www.linkedin.com/",
  github: "https://github.com/tahirbaba",
  calendar: "#contact",
  resume: "#",
  headline: "I ship AI agents into the real world.",
  intro:
    "Forward Deployed Engineer and AI Agents Architect. I embed with customer teams, find the workflow that is bleeding hours, and deploy agents that run inside their stack, measured, monitored and owned by them.",
  bio: [
    "I work where AI meets the messy reality of a business: legacy systems, unclear processes, impatient stakeholders and data nobody has cleaned. My job is to sit with the people who do the work, understand it better than the spec does, and turn it into agent systems that hold up in production.",
    "I design multi-agent architectures, write the integrations, build the evaluation harness and stay through rollout. I measure success the way the customer does: hours returned, tickets closed, revenue protected. Then I write down what we learned so the product team can make it repeatable.",
  ],
};

// PLACEHOLDER numbers: replace with real figures
export const metrics = [
  { value: 34, suffix: "+", label: "Agents in production" },
  { value: 21, suffix: "", label: "Customer deployments" },
  { value: 18, suffix: "k", label: "Hours returned / year" },
  { value: 98.4, suffix: "%", label: "Task success, monitored", decimals: 1 },
];

export const pillars = [
  {
    k: "Embed",
    title: "I start inside your team",
    body: "Shadow the operators, map the real process, read the tickets and the logs. The requirement is usually two steps away from what was written down.",
  },
  {
    k: "Ship",
    title: "Working agents in weeks",
    body: "A thin slice in production inside your tools by week two. Then iterate with real traffic, real edge cases and real users.",
  },
  {
    k: "Own",
    title: "Outcomes, not demos",
    body: "Evals, guardrails, tracing and cost controls from day one. I stay until the numbers move and your team can run it without me.",
  },
];

export type Deployment = {
  id: string;
  codename: string;
  title: string;
  client: string;
  sector: string;
  location: string;
  year: string;
  duration: string;
  mode: string;
  problem: string;
  shipped: string[];
  graph: string[];
  impact: { value: string; label: string }[];
  stack: string[];
  links: { label: string; href: string }[];
  placeholder?: boolean;
};

// PLACEHOLDER deployments: replace with real projects and links
export const deployments: Deployment[] = [
  {
    id: "dep-01",
    title: "Autonomous support desk",
    codename: "HELPDESK-01",
    client: "D2C e-commerce brand",
    sector: "Customer support",
    location: "Austin, US",
    year: "2025",
    duration: "7 weeks",
    mode: "Remote, embedded with CX team",
    problem:
      "11,000 tickets a month, a six-hour first response time and a support team drowning in refunds and 'where is my order' requests.",
    shipped: [
      "Five-agent support system: triage, order lookup, policy RAG, resolver and human review",
      "Refunds and replacements executed within policy limits, with every action logged",
      "Eval suite of 600 historical tickets gating every prompt and model change",
    ],
    graph: ["Triage", "Order lookup", "Policy RAG", "Resolver", "Human review"],
    impact: [
      { value: "71%", label: "tickets resolved end to end" },
      { value: "4 min", label: "median first response, from 6 h" },
      { value: "4.8/5", label: "CSAT on agent replies" },
    ],
    stack: ["LangGraph", "Claude", "pgvector", "Shopify API", "Zendesk", "Langfuse"],
    links: [{ label: "Case study", href: "#" }, { label: "Architecture", href: "#" }],
    placeholder: true,
  },
  {
    id: "dep-02",
    title: "Invoice-to-ERP agent",
    codename: "LEDGER-07",
    client: "Freight forwarder",
    sector: "Finance operations",
    location: "Dubai, UAE",
    year: "2025",
    duration: "5 weeks",
    mode: "On-site week one, then remote",
    problem:
      "Accounts payable keyed 1,300 invoices a month by hand from PDFs and email, with frequent PO mismatches and late-payment penalties.",
    shipped: [
      "Invoice agent that extracts, matches to purchase orders and validates totals",
      "Exception queue with reasons, so finance only reviews what needs judgment",
      "Direct posting to the ERP through a permissioned MCP server",
    ],
    graph: ["Extract", "Match PO", "Validate", "Post to ERP"],
    impact: [
      { value: "92%", label: "invoices processed hands-free" },
      { value: "−80%", label: "late-payment penalties" },
      { value: "3 FTE", label: "hours redeployed to analysis" },
    ],
    stack: ["OpenAI Agents SDK", "MCP", "FastAPI", "Odoo", "OCR", "Temporal"],
    links: [{ label: "Case study", href: "#" }],
    placeholder: true,
  },
  {
    id: "dep-03",
    title: "Lead research & outreach crew",
    codename: "PIPELINE-12",
    client: "B2B SaaS scale-up",
    sector: "Sales",
    location: "London, UK",
    year: "2025",
    duration: "4 weeks",
    mode: "Remote, embedded with RevOps",
    problem:
      "Reps spent 30 minutes researching each inbound lead and wrote generic first emails that rarely booked meetings.",
    shipped: [
      "Research crew that enriches each lead from the web, CRM and product usage",
      "Fit scoring against the ideal customer profile, with reasons",
      "Personalised first emails drafted for one-click rep approval in HubSpot",
    ],
    graph: ["Enrich", "Score fit", "Draft", "Rep approves"],
    impact: [
      { value: "3×", label: "qualified meetings booked" },
      { value: "25 min", label: "saved per lead" },
      { value: "0", label: "emails sent without approval" },
    ],
    stack: ["CrewAI", "Claude", "Tavily", "HubSpot", "n8n"],
    links: [{ label: "Case study", href: "#" }],
    placeholder: true,
  },
  {
    id: "dep-04",
    title: "Bilingual voice booking agent",
    codename: "VOICE-03",
    client: "Real estate brokerage",
    sector: "Voice agents",
    location: "Riyadh, KSA",
    year: "2024",
    duration: "6 weeks",
    mode: "Remote, bilingual rollout",
    problem:
      "Half of after-hours property calls went to voicemail and most of those buyers never called back.",
    shipped: [
      "Arabic and English voice agent that qualifies buyers and books viewings",
      "Calendar and CRM write-back with call summaries for agents",
      "Escalation to a human broker on high-intent or sensitive calls",
    ],
    graph: ["Speech", "Qualify", "Book viewing", "CRM log"],
    impact: [
      { value: "24/7", label: "call coverage" },
      { value: "+38%", label: "viewings booked" },
      { value: "92%", label: "calls handled without transfer" },
    ],
    stack: ["OpenAI Realtime", "Twilio", "Vapi", "Airtable", "Google Calendar"],
    links: [{ label: "Case study", href: "#" }],
    placeholder: true,
  },
  {
    id: "dep-05",
    title: "Explainable CV screening agent",
    codename: "TALENT-02",
    client: "Recruitment agency",
    sector: "HR & recruiting",
    location: "Karachi, PK",
    year: "2024",
    duration: "3 weeks",
    mode: "On-site",
    problem:
      "Recruiters screened 400 CVs per role by hand and candidates waited two weeks for a response.",
    shipped: [
      "Rubric-based screening agent that explains every score",
      "Bias checks and a human sign-off before any rejection",
      "Automatic interview scheduling for the shortlist",
    ],
    graph: ["Parse CV", "Rubric score", "Explain", "Schedule"],
    impact: [
      { value: "−80%", label: "screening time" },
      { value: "2 days", label: "candidate response, from 14" },
      { value: "100%", label: "decisions explained" },
    ],
    stack: ["Claude Agent SDK", "MCP", "Google Workspace", "PostgreSQL"],
    links: [{ label: "Case study", href: "#" }],
    placeholder: true,
  },
];

export const playbook = [
  { week: "Week 0", title: "Embed", body: "Interview operators, shadow the workflow, pull a sample of real cases and agree on the one metric that matters." },
  { week: "Week 1", title: "Architect", body: "Design the agent graph: roles, tools, memory, permissions and where a human approves. Build the eval set from history." },
  { week: "Week 2", title: "First slice live", body: "A narrow, working agent in production inside the customer's own tools, on real traffic with a human in the loop." },
  { week: "Weeks 3–5", title: "Harden and expand", body: "Close the edge cases the evals surface, add integrations, set cost and latency budgets, widen automation step by step." },
  { week: "Week 6+", title: "Hand over", body: "Dashboards, runbooks and alerts. The customer team owns it, and the lessons go back to the product as reusable patterns." },
];

export const stack: { group: string; items: string[] }[] = [
  { group: "Agent frameworks", items: ["Claude Agent SDK", "OpenAI Agents SDK", "LangGraph", "LangChain", "CrewAI", "AutoGen / AG2", "Google ADK", "Pydantic AI", "Vercel AI SDK"] },
  { group: "Models", items: ["Claude", "GPT", "Gemini", "Llama", "Mistral", "DeepSeek", "Ollama", "vLLM", "LoRA fine-tuning"] },
  { group: "Protocols", items: ["Model Context Protocol", "A2A", "Tool calling", "Structured outputs", "REST", "GraphQL", "Webhooks", "OAuth 2.1"] },
  { group: "RAG & data", items: ["LlamaIndex", "pgvector", "Pinecone", "Qdrant", "Weaviate", "PostgreSQL", "Redis", "Neo4j", "Supabase"] },
  { group: "Automation", items: ["n8n", "Temporal", "Celery", "Make", "Zapier", "Playwright", "Browser Use"] },
  { group: "Voice & channels", items: ["OpenAI Realtime", "Vapi", "Retell", "ElevenLabs", "Deepgram", "Twilio", "WhatsApp Cloud API"] },
  { group: "Evals & AgentOps", items: ["Langfuse", "LangSmith", "Arize Phoenix", "Ragas", "DeepEval", "OpenTelemetry", "Guardrails"] },
  { group: "Languages", items: ["Python", "TypeScript", "SQL", "Bash"] },
  { group: "App & backend", items: ["Next.js", "React", "FastAPI", "Node.js", "Tailwind CSS", "Prisma"] },
  { group: "Cloud & infra", items: ["AWS", "Azure AI Foundry", "Google Cloud", "Docker", "Kubernetes", "Dapr", "Kafka", "Terraform", "GitHub Actions", "Vercel"] },
];

// PLACEHOLDER experience: replace with real companies and dates
export const experience = [
  {
    period: "2024 — Now",
    title: "Forward Deployed Engineer & AI Agents Architect",
    org: "Independent · clients in the US, UK, GCC and Pakistan",
    body: "Embed with customer teams to design, build and roll out production agent systems for support, finance, sales, voice and HR. Own architecture, evaluation and handover.",
  },
  {
    period: "2023 — 2024",
    title: "AI Automation Engineer",
    org: "Automation agency · Karachi",
    body: "Delivered LLM workflows and RAG assistants for 15+ SMB clients. Built reusable n8n and Python templates that halved delivery time.",
  },
  {
    period: "2021 — 2023",
    title: "Full-Stack Python Developer",
    org: "Software house · Karachi",
    body: "Shipped web apps, APIs and data pipelines. Introduced the team's first ML features and Docker-based CI/CD.",
  },
];

// PLACEHOLDER certifications: keep only the ones you hold and add credential links
export const certifications = [
  { issuer: "Panaversity · PIAIC", name: "Certified Agentic & Robotic AI Engineer", href: "#" },
  { issuer: "Anthropic", name: "Building with the Claude API", href: "#" },
  { issuer: "LangChain Academy", name: "Introduction to LangGraph", href: "#" },
  { issuer: "Hugging Face", name: "AI Agents Course", href: "#" },
  { issuer: "DeepLearning.AI", name: "Multi AI Agent Systems with CrewAI", href: "#" },
  { issuer: "Microsoft", name: "Azure AI Engineer Associate", href: "#" },
];

// Cities on the globe (lat, lng). Karachi is home base.
export const home = { name: "Karachi", lat: 24.86, lng: 67.01 };
export const sites = [
  { name: "Austin", lat: 30.27, lng: -97.74 },
  { name: "New York", lat: 40.71, lng: -74.0 },
  { name: "Toronto", lat: 43.65, lng: -79.38 },
  { name: "London", lat: 51.5, lng: -0.12 },
  { name: "Berlin", lat: 52.52, lng: 13.4 },
  { name: "Dubai", lat: 25.2, lng: 55.27 },
  { name: "Riyadh", lat: 24.71, lng: 46.68 },
  { name: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
];

/** Plain-text knowledge pack for the AI twin's system prompt. */
export function knowledgePack(): string {
  const d = deployments
    .map(
      (x) =>
        `- ${x.codename} (${x.sector}, ${x.client}, ${x.location}, ${x.year}, ${x.duration}): Problem: ${x.problem} Shipped: ${x.shipped.join("; ")}. Impact: ${x.impact.map((i) => `${i.value} ${i.label}`).join("; ")}. Stack: ${x.stack.join(", ")}.`,
    )
    .join("\n");
  return [
    `Name: ${profile.name}. Role: ${profile.role} and ${profile.secondaryRole}. Based in ${profile.location} (${profile.timezone}). ${profile.availability}.`,
    `Summary: ${profile.intro}`,
    `Bio: ${profile.bio.join(" ")}`,
    `Headline metrics: ${metrics.map((m) => `${m.value}${m.suffix} ${m.label}`).join("; ")}.`,
    `How he works (forward deployment playbook): ${playbook.map((p) => `${p.week} ${p.title}: ${p.body}`).join(" ")}`,
    `Deployments:\n${d}`,
    `Tech stack: ${stack.map((s) => `${s.group}: ${s.items.join(", ")}`).join(". ")}.`,
    `Experience: ${experience.map((e) => `${e.period} ${e.title} at ${e.org}. ${e.body}`).join(" ")}`,
    `Certifications: ${certifications.map((c) => `${c.name} (${c.issuer})`).join("; ")}.`,
    `Contact: email ${profile.email}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}.`,
  ].join("\n\n");
}
