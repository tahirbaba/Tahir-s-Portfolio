// HTTP server: Meta webhook + kitchen/rider screen + health check.

import Fastify, { type FastifyInstance } from "fastify";
import { config } from "./config.js";
import type { Store } from "./db.js";
import type { Engine } from "./engine.js";
import { registerOpsRoutes } from "./ops/routes.js";
import type { VendorRegistry } from "./vendors.js";
import { parseWebhook, verifySignature } from "./whatsapp/webhook.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
  }
}

export function buildServer(deps: {
  store: Store;
  vendors: VendorRegistry;
  engine: Engine;
  /** Only for local testing without Meta. Never enable in production. */
  allowUnsignedWebhooks?: boolean;
  logger?: boolean;
}): FastifyInstance {
  const app = Fastify({
    logger:
      deps.logger === false
        ? false
        : {
            // Log paths without the query string, so kitchen-screen keys never land in log files.
            serializers: { req: (req) => ({ method: req.method, url: req.url.split("?")[0] }) },
          },
    bodyLimit: 2 * 1024 * 1024,
    trustProxy: true,
  });

  // Keep the raw body: Meta's signature is computed over the exact bytes.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    req.rawBody = body as string;
    try {
      done(null, body ? JSON.parse(body as string) : {});
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.get("/health", async () => ({ ok: true, vendors: deps.vendors.all().length }));

  // Meta calls this once when you save the webhook URL in the app dashboard.
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string | undefined>;
    if (q["hub.mode"] === "subscribe" && config.webhookVerifyToken && q["hub.verify_token"] === config.webhookVerifyToken) {
      return reply.type("text/plain").send(q["hub.challenge"] ?? "");
    }
    return reply.code(403).send("forbidden");
  });

  app.post("/webhook", async (req, reply) => {
    const signed = verifySignature(req.rawBody ?? "", req.headers["x-hub-signature-256"] as string | undefined, config.metaAppSecrets);
    if (!signed && !deps.allowUnsignedWebhooks) {
      req.log.warn("webhook with bad or missing signature rejected");
      return reply.code(401).send("bad signature");
    }
    const messages = parseWebhook(req.body);
    // Answer Meta right away; the AI work happens in the background.
    for (const m of messages) void deps.engine.enqueue(m);
    return reply.code(200).send("ok");
  });

  registerOpsRoutes(app, deps);
  return app;
}
