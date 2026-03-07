// app/queue.server.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined;
}

// Singleton Redis connection for BullMQ
export const redisConnection: IORedis =
  global.__redis ??
  new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__redis = redisConnection;
}

// Queue definitions
export const catalogAuditQueue = new Queue<CatalogAuditJobData>(
  "catalog-audit",
  { connection: redisConnection }
);

export const productReauditQueue = new Queue<ProductReauditJobData>(
  "product-reaudit",
  { connection: redisConnection }
);

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
): Promise<string> {
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
