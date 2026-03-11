/**
 * routes/webhooks.js
 *
 * Shopify webhook handlers.
 *
 * draft_orders/create and draft_orders/update:
 *   Shopify's draft order webhooks have limited events — they do NOT fire for
 *   inactivity. The poller handles age-based logic. These handlers are included
 *   to satisfy app review requirements and to allow future use (e.g., clearing
 *   action records when a draft is converted to an order).
 *
 * GDPR mandatory webhooks are included (customers/data_request, customers/redact,
 * shop/redact) as required by Shopify App Store review.
 */

import { DeliveryMethod } from "@shopify/shopify-api";
import { getDb, recordAction } from "../db.js";

const webhookHandlers = {
  // -------------------------------------------------------------------------
  // draft_orders/create
  // Record the creation in our DB if we want future tracking.
  // Currently a no-op beyond logging — the poller handles all lifecycle logic.
  // -------------------------------------------------------------------------
  DRAFT_ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body) => {
      try {
        const draft = JSON.parse(body);
        console.log(
          `[webhook] draft_orders/create — shop: ${shop}, draft: ${draft.name} (${draft.id})`
        );
        // No action required: poller will detect and process this draft on the next cycle
      } catch (err) {
        console.error("[webhook] draft_orders/create error:", err.message);
      }
    },
  },

  // -------------------------------------------------------------------------
  // draft_orders/update
  // If a draft is updated (e.g., customer pays and it becomes an order),
  // we clear our follow_up_sent / expired records so the dashboard stays clean.
  // -------------------------------------------------------------------------
  DRAFT_ORDERS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body) => {
      try {
        const draft = JSON.parse(body);
        console.log(
          `[webhook] draft_orders/update — shop: ${shop}, draft: ${draft.name}, status: ${draft.status}`
        );

        // If the draft has been completed (converted to order), remove our action records
        // so the dashboard accurately reflects it is no longer an open draft.
        if (draft.status === "completed") {
          getDb()
            .prepare(
              "DELETE FROM draft_order_actions WHERE shop = ? AND draft_order_id = ?"
            )
            .run(shop, String(draft.id));
          console.log(
            `[webhook] Cleared action records for completed draft ${draft.id} — ${shop}`
          );
        }
      } catch (err) {
        console.error("[webhook] draft_orders/update error:", err.message);
      }
    },
  },

  // -------------------------------------------------------------------------
  // GDPR mandatory webhooks
  // Source fact: Required for Shopify App Store review.
  // This app stores no PII beyond what's in draft order records.
  // -------------------------------------------------------------------------
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body) => {
      // This app stores no customer PII directly.
      // Draft order action logs reference draft_order_id only (no email/name stored).
      console.log(`[webhook] customers/data_request received for ${shop} — no PII stored.`);
    },
  },

  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body) => {
      // No customer PII to redact in our database.
      console.log(`[webhook] customers/redact received for ${shop} — no PII stored.`);
    },
  },

  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body) => {
      // Shop has uninstalled and the 48-hour window has passed.
      // Delete all app data for this shop.
      console.log(`[webhook] shop/redact received for ${shop} — deleting all shop data.`);
      try {
        const db = getDb();
        db.prepare("DELETE FROM draft_order_actions WHERE shop = ?").run(shop);
        db.prepare("DELETE FROM shop_settings WHERE shop = ?").run(shop);
        db.prepare("DELETE FROM sessions WHERE shop = ?").run(shop);
        console.log(`[webhook] All data deleted for ${shop}.`);
      } catch (err) {
        console.error(`[webhook] shop/redact cleanup error for ${shop}:`, err.message);
      }
    },
  },
};

export default webhookHandlers;
