import { db } from "~/db.server";

export async function getUsageForMonth(shop: string, month: string) {
  const rec = await db.usageRecord.findUnique({ where: { shop_month: { shop, month } } });
  return rec?.rowsUsed ?? 0;
}

export async function incrementUsage(shop: string, month: string, rows: number) {
  await db.usageRecord.upsert({
    where: { shop_month: { shop, month } },
    create: { shop, month, rowsUsed: rows },
    update: { rowsUsed: { increment: rows } }
  });
}
