import prisma from '../db.server';

/**
 * Returns all active queue orders for the shop, grouped by stageId.
 * Orders with stageId=null are in the "Unassigned" bucket.
 *
 * @returns {Object} { [stageId|"unassigned"]: OrderStage[] }
 */
export async function getQueueByStage(shop) {
  const orders = await prisma.orderStage.findMany({
    where: { shop },
    orderBy: { movedAt: "asc" },
  });

  const grouped = {};
  for (const order of orders) {
    const key = order.stageId ?? "unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(order);
  }

  return grouped;
}

/**
 * Returns count of active orders in the queue (for billing gate check).
 */
export async function getActiveOrderCount(shop) {
  return prisma.orderStage.count({ where: { shop } });
}

/**
 * Adds an order to the production queue with an optional initial stage.
 * Idempotent — if the order is already in the queue, updates its stage.
 */
export async function addOrderToQueue(shop, orderData, stageId, stageName) {
  const { orderId, orderName, customerEmail, customerName, productSummary } = orderData;

  return prisma.orderStage.upsert({
    where: { shop_orderId: { shop, orderId } },
    create: {
      shop,
      orderId,
      orderName,
      customerEmail: customerEmail ?? null,
      customerName: customerName ?? null,
      productSummary: productSummary ?? null,
      stageId: stageId ?? null,
      stageName: stageName ?? null,
      movedAt: new Date(),
    },
    update: {
      stageId: stageId ?? null,
      stageName: stageName ?? null,
      movedAt: new Date(),
    },
  });
}

/**
 * Moves an existing queue order to a new stage.
 * Returns the updated record, or null if the order isn't in the queue.
 */
export async function moveOrderToStage(shop, orderId, stageId, stageName) {
  const existing = await prisma.orderStage.findUnique({
    where: { shop_orderId: { shop, orderId } },
  });

  if (!existing) return null;

  return prisma.orderStage.update({
    where: { shop_orderId: { shop, orderId } },
    data: {
      stageId: stageId ?? null,
      stageName: stageName ?? null,
      movedAt: new Date(),
    },
  });
}

/**
 * Removes an order from the production queue (called on fulfillment or cancel).
 */
export async function removeOrderFromQueue(shop, orderId) {
  return prisma.orderStage.deleteMany({
    where: { shop, orderId },
  });
}

/**
 * Returns orders in the queue for a given stage.
 */
export async function getOrdersByStage(shop, stageId) {
  return prisma.orderStage.findMany({
    where: { shop, stageId },
    orderBy: { movedAt: "asc" },
  });
}

/**
 * Builds a compact product summary string from Shopify line items.
 * e.g. "Silver Ring x1, Leather Strap x2"
 */
export function buildProductSummary(lineItems) {
  return lineItems
    .slice(0, 3)
    .map((li) => `${li.title}${li.quantity > 1 ? ` x${li.quantity}` : ""}`)
    .join(", ");
}
