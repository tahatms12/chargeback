// app/jobs/catalogAudit.worker.ts
// Run this process separately: `tsx app/jobs/catalogAudit.worker.ts`
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import pino from "pino";
import type { CatalogAuditJobData } from "../queue.server";
import {
  paginateProducts,
  executeWithThrottling,
  REAUDIT_PRODUCT_QUERY,
} from "../lib/graphql.server";
import {
  classifyVariant,
  buildAuditRecord,
  upsertAuditRecords,
  isExempt,
} from "../lib/audit.server";

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

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker<CatalogAuditJobData>(
  "catalog-audit",
  async (job: Job<CatalogAuditJobData>) => {
    const { shopDomain, auditRunId, triggeredBy } = job.data;

    logger.info({ shopDomain, auditRunId, triggeredBy }, "Starting catalog audit");

    // Mark audit run as running
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "running", startedAt: new Date() },
    });

    // Get the shop's offline access token
    const installation = await db.installation.findUnique({
      where: { shopDomain },
    });

    if (!installation?.accessToken) {
      throw new Error(`No access token found for shop: ${shopDomain}`);
    }

    // Get exempt tags from configuration
    const config = await db.configuration.findUnique({
      where: { shopDomain },
    });
    const exemptTags = config?.exemptTags ?? [];

    // Build a minimal adminGraphql function using the stored token
    const adminGraphql = makeAdminGraphql(shopDomain, installation.accessToken);

    // Counters
    let totalProducts = 0;
    let totalVariants = 0;
    let processedVariants = 0;
    let missingHs = 0;
    let missingCoo = 0;
    let missingBoth = 0;

    // Paginate through all products
    try {
      for await (const productPage of paginateProducts(adminGraphql, 50)) {
        totalProducts += productPage.length;

        for (const product of productPage) {
          // Skip exempt products
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

          // Upsert this product's variant records
          if (records.length > 0) {
            await upsertAuditRecords(shopDomain, records);
          }
        }

        // Update progress counter every page
        await db.auditRun.update({
          where: { id: auditRunId },
          data: {
            totalProducts,
            totalVariants,
            processedVariants,
            missingHs,
            missingCoo,
            missingBoth,
          },
        });

        await job.updateProgress(
          totalVariants > 0
            ? Math.round((processedVariants / Math.max(totalVariants, 1)) * 100)
            : 0
        );
      }

      // Mark as completed
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

      logger.info(
        {
          shopDomain,
          auditRunId,
          totalProducts,
          totalVariants,
          missingHs,
          missingCoo,
          missingBoth,
        },
        "Catalog audit completed"
      );
    } catch (err) {
      const errorSummary =
        err instanceof Error ? err.message : String(err);
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
    concurrency: 2, // max 2 full audits running simultaneously
  }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id, shop: job.data.shopDomain }, "Audit job completed");
});

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, shop: job?.data.shopDomain, error: err.message },
    "Audit job failed"
  );
});

// ─── Direct Shopify Admin GraphQL caller using stored token ──────────────────

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

// Graceful shutdown
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
