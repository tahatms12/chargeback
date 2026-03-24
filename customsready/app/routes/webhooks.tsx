// app/routes/webhooks.$.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { enqueueProductReaudit } from "~/queue.server";
import { logger } from "~/lib/logger.server";
import { toGid } from "~/lib/graphql.server";

/**
 * All Shopify webhooks are routed here.
 * shopify-app-remix verifies HMAC signature before this code runs.
 * All processing is idempotent and safe for retry.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  logger.info({ topic, shop }, "Webhook received");

  switch (topic) {
    // ── GDPR: Customer data request ─────────────────────────────────────────
    // We do not store any customer PII, so there is nothing to export.
    case "CUSTOMERS_DATA_REQUEST": {
      logger.info({ shop, topic }, "GDPR customers/data_request — no PII stored");
      return new Response(null, { status: 200 });
    }

    // ── GDPR: Customer data redaction ────────────────────────────────────────
    case "CUSTOMERS_REDACT": {
      const webhookPayload = payload as any;
      if (webhookPayload?.orders_to_redact && Array.isArray(webhookPayload.orders_to_redact)) {
        const orderGids = webhookPayload.orders_to_redact.map((id: number | string) => toGid("Order", String(id)));
        await db.invoiceRecord.deleteMany({
          where: { shopDomain: shop, orderId: { in: orderGids } }
        });
        await db.pdfGenerationLog.deleteMany({
          where: { shopDomain: shop, orderId: { in: orderGids } }
        });
      }
      logger.info({ shop, topic }, "GDPR customers/redact — deleted invoice records");
      return new Response(null, { status: 200 });
    }

    // ── GDPR: Shop redaction (48h after uninstall) ───────────────────────────
    // Delete all app data for this shop.
    case "SHOP_REDACT": {
      logger.info({ shop, topic }, "GDPR shop/redact — deleting all shop data");
      await deleteAllShopData(shop);
      return new Response(null, { status: 200 });
    }

    // ── App uninstalled ───────────────────────────────────────────────────────
    case "APP_UNINSTALLED": {
      logger.info({ shop, topic }, "App uninstalled — clearing session");
      // Clear sessions; retain Installation for billing/reactivation tracking
      await db.session.deleteMany({ where: { shop } });
      await db.installation.updateMany({
        where: { shopDomain: shop },
        data: { billingStatus: "cancelled" },
      });
      return new Response(null, { status: 200 });
    }

    // ── Products created ─────────────────────────────────────────────────────
    case "PRODUCTS_CREATE": {
      const webhookPayload = payload as { id: number };
      const productNumericId = String(webhookPayload.id);
      const productGid = toGid("Product", productNumericId);

      logger.info({ shop, productGid, topic }, "Product created — enqueueing re-audit");

      await enqueueProductReaudit(shop, productGid, "products/create");
      return new Response(null, { status: 200 });
    }

    // ── Products updated ─────────────────────────────────────────────────────
    case "PRODUCTS_UPDATE": {
      const webhookPayload = payload as { id: number };
      const productNumericId = String(webhookPayload.id);
      const productGid = toGid("Product", productNumericId);

      logger.info({ shop, productGid, topic }, "Product updated — enqueueing re-audit");

      await enqueueProductReaudit(shop, productGid, "products/update");
      return new Response(null, { status: 200 });
    }

    default: {
      logger.warn({ shop, topic }, "Unhandled webhook topic");
      return new Response(null, { status: 200 });
    }
  }
};

// ─── Shop data deletion ───────────────────────────────────────────────────────

async function deleteAllShopData(shopDomain: string): Promise<void> {
  try {
    // Delete in dependency order
    await db.$transaction([
      db.invoiceRecord.deleteMany({ where: { shopDomain } }),
      db.pdfGenerationLog.deleteMany({ where: { shopDomain } }),
      db.productAuditRecord.deleteMany({ where: { shopDomain } }),
      db.auditRun.deleteMany({ where: { shopDomain } }),
      db.configuration.deleteMany({ where: { shopDomain } }),
      db.installation.deleteMany({ where: { shopDomain } }),
      db.session.deleteMany({ where: { shop: shopDomain } }),
    ]);
    logger.info({ shopDomain }, "All shop data deleted for GDPR shop/redact");
  } catch (err) {
    logger.error(
      { shopDomain, error: err instanceof Error ? err.message : String(err) },
      "Error deleting shop data during shop/redact"
    );
    throw err;
  }
}
