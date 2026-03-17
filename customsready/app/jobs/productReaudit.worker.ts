// app/jobs/productReaudit.worker.ts
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: This file must be run as a SEPARATE long-running Node.js process.
// It CANNOT be executed inside Netlify Functions (stateless serverless).
// Run from a dedicated server (Docker/Railway/Fly.io):
//   tsx app/jobs/productReaudit.worker.ts
// ─────────────────────────────────────────────────────────────────────────────

// Guard: do not accidentally execute in a serverless context
if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  console.error(
    "[productReaudit.worker] ERROR: This worker cannot run in serverless environments. " +
    "Deploy to a dedicated server process. Exiting."
  );
  process.exit(1);
}

export const initProductReauditWorker = async () => {
  const { Worker } = await import("bullmq");
  const IORedis = (await import("ioredis")).default;
  const { PrismaClient } = await import("@prisma/client");
  const pino = (await import("pino")).default;
  const { executeWithThrottling, REAUDIT_PRODUCT_QUERY } = await import("../lib/graphql.server");
  const { classifyVariant, buildAuditRecord, upsertAuditRecords, pruneStaleVariants, isExempt } = await import("../lib/audit.server");

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

  const worker = new Worker<import("../queue.server").ProductReauditJobData>(
    "product-reaudit",
    async (job) => {
      const { shopDomain, productGid, webhookTopic } = job.data;

      logger.info({ shopDomain, productGid, webhookTopic }, "Starting product re-audit");

      const installation = await db.installation.findUnique({
        where: { shopDomain },
      });

      if (!installation?.accessToken) {
        logger.warn({ shopDomain }, "No access token — skipping re-audit");
        return;
      }

      const config = await db.configuration.findUnique({
        where: { shopDomain },
      });
      const exemptTags = config?.exemptTags ?? [];

      const adminGraphql = makeAdminGraphql(shopDomain, installation.accessToken);

      const data = await executeWithThrottling<{ product: import("../lib/graphql.server").ProductNode | null }>(
        adminGraphql,
        REAUDIT_PRODUCT_QUERY,
        { id: productGid }
      );

      const product = data.product;

      if (!product) {
        logger.info({ shopDomain, productGid }, "Product not found — removing audit records");
        await db.productAuditRecord.deleteMany({
          where: { shopDomain, productId: productGid },
        });
        return;
      }

      if (isExempt(product.tags, exemptTags)) {
        logger.info({ shopDomain, productGid }, "Product is exempt — removing from audit records");
        await db.productAuditRecord.deleteMany({
          where: { shopDomain, productId: productGid },
        });
        return;
      }

      const records = product.variants.nodes.map((variant) => {
        const status = classifyVariant(variant);
        return buildAuditRecord(shopDomain, product, variant, status);
      });

      if (records.length > 0) {
        await upsertAuditRecords(shopDomain, records);
      }

      const currentVariantIds = product.variants.nodes.map((v) => v.id);
      await pruneStaleVariants(shopDomain, productGid, currentVariantIds);

      logger.info(
        { shopDomain, productGid, variantsProcessed: records.length },
        "Product re-audit complete"
      );
    },
    {
      connection: redis,
      concurrency: 10,
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
  return worker;
};

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

// Auto-start if run directly (not imported)
initProductReauditWorker().catch((err) => {
  console.error("Failed to start product re-audit worker:", err);
  process.exit(1);
});
