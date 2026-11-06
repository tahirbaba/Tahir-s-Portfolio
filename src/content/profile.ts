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
// Real numbers from the six live projects' test and eval suites.
export const metrics: { value: number; suffix: string; label: string; decimals?: number }[] = [
  { value: 6, suffix: "", label: "Agent projects live" },
  { value: 94, suffix: "", label: "Unit tests passing" },
  { value: 160, suffix: "", label: "Eval cases, all measured" },
  { value: 40, suffix: "/40", label: "Security attacks stopped" },
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

// The six live agent projects. Numbers are measured by each project's own test and eval suites.
const GH = "https://github.com/tahirbaba/Tahir-s-Portfolio/tree/claude/quirky-volta-w80yvp/projects/";
export const deployments: Deployment[] = [
  {
    id: "relay", title: "Relay: multilingual support agent", codename: "RELAY", client: "support teams in multilingual e-commerce",
    sector: "Customer support", location: "Live demo", year: "2026", duration: "29/29 tests", mode: "Next.js · TypeScript · Claude",
    problem: "Support bots promise refunds policy doesn't allow, share order details with whoever asks, and fail customers who write in Arabic or Urdu.",
    shipped: [
      "Claude tool-use agent replying in English, Arabic, Urdu and Roman Urdu",
      "Refund limits, 30-day windows and identity checks enforced in code; refunds above 100 USD go to an approval inbox",
      "116-case eval suite in four languages with an LLM judge, plus a manager dashboard and approval inbox",
    ],
    graph: ["Verify identity", "Check policy", "Act within limits", "Approval or handoff"],
    impact: [{ value: "29/29", label: "rule and agent-loop tests" }, { value: "116", label: "eval cases in 4 languages" }, { value: "4", label: "languages incl. Urdu Nastaliq" }],
    stack: ["Next.js", "TypeScript", "Claude", "Tool use", "HMAC sessions"],
    links: [{ label: "Live demo", href: "https://relay-support-agent.vercel.app" }, { label: "Case study", href: "https://relay-support-agent.vercel.app/case-study" }, { label: "Code", href: GH + "support-agent" }],
  },
  {
    id: "leadline", title: "Leadline: speed-to-lead agent", codename: "LEADLINE", client: "B2B sales teams",
    sector: "Sales", location: "Live demo", year: "2026", duration: "26/26 tests", mode: "Python · FastAPI · Next.js",
    problem: "Inbound leads wait hours on three channels, reps chase bad fits, and time zones break meeting bookings.",
    shipped: [
      "Lead scoring against an ideal customer profile in Python, with every point explained",
      "Region routing, hot-lead alerts and meeting slots in the lead's time zone, validated against rep hours",
      "48-lead eval suite in four languages; tests caught a real midnight wrap-around booking bug",
    ],
    graph: ["Score", "Route", "Reply", "Book", "Log to CRM"],
    impact: [{ value: "26/26", label: "pytest tests" }, { value: "48", label: "eval leads in 4 languages" }, { value: "1", label: "real scheduling bug caught by tests" }],
    stack: ["Python", "FastAPI", "zoneinfo", "Claude", "Next.js"],
    links: [{ label: "Live demo", href: "https://leadline-speed-to-lead.vercel.app" }, { label: "Case study", href: "https://leadline-speed-to-lead.vercel.app/case-study" }, { label: "Code", href: GH + "speed-to-lead" }],
  },
  {
    id: "gatekeeper", title: "Gatekeeper: secure MCP gateway", codename: "GATEKEEPER", client: "security and platform teams rolling out agents",
    sector: "AI security", location: "Live playground", year: "2026", duration: "40/40 attacks stopped", mode: "Python · FastAPI · MCP",
    problem: "Teams give AI agents broad credentials; one manipulated agent can read salaries, drop tables or email data out.",
    shipped: [
      "MCP server (initialize, tools/list, tools/call) with per-agent keys and scopes",
      "Read-only SQL guard via SQLite's authorizer, path policy, PII masking by value, prompt-injection quarantine, approvals and audit log",
      "Live attack playground that runs without any AI; tests caught a PII leak through column aliases",
    ],
    graph: ["Authenticate", "Scope", "Guard arguments", "Approve", "Filter output", "Audit"],
    impact: [{ value: "40/40", label: "attacks stopped" }, { value: "9/9", label: "legitimate calls allowed" }, { value: "12/12", label: "pytest tests" }],
    stack: ["Python", "FastAPI", "MCP", "SQLite authorizer", "Claude"],
    links: [{ label: "Try to break it", href: "https://gatekeeper-mcp-gateway.vercel.app/demo" }, { label: "Security results", href: "https://gatekeeper-mcp-gateway.vercel.app/evals" }, { label: "Code", href: GH + "mcp-gateway" }],
  },
  {
    id: "ledger", title: "Ledger: accounts-payable exception agent", codename: "LEDGER", client: "finance and AP teams",
    sector: "Finance operations", location: "Live demo", year: "2026", duration: "30/30 controls", mode: "Python · FastAPI · Next.js",
    problem: "Invoices in three languages are keyed in by hand; price creep, short deliveries, wrong VAT and bank-change fraud are caught late.",
    shipped: [
      "Claude reads invoices into a strict schema, copying what is printed, mistakes included",
      "Python controls: 3-way match, duplicates, bank-change fraud hold, VAT/GST, arithmetic and approval limits",
      "Live controls checker that runs without AI, an exception queue and vendor drafts",
    ],
    graph: ["Read invoice", "3-way match", "Duplicates", "Bank check", "Tax", "Post or explain"],
    impact: [{ value: "30/30", label: "control decisions correct" }, { value: "9/9", label: "pytest tests" }, { value: "5", label: "outcomes, never a guess" }],
    stack: ["Python", "FastAPI", "Claude", "Strict tools", "Next.js"],
    links: [{ label: "Live demo", href: "https://ledger-ap-agent.vercel.app" }, { label: "Case study", href: "https://ledger-ap-agent.vercel.app/case-study" }, { label: "Code", href: GH + "ap-exception-agent" }],
  },
  {
    id: "verity", title: "Verity: recruiter integrity copilot", codename: "VERITY", client: "recruiters and HR teams",
    sector: "HR & recruiting", location: "Live demo", year: "2026", duration: "39/39 fairness & privacy checks", mode: "Python · FastAPI · Next.js",
    problem: "Polished AI-written applications flood recruiters, claims don't add up, and screening tools can react to names and gender.",
    shipped: [
      "Blind screening: names, contact details, gender, age and marital status removed before the AI reads a CV",
      "Rubric points only for verbatim quotes verified in code; experience computed from dates",
      "Consistency checks against the application form and public profile, a verification checklist, and no auto-reject",
    ],
    graph: ["Redact", "Cite evidence", "Verify quotes", "Consistency checks", "Recruiter decides"],
    impact: [{ value: "39/39", label: "integrity, fairness, privacy and bias cases" }, { value: "0", label: "score change from name or gender swaps" }, { value: "12/12", label: "pytest tests" }],
    stack: ["Python", "FastAPI", "Claude", "Counterfactual tests", "Next.js"],
    links: [{ label: "Live demo", href: "https://verity-recruiter-copilot.vercel.app" }, { label: "Fairness tests", href: "https://verity-recruiter-copilot.vercel.app/evals" }, { label: "Code", href: GH + "recruiter-copilot" }],
  },
  {
    id: "compass", title: "Compass: company knowledge assistant", codename: "COMPASS", client: "IT, HR and every employee",
    sector: "Enterprise knowledge (RAG)", location: "Live demo", year: "2026", duration: "0 permission leaks", mode: "Python · FastAPI · Next.js",
    problem: "Answers are buried in documents, chatbots leak restricted content, and old policies get quoted as current.",
    shipped: [
      "Permission filtering and superseded-policy removal before ranking, so restricted text never reaches the model",
      "Answers with section citations verified in code; unverifiable answers become ‘not found’",
      "Retrieval evals published, including a gate that was tried and reverted because it cut recall",
    ],
    graph: ["Filter by role", "Skip outdated", "Rank", "Answer with ids", "Verify citations"],
    impact: [{ value: "100%", label: "recall@3 on 26 questions" }, { value: "0", label: "permission leaks" }, { value: "6/6", label: "pytest tests" }],
    stack: ["Python", "FastAPI", "BM25", "Claude", "Next.js"],
    links: [{ label: "Live demo", href: "https://compass-knowledge-assistant.vercel.app" }, { label: "Retrieval results", href: "https://compass-knowledge-assistant.vercel.app/evals" }, { label: "Code", href: GH + "knowledge-assistant" }],
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
        `- ${x.title} (${x.sector}, built for ${x.client}; live at ${x.links[0].href}; ${x.duration}): Problem: ${x.problem} Shipped: ${x.shipped.join("; ")}. Impact: ${x.impact.map((i) => `${i.value} ${i.label}`).join("; ")}. Stack: ${x.stack.join(", ")}.`,
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
