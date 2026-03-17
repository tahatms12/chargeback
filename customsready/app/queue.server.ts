// app/queue.server.ts
// NOTE: BullMQ queues require a Redis connection.
// In Netlify Functions (serverless/stateless), module-scope connections
// are wrapped with null-checks so the import does not crash on cold start
// when REDIS_URL is unavailable.

import { Queue } from "bullmq";
import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | null | undefined;
}

// ─── Redis singleton with null-guard ──────────────────────────────────────────
// BullMQ workers cannot run in Netlify Functions (stateless serverless).
// Queue enqueue operations ARE possible if REDIS_URL is set as an env var,
// but worker consumption must run from a dedicated Node.js server process.

let redisConnection: IORedis | null = null;

try {
  redisConnection =
    global.__redis ??
    new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Do not connect until first command
    });

  if (process.env.NODE_ENV !== "production") {
    global.__redis = redisConnection;
  }
} catch (e) {
  console.error("[CustomsReady] Redis unavailable — queue features disabled:", e);
  redisConnection = null;
}

export { redisConnection };

// ─── Queue definitions (only if Redis is available) ─────────────────────────

export let catalogAuditQueue: Queue<CatalogAuditJobData> | null = null;
export let productReauditQueue: Queue<ProductReauditJobData> | null = null;

if (redisConnection) {
  catalogAuditQueue = new Queue<CatalogAuditJobData>("catalog-audit", {
    connection: redisConnection,
  });
  productReauditQueue = new Queue<ProductReauditJobData>("product-reaudit", {
    connection: redisConnection,
  });
}

export interface CatalogAuditJobData {
  shopDomain: string;
  auditRunId: string;
  triggeredBy: "manual" | "install";
}

export interface ProductReauditJobData {
  shopDomain: string;
  productGid: string; // e.g. "gid://shopify/Product/123"
  webhookTopic: "products/create" | "products/update";
}

// Enqueue a full catalog audit, deduplicating by shopDomain
export async function enqueueCatalogAudit(
  shopDomain: string,
  triggeredBy: CatalogAuditJobData["triggeredBy"] = "manual"
): Promise<string | null> {
  if (!catalogAuditQueue) {
    console.error("[CustomsReady] catalogAuditQueue unavailable — Redis not connected");
    return null;
  }

  const { db } = await import("./db.server");

  // Create an AuditRun record to track progress
  const auditRun = await db.auditRun.create({
    data: {
      shopDomain,
      status: "queued",
      triggeredBy,
    },
  });

  // Use jobId for dedup — only one full audit per shop at a time
  await catalogAuditQueue.add(
    "audit",
    { shopDomain, auditRunId: auditRun.id, triggeredBy },
    {
      jobId: `catalog-audit:${shopDomain}`,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 5 },
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
    }
  );

  return auditRun.id;
}

// Enqueue a single-product re-audit (from webhook)
export async function enqueueProductReaudit(
  shopDomain: string,
  productGid: string,
  webhookTopic: ProductReauditJobData["webhookTopic"]
): Promise<void> {
  if (!productReauditQueue) {
    console.error("[CustomsReady] productReauditQueue unavailable — Redis not connected");
    return;
  }

  await productReauditQueue.add(
    "reaudit",
    { shopDomain, productGid, webhookTopic },
    {
      // Dedup: one pending reaudit per product per shop
      jobId: `reaudit:${shopDomain}:${productGid}`,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    }
  );
}
