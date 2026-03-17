import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { moveOrderToStage } from "~/lib/orders.server";
import { getStage } from "~/lib/stages.server";
import { queueEmail, processEmailQueue, renderTemplate } from "~/lib/email.server";

// Shopify metafield namespace/key used to store the production stage on the order
const META_NAMESPACE = "maker_queue";
const META_KEY = "production_stage";

const SET_ORDER_METAFIELD = `
  mutation SetOrderStageMeta($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id key value }
      userErrors { field message }
    }
  }
`;

// Minimal shop name query for email templates
const GET_SHOP_NAME = `
  query GetShopName {
    shop { name email }
  }
`;

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const orderId = formData.get("orderId");
  const newStageId = formData.get("newStageId") || null;

  if (!orderId) {
    return json({ error: "orderId is required" }, { status: 400 });
  }

  // Resolve the new stage (null = unassigned)
  let newStage = null;
  if (newStageId) {
    newStage = await getStage(shop, newStageId);
    if (!newStage) {
      return json({ error: "Stage not found" }, { status: 404 });
    }
  }

  const stageName = newStage?.name ?? null;

  // 1. Update local DB
  const updated = await moveOrderToStage(shop, orderId, newStageId, stageName);
  if (!updated) {
    return json({ error: "Order not found in queue" }, { status: 404 });
  }

  // 2. Set metafield on the Shopify order
  try {
    await admin.graphql(SET_ORDER_METAFIELD, {
      variables: {
        metafields: [
          {
            ownerId: orderId,
            namespace: META_NAMESPACE,
            key: META_KEY,
            value: stageName ?? "",
            type: "single_line_text_field",
          },
        ],
      },
    });
  } catch (err) {
    // Non-fatal: log and continue
    console.error(`Failed to set metafield on ${orderId}:`, err.message);
  }

  // 3. Queue customer email notification if stage has email enabled
  if (
    newStage?.emailEnabled &&
    newStage?.emailSubject &&
    updated.customerEmail
  ) {
    try {
      // Fetch shop name for template rendering
      let shopName = shop;
      try {
        const shopResp = await admin.graphql(GET_SHOP_NAME);
        const shopData = await shopResp.json();
        shopName = shopData?.data?.shop?.name ?? shop;
      } catch (_) {
        // Fallback to domain
      }

      const vars = {
        orderName: updated.orderName,
        customerName: updated.customerName ?? "",
        stageName: newStage.name,
        shopName,
      };

      await queueEmail(shop, {
        orderId: updated.orderId,
        orderName: updated.orderName,
        toEmail: updated.customerEmail,
        toName: updated.customerName ?? null,
        subject: renderTemplate(newStage.emailSubject, vars),
        body: renderTemplate(newStage.emailBody, vars),
      });

      // Process queue asynchronously (fire and catch — does not block response)
      processEmailQueue(shop).catch((err) => {
        console.error("Email queue processing error:", err.message);
      });
    } catch (err) {
      // Non-fatal: email queue failure should not fail the stage move
      console.error("Failed to queue email:", err.message);
    }
  }

  return json({
    ok: true,
    orderId,
    newStageId,
    stageName,
  });
};
