// app/jobs/productReaudit.worker.ts
// Run this process separately: `tsx app/jobs/productReaudit.worker.ts`
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import pino from "pino";
import type { ProductReauditJobData } from "../queue.server";
import {
  executeWithThrottling,
  REAUDIT_PRODUCT_QUERY,
  type ProductNode,
} from "../lib/graphql.server";
import {
  classifyVariant,
  buildAuditRecord,
  upsertAuditRecords,
  pruneStaleVariants,
  isExempt,
} from "../lib/audit.server";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "product-reaudit-worker" },
  redact: { paths: ["accessToken"], remove: true },
});

const db = new PrismaClient();

const redis = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker<ProductReauditJobData>(
  "product-reaudit",
  async (job: Job<ProductReauditJobData>) => {
    const { shopDomain, productGid, webhookTopic } = job.data;

    logger.info({ shopDomain, productGid, webhookTopic }, "Starting product re-audit");

    const installation = await db.installation.findUnique({
      where: { shopDomain },
    });

    if (!installation?.accessToken) {
      // Shop may have uninstalled — silently skip
      logger.warn({ shopDomain }, "No access token — skipping re-audit");
      return;
    }

    const config = await db.configuration.findUnique({
      where: { shopDomain },
    });
    const exemptTags = config?.exemptTags ?? [];

    const adminGraphql = makeAdminGraphql(shopDomain, installation.accessToken);

    // Fetch single product
    const data = await executeWithThrottling<{ product: ProductNode | null }>(
      adminGraphql,
      REAUDIT_PRODUCT_QUERY,
      { id: productGid }
    );

    const product = data.product;

    if (!product) {
      // Product was deleted — remove all its audit records
      logger.info({ shopDomain, productGid }, "Product not found — removing audit records");
      await db.productAuditRecord.deleteMany({
        where: { shopDomain, productId: productGid },
      });
      return;
    }

    // Check exempt status
    if (isExempt(product.tags, exemptTags)) {
      logger.info({ shopDomain, productGid }, "Product is exempt — removing from audit records");
      await db.productAuditRecord.deleteMany({
        where: { shopDomain, productId: productGid },
      });
      return;
    }

    // Build records for current variants
    const records = product.variants.nodes.map((variant) => {
      const status = classifyVariant(variant);
      return buildAuditRecord(shopDomain, product, variant, status);
    });

    // Upsert current records
    if (records.length > 0) {
      await upsertAuditRecords(shopDomain, records);
    }

    // Remove records for variants that no longer exist
    const currentVariantIds = product.variants.nodes.map((v) => v.id);
    await pruneStaleVariants(shopDomain, productGid, currentVariantIds);

    logger.info(
      {
        shopDomain,
        productGid,
        variantsProcessed: records.length,
      },
      "Product re-audit complete"
    );
  },
  {
    connection: redis,
    concurrency: 10, // higher concurrency for lightweight single-product jobs
  }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, productGid: job.data.productGid }, "Re-audit job completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, productGid: job?.data.productGid, error: err.message },
    "Re-audit job failed"
  );
});

function makeAdminGraphql(
  shopDomain: string,
  accessToken: string
): (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response> {
  return async (query, options) => {
    const url = `https://${shopDomain}/admin/api/2025-01/graphql.json`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables: options?.variables ?? {} }),
    });
    if (!response.ok) {
      throw new Error(`GraphQL ${response.status}: ${response.statusText}`);
    }
    return response;
  };
}

process.on("SIGTERM", async () => {
  await worker.close();
  await db.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await worker.close();
  await db.$disconnect();
  redis.disconnect();
  process.exit(0);
});

logger.info("Product re-audit worker started");
