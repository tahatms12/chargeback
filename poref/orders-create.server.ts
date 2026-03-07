// app/routes/webhooks/orders-create.server.ts
//
// Pipeline:
// 1. Idempotency check
// 2. Load shop configuration
// 3. Extract PO reference from order note_attributes
// 4. If reference found: write metafield → index → audit
// 5. If no reference: evaluate enforcement → conditionally mark as missing

import { prisma } from "../../db.server";
import { claimWebhookEvent, markWebhookError } from "../../utils/webhook-idempotency.server";
import { writeOrderReference, orderGidFromId } from "../../utils/metafields.server";
import { upsertReferenceIndex, markMissingReference } from "../../utils/reference-index.server";
import { writeAuditLog } from "../../utils/audit.server";

// The key used in cart attributes / note_attributes for the PO reference.
// Must match what the theme extension and checkout extension write.
export const POREF_ATTRIBUTE_KEY = "_poref_reference_number";

export async function handleOrdersCreate({
  shop,
  payload,
  admin,
  eventId,
}: {
  shop: string;
  payload: any;
  admin: any;
  eventId: string;
}): Promise<Response> {
  // 1. Idempotency
  const claimed = await claimWebhookEvent({
    shopDomain: shop,
    topic: "orders/create",
    eventId,
  });
  if (!claimed) {
    return new Response("Already processed", { status: 200 });
  }

  const order = payload;
  const orderId = String(order.id);
  const orderGid = orderGidFromId(orderId);
  const orderName = order.name ?? `#${orderId}`;

  try {
    // 2. Load configuration
    const config = await prisma.configuration.findUnique({
      where: { shopDomain: shop },
    });

    if (!config) {
      // App not fully configured — skip processing but don't error
      console.warn(`[orders/create] No config for shop: ${shop}`);
      return new Response("No config", { status: 200 });
    }

    // 3. Extract reference from note_attributes
    //    Shopify propagates cart attributes to order note_attributes.
    //    The checkout UI extension writes order customAttributes.
    //    Both end up in note_attributes on the order payload.
    const noteAttributes: Array<{ name: string; value: string }> =
      order.note_attributes ?? [];

    const referenceAttr = noteAttributes.find(
      (attr) => attr.name === POREF_ATTRIBUTE_KEY
    );
    const rawReference = referenceAttr?.value?.trim() ?? "";

    // 4. Determine if enforcement applies to this customer
    const customerTagMatch = doesEnforcementApply(config, order);

    if (rawReference.length > 0) {
      // Write to Shopify metafield
      const metafieldResult = await writeOrderReference(
        admin,
        orderGid,
        rawReference
      );

      if (!metafieldResult.success) {
        const errMsg = metafieldResult.errors
          ?.map((e) => e.message)
          .join(", ");
        console.error(
          `[orders/create] Metafield write failed for order ${orderId}: ${errMsg}`
        );
        await markWebhookError({
          shopDomain: shop,
          topic: "orders/create",
          eventId,
          error: errMsg ?? "metafield write failed",
        });
        return new Response("Metafield write error", { status: 200 });
        // 200 so Shopify doesn't retry — the error is logged for manual resolution
      }

      // Index in app DB
      await upsertReferenceIndex({
        shopDomain: shop,
        orderId,
        orderGid,
        orderName,
        referenceValue: rawReference,
        sourceChannel: "ONLINE",
        customerTagMatch,
      });

      // Audit
      await writeAuditLog({
        shopDomain: shop,
        orderId,
        action: "CREATED_FROM_CHECKOUT",
        actorType: "WEBHOOK",
        oldValue: null,
        newValue: rawReference,
      });

      return new Response("OK", { status: 200 });
    }

    // 5. No reference captured
    // Only mark as missing when enforcement applies
    const shouldMarkMissing =
      config.enforcementMode === "ALL" ||
      (config.enforcementMode === "TAGGED" && customerTagMatch);

    if (shouldMarkMissing) {
      await markMissingReference({
        shopDomain: shop,
        orderId,
        orderGid,
        orderName,
        customerTagMatch,
      });
    }
    // If OPTIONAL and no reference, we do nothing — no noise in the dashboard.

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error(`[orders/create] Unhandled error for shop ${shop}:`, error);
    await markWebhookError({
      shopDomain: shop,
      topic: "orders/create",
      eventId,
      error: error?.message ?? "unknown",
    });
    // Still return 200 to prevent Shopify retry loop on permanent errors.
    // Transient errors (DB down) should return 5xx so Shopify retries.
    // This simple handler returns 200 for all; add retry logic if needed.
    return new Response("Error logged", { status: 200 });
  }
}

/**
 * Determines if enforcement applies to the order's customer.
 *
 * Edge cases handled:
 * - Guest checkout: customer may be null → no tag match possible
 * - OPTIONAL mode: enforcement never applies (field is optional)
 * - ALL mode: always applies
 * - TAGGED mode: only if customer has at least one matching tag
 */
function doesEnforcementApply(config: any, order: any): boolean {
  if (config.enforcementMode === "OPTIONAL") return false;
  if (config.enforcementMode === "ALL") return true;
  if (config.enforcementMode === "TAGGED") {
    const customerTags: string[] = order.customer?.tags
      ?.split(",")
      .map((t: string) => t.trim().toLowerCase()) ?? [];
    const requiredTags: string[] = (config.requiredTags ?? []).map((t: string) =>
      t.trim().toLowerCase()
    );
    return requiredTags.some((tag) => customerTags.includes(tag));
  }
  return false;
}
