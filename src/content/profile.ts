/**
 * Single source of truth for portfolio content.
 * The UI renders from this file and the AI twin answers from it.
 */

export const profile = {
  name: "Muhammad Tahir Hasni",
  shortName: "Tahir Hasni",
  initials: "MTH",
  role: "Forward Deployed Engineer",
  secondaryRole: "AI Agents Architect",
  location: "Islamabad, Pakistan",
  coords: "33.68° N, 73.05° E",
  timezone: "UTC+5",
  availability: "Open to remote FDE and AI engineering roles",
  email: "muhammadtahirhasni@gmail.com",
  linkedin: "https://www.linkedin.com/in/muhammad-tahir-hasni",
  github: "https://github.com/tahirbaba",
  whatsapp: "https://wa.me/923129114002",
  phone: "+92 312 9114002",
  calendar: "#contact",
  resume: "/muhammad-tahir-hasni-resume.pdf",
  company: "Nexora",
  since: 2024,
  languages: ["English", "Arabic", "Urdu"],
  headline: "I ship AI agents into the real world.",
  intro:
    "Founder of Nexora, Forward Deployed Engineer and AI Agents Architect. I embed with customer teams, find the workflow that is bleeding hours, and deploy agents that run inside their stack, measured, monitored and owned by them.",
  bio: [
    "I work where AI meets the messy reality of a business: legacy systems, unclear processes, impatient stakeholders and data nobody has cleaned. My job is to sit with the people who do the work, understand it better than the spec does, and turn it into agent systems that hold up in production.",
    "I design multi-agent architectures, write the integrations, build the evaluation harness and stay through rollout. I measure success the way the customer does: hours returned, tickets closed, revenue protected. Then I write down what we learned so the product team can make it repeatable.",
  ],
};

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

export const experience = [
  {
    period: "2024 — Now",
    title: "Founder & Lead AI Engineer",
    org: "Nexora · Islamabad",
    body: "Founded Nexora to design, build and deploy AI agents and automation for businesses. Own the full cycle: discovery with the client's team, architecture, integrations, evaluation, rollout and handover.",
  },
  {
    period: "2024 — Now",
    title: "Freelance AI Agent Developer",
    org: "Remote · clients in the US, UAE and other markets",
    body: "Build AI agents, workflow automations and full-stack web apps for clients across time zones, from first scoping call to production.",
  },
];

/** Training programmes (not certifications). */
export const training = [
  { org: "GIAIC", full: "Governor's Initiative for Artificial Intelligence & Computing", items: ["Agentic AI Development", "AI Agents", "Full-Stack Development"] },
  { org: "PIAIC", full: "Presidential Initiative for Artificial Intelligence & Computing", items: ["Agentic AI Development", "Digital FTE", "Full-Stack Development"] },
];

/** Only real credentials. Each one gets a verification link once issued. */
export const certifications: { issuer: string; name: string; status: "in_progress" | "earned"; href?: string }[] = [
  { issuer: "Anthropic Academy", name: "Claude courses: building with the Claude API, MCP and agents", status: "in_progress" },
  { issuer: "Anthropic", name: "Claude Certified Associate: Foundations", status: "in_progress" },
];

/** Reviews: each one links to the reviewer's public profile. Labels: Client, Pilot client, Expert review. */
export const reviews: { label: "Client" | "Pilot client" | "Expert review"; name: string; title: string; href: string; project: string; projectHref: string; summary: string; quote?: string }[] = [
  {
    label: "Expert review",
    name: "Razan N. Alomrani",
    title: "Academic · Cybersecurity, AI research, data governance & privacy",
    href: "https://www.linkedin.com/in/ACoAADrgZg4Bsc09GfQyG5GXmvI82q1rvdlladA",
    project: "Verity",
    projectHref: "https://verity-recruiter-copilot.vercel.app/case-study",
    summary: "Reviewed Verity's privacy and governance against the EU AI Act, GDPR and Saudi PDPL, and sent 10 detailed recommendations. All 10 were implemented in Verity v1.2: re-identification guard, data minimisation, applicant notice and consent, audit log, bias audit dashboard and more.",
  },
];

// Cities on the globe (lat, lng). Islamabad is home base.
export const home = { name: "Islamabad", lat: 33.68, lng: 73.05 };
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
    `Name: ${profile.name}. Role: ${profile.role} and ${profile.secondaryRole}; founder of ${profile.company} (since ${profile.since}). Based in ${profile.location} (${profile.timezone}). ${profile.availability}. Languages: ${profile.languages.join(", ")}.`,
    `Summary: ${profile.intro}`,
    `Bio: ${profile.bio.join(" ")}`,
    `Headline metrics: ${metrics.map((m) => `${m.value}${m.suffix} ${m.label}`).join("; ")}.`,
    `How he works (forward deployment playbook): ${playbook.map((p) => `${p.week} ${p.title}: ${p.body}`).join(" ")}`,
    `Deployments:\n${d}`,
    `Tech stack: ${stack.map((s) => `${s.group}: ${s.items.join(", ")}`).join(". ")}.`,
    `Experience: ${experience.map((e) => `${e.period} ${e.title} at ${e.org}. ${e.body}`).join(" ")}`,
    `Training: ${training.map((t) => `${t.org} (${t.full}): ${t.items.join(", ")}`).join("; ")}.`,
    `Certifications: ${certifications.map((c) => `${c.name} (${c.issuer}, ${c.status === "earned" ? "earned" : "in progress"})`).join("; ")}.`,
    `Reviews: ${reviews.map((r) => `${r.label} by ${r.name} (${r.title}) of ${r.project}: ${r.summary}`).join(" ")}`,
    `Contact: email ${profile.email}, WhatsApp ${profile.phone}, LinkedIn ${profile.linkedin}, GitHub ${profile.github}. Résumé PDF on the site.`,
  ].join("\n\n");
}
