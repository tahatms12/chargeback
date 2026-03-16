import prisma from "../db.server.js";

// Default stages seeded for new shops
const DEFAULT_STAGES = [
  { name: "Order Received", position: 0 },
  { name: "Materials Sourced", position: 1 },
  { name: "In Production", position: 2 },
  { name: "Quality Check", position: 3 },
  { name: "Ready to Ship", position: 4 },
];

/**
 * Returns all stages for the shop, sorted by position.
 * Seeds defaults if the shop has no stages yet.
 */
export async function getStages(shop) {
  const existing = await prisma.stage.findMany({
    where: { shop },
    orderBy: { position: "asc" },
  });

  if (existing.length > 0) return existing;

  // Seed defaults on first access
  await prisma.stage.createMany({
    data: DEFAULT_STAGES.map((s) => ({
      ...s,
      shop,
      emailSubject: `Your order {{order_name}} is now: ${s.name}`,
      emailBody: `Hi {{customer_name}},\n\nYour order {{order_name}} has moved to the "${s.name}" stage.\n\nWe'll keep you updated as your order progresses.\n\nThank you,\n{{shop_name}}`,
    })),
  });

  return prisma.stage.findMany({
    where: { shop },
    orderBy: { position: "asc" },
  });
}

/**
 * Returns a single stage by id, scoped to shop.
 */
export async function getStage(shop, id) {
  return prisma.stage.findFirst({ where: { shop, id } });
}

/**
 * Creates a new stage at the end of the current list.
 */
export async function createStage(shop, { name, emailEnabled = true, emailSubject = "", emailBody = "" }) {
  const last = await prisma.stage.findFirst({
    where: { shop },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = last ? last.position + 1 : 0;

  return prisma.stage.create({
    data: {
      shop,
      name: name.trim(),
      position,
      emailEnabled,
      emailSubject,
      emailBody,
    },
  });
}

/**
 * Updates name and email settings for a stage.
 */
export async function updateStage(shop, id, { name, emailEnabled, emailSubject, emailBody }) {
  return prisma.stage.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(emailEnabled !== undefined && { emailEnabled }),
      ...(emailSubject !== undefined && { emailSubject }),
      ...(emailBody !== undefined && { emailBody }),
    },
  });
}

/**
 * Deletes a stage and moves orders in that stage to unassigned (stageId = null).
 */
export async function deleteStage(shop, id) {
  await prisma.orderStage.updateMany({
    where: { shop, stageId: id },
    data: { stageId: null, stageName: null },
  });

  return prisma.stage.delete({ where: { id } });
}

/**
 * Reorders stages given an array of ids in the new desired order.
 */
export async function reorderStages(shop, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    prisma.stage.updateMany({
      where: { shop, id },
      data: { position: index },
    })
  );

  return prisma.$transaction(updates);
}
