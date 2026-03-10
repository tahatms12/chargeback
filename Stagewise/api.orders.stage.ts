// app/routes/api.orders.stage.ts
// API route: move one or more orders to a production stage.
//
// POST body (FormData):
//   intent: "batchMove"
//   stageId: string
//   moves: JSON string of MoveEntry[]
//
// Effects:
//   1. Upsert OrderStage record for each order
//   2. Apply stage tag to order in Shopify (for visibility in native admin)
//   3. Enqueue customer notification email if stage.sendEmail = true

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";
import { enqueueStageEmail, interpolate } from "../email.server";
import type { EmailTemplateVars } from "../email.server";

interface MoveEntry {
  orderId: string;        // Shopify GID
  orderNumber: string;    // e.g. "#1042"
  customerEmail: string;
  customerName: string;
  itemSummary: string;
}

// Shopify GraphQL mutation: add/remove tags on an order
const ORDER_TAGS_ADD = `#graphql
  mutation tagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

// Tag prefix used to mark production stage on orders in Shopify admin
const TAG_PREFIX = "pq-stage:";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent !== "batchMove") {
    return json({ error: "Unknown intent." }, { status: 400 });
  }

  const stageId = form.get("stageId") as string;
  if (!stageId) return json({ error: "stageId required." }, { status: 400 });

  const stage = await db.productionStage.findFirst({
    where: { id: stageId, shopDomain },
  });
  if (!stage) return json({ error: "Stage not found." }, { status: 404 });

  let moves: MoveEntry[] = [];
  try {
    moves = JSON.parse((form.get("moves") as string) || "[]");
  } catch {
    return json({ error: "Invalid moves payload." }, { status: 400 });
  }

  if (moves.length === 0) {
    return json({ error: "No orders to move." }, { status: 400 });
  }

  // Fetch shop name once for email template interpolation
  let shopName = shopDomain.replace(".myshopify.com", "");
  try {
    const shopRes = await admin.graphql(`#graphql
      query { shop { name } }
    `);
    const shopData = await shopRes.json();
    shopName = shopData.data?.shop?.name ?? shopName;
  } catch {
    // Non-fatal — shopName fallback is already set
  }

  const errors: string[] = [];

  for (const move of moves) {
    try {
      // 1. Upsert OrderStage in DB
      await db.orderStage.upsert({
        where: { shopDomain_orderId: { shopDomain, orderId: move.orderId } },
        update: {
          stageId,
          orderNumber: move.orderNumber,
          customerEmail: move.customerEmail || null,
          customerName: move.customerName || null,
          itemSummary: move.itemSummary || null,
          movedAt: new Date(),
        },
        create: {
          shopDomain,
          orderId: move.orderId,
          orderNumber: move.orderNumber,
          customerEmail: move.customerEmail || null,
          customerName: move.customerName || null,
          itemSummary: move.itemSummary || null,
          stageId,
        },
      });

      // 2. Apply stage tag to the Shopify order
      // Tag format: "pq-stage:<stage name>" — visible in Shopify admin order list
      const tagValue = `${TAG_PREFIX}${stage.name}`;
      try {
        await admin.graphql(ORDER_TAGS_ADD, {
          variables: { id: move.orderId, tags: [tagValue] },
        });
      } catch (tagErr) {
        // Tag failure is non-fatal; DB record is source of truth
        console.warn(`[stage] Failed to apply tag to ${move.orderId}:`, tagErr);
      }

      // 3. Enqueue notification email if stage has sendEmail=true
      if (stage.sendEmail && move.customerEmail) {
        const vars: EmailTemplateVars = {
          orderNumber: move.orderNumber,
          customerName: move.customerName || "Customer",
          stageName: stage.name,
          shopName,
          shopDomain,
        };

        const subject = interpolate(
          stage.emailSubject ||
            "Update on your order {{orderNumber}}",
          vars
        );
        const body = interpolate(
          stage.emailBody ||
            `<p>Hi {{customerName}},</p><p>Your order <strong>{{orderNumber}}</strong> has moved to the <em>{{stageName}}</em> stage.</p><p>Thank you,<br>{{shopName}}</p>`,
          vars
        );

        await enqueueStageEmail({
          shopDomain,
          orderId: move.orderId,
          orderNumber: move.orderNumber,
          customerEmail: move.customerEmail,
          subject,
          body,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${move.orderNumber}: ${msg}`);
      console.error(`[stage] Failed to move order ${move.orderId}:`, err);
    }
  }

  if (errors.length > 0) {
    return json({
      ok: false,
      moved: moves.length - errors.length,
      errors,
      error: `${errors.length} order(s) failed: ${errors.slice(0, 3).join("; ")}`,
    });
  }

  return json({ ok: true, moved: moves.length });
};
