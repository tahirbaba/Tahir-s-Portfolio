// App-wide settings, read once from environment variables (.env file in development).

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got "${raw}"`);
  return n;
}

export const config = {
  port: num("PORT", 3000),
  host: process.env.HOST ?? "0.0.0.0",
  /** Public https URL of this server, used to build kitchen/rider screen links. */
  publicUrl: (process.env.PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  /** Token you type into Meta's webhook settings ("Verify token"). Any random string. */
  webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  /**
   * Meta App Secret(s): used to check that webhook calls really come from Meta.
   * Comma-separated when vendors live in different Meta apps.
   */
  metaAppSecrets: (process.env.META_APP_SECRET ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  graphApiVersion: process.env.GRAPH_API_VERSION ?? "v23.0",

  /** Claude model. Haiku 5.5 is the low-cost choice for this workload. */
  model: process.env.CLAUDE_MODEL ?? "claude-haiku-5-5",
  effort: (process.env.CLAUDE_EFFORT ?? "low") as "low" | "medium" | "high",

  /** Optional speech-to-text for voice notes (any OpenAI-compatible /audio/transcriptions endpoint). */
  stt: {
    url: process.env.STT_API_URL ?? "",
    key: process.env.STT_API_KEY ?? "",
    model: process.env.STT_MODEL ?? "whisper-large-v3",
  },

  /**
   * Rates for the usage meter's cost estimate. Check Meta's and Anthropic's price pages and
   * update these in .env when they change. AI prices are USD per million tokens.
   */
  rates: {
    usdToPkr: num("RATE_USD_TO_PKR", 280),
    /** Meta: free-form replies inside the 24h window, after the free monthly allowance. */
    waServiceUsd: num("RATE_WA_SERVICE_USD", 0.015),
    /** Meta: utility template messages (e.g. the owner's nightly report). */
    waUtilityUsd: num("RATE_WA_UTILITY_USD", 0.015),
    /** Meta: free service messages per business number per month. */
    waFreePerMonth: num("RATE_WA_FREE_PER_MONTH", 1000),
    aiInputUsd: num("RATE_AI_INPUT_USD", 0.1),
    aiCacheReadUsd: num("RATE_AI_CACHE_READ_USD", 0.01),
    /** Cache writes: 1.25x (5 min) or 2x (1 hour) input price; the system prompt uses 1 hour. */
    aiCacheWriteUsd: num("RATE_AI_CACHE_WRITE_USD", 0.2),
    aiOutputUsd: num("RATE_AI_OUTPUT_USD", 0.5),
  },

  /** Secret for the admin panel (/admin). Empty = admin panel off. */
  adminKey: process.env.ADMIN_KEY ?? "",

  dbPath: process.env.DB_PATH ?? "data/agent.db",
  vendorsDir: process.env.VENDORS_DIR ?? "vendors",

  /** A chat starts fresh after this many minutes without messages. */
  sessionIdleMinutes: num("SESSION_IDLE_MINUTES", 180),
  /** Hard cap on stored turns per chat session; a new session starts after it. */
  sessionMaxMessages: num("SESSION_MAX_MESSAGES", 60),
  /** After a hand-off, the bot stays silent in that chat for this long. */
  humanModeMinutes: num("HUMAN_MODE_MINUTES", 120),
};
