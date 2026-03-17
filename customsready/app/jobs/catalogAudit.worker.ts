// app/jobs/catalogAudit.worker.ts
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: This file must be run as a SEPARATE long-running Node.js process.
// It CANNOT be executed inside Netlify Functions (stateless serverless).
// Run from a dedicated server (Docker/Railway/Fly.io):
//   tsx app/jobs/catalogAudit.worker.ts
// ─────────────────────────────────────────────────────────────────────────────
//
// BullMQ workers maintain persistent Redis connections and run background jobs.
// These are incompatible with Netlify's serverless model (function spins down
// between requests; persistent connections and background workers cannot run).
//
// To re-enable in production, deploy this worker separately from the Remix app:
//   1. Create a Dockerfile for the worker process
//   2. Deploy to Railway, Fly.io, or any persistent compute environment
//   3. Set REDIS_URL to point at a shared Redis instance
//   4. The Remix Netlify Functions will enqueue jobs; this worker will process them

// Guard: do not accidentally execute in a serverless context
if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  console.error(
    "[catalogAudit.worker] ERROR: This worker cannot run in serverless environments. " +
    "Deploy to a dedicated server process. Exiting."
  );
  process.exit(1);
}

export const initCatalogAuditWorker = async () => {
  const { Worker, type: _job } = await import("bullmq");
  const IORedis = (await import("ioredis")).default;
  const { PrismaClient } = await import("@prisma/client");
  const pino = (await import("pino")).default;
  const { paginateProducts, executeWithThrottling, REAUDIT_PRODUCT_QUERY } = await import("../lib/graphql.server");
  const { classifyVariant, buildAuditRecord, upsertAuditRecords, isExempt } = await import("../lib/audit.server");
  const type = null; void type; // suppress unused import

  const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: "catalog-audit-worker" },
    redact: { paths: ["accessToken"], remove: true },
  });

  const db = new PrismaClient();

  const redis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker<import("../queue.server").CatalogAuditJobData>(
    "catalog-audit",
    async (job) => {
      const { shopDomain, auditRunId, triggeredBy } = job.data;

      logger.info({ shopDomain, auditRunId, triggeredBy }, "Starting catalog audit");

      await db.auditRun.update({
        where: { id: auditRunId },
        data: { status: "running", startedAt: new Date() },
      });

      const installation = await db.installation.findUnique({
        where: { shopDomain },
      });

      if (!installation?.accessToken) {
        throw new Error(`No access token found for shop: ${shopDomain}`);
      }

      const config = await db.configuration.findUnique({
        where: { shopDomain },
      });
      const exemptTags = config?.exemptTags ?? [];

      const adminGraphql = makeAdminGraphql(shopDomain, installation.accessToken);

      let totalProducts = 0;
      let totalVariants = 0;
      let processedVariants = 0;
      let missingHs = 0;
      let missingCoo = 0;
      let missingBoth = 0;

      try {
        for await (const productPage of paginateProducts(adminGraphql, 50)) {
          totalProducts += productPage.length;

          for (const product of productPage) {
            if (isExempt(product.tags, exemptTags)) {
              logger.debug({ shopDomain, productId: product.id }, "Skipping exempt product");
              continue;
            }

            const records = [];

            for (const variant of product.variants.nodes) {
              totalVariants++;
              const status = classifyVariant(variant);

              if (status === "missing_hs" || status === "missing_both") missingHs++;
              if (status === "missing_coo" || status === "missing_both") missingCoo++;
              if (status === "missing_both") missingBoth++;

              records.push(buildAuditRecord(shopDomain, product, variant, status));
              processedVariants++;
            }

            if (records.length > 0) {
              await upsertAuditRecords(shopDomain, records);
            }
          }

          await db.auditRun.update({
            where: { id: auditRunId },
            data: { totalProducts, totalVariants, processedVariants, missingHs, missingCoo, missingBoth },
          });

          await job.updateProgress(
            totalVariants > 0
              ? Math.round((processedVariants / Math.max(totalVariants, 1)) * 100)
              : 0
          );
        }

        await db.auditRun.update({
          where: { id: auditRunId },
          data: {
            status: "completed",
            completedAt: new Date(),
            totalProducts,
            totalVariants,
            processedVariants,
            missingHs,
            missingCoo,
            missingBoth,
          },
        });

        logger.info({ shopDomain, auditRunId, totalProducts, totalVariants, missingHs, missingCoo, missingBoth }, "Catalog audit completed");
      } catch (err) {
        const errorSummary = err instanceof Error ? err.message : String(err);
        await db.auditRun.update({
          where: { id: auditRunId },
          data: {
            status: "failed",
            completedAt: new Date(),
            totalProducts,
            totalVariants,
            processedVariants,
            missingHs,
            missingCoo,
            missingBoth,
            errorSummary,
          },
        });
        logger.error({ shopDomain, auditRunId, error: errorSummary }, "Catalog audit failed");
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, shop: job.data.shopDomain }, "Audit job completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, shop: job?.data.shopDomain, error: err.message }, "Audit job failed");
  });

  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received — closing catalog audit worker");
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

  logger.info("Catalog audit worker started");
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
      body: JSON.stringify({
        query,
        variables: options?.variables ?? {},
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Shopify GraphQL request failed: ${response.status} ${response.statusText}`
      );
    }

    return response;
  };
}

// Auto-start if run directly (not imported)
initCatalogAuditWorker().catch((err) => {
  console.error("Failed to start catalog audit worker:", err);
  process.exit(1);
});
