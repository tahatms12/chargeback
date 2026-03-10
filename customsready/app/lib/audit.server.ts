// app/lib/audit.server.ts
import type { Prisma } from "@prisma/client";
import { db } from "../db.server";
import type { ProductNode, VariantNode, OrderNode, OrderLineItemNode } from "./graphql.server";
import { logger } from "./logger.server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CustomsStatus = "complete" | "missing_hs" | "missing_coo" | "missing_both";
export type OrderReadiness = "complete" | "partial" | "not_ready";

export interface VariantAuditResult {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string | null;
  vendor: string;
  productType: string;
  inventoryItemId: string | null;
  hasHsCode: boolean;
  hasCoo: boolean;
  harmonizedSystemCode: string | null;
  countryCodeOfOrigin: string | null;
  status: CustomsStatus;
  skipped: boolean;
}

export interface LineReadiness {
  lineItemId: string;
  title: string;
  hasHsCode: boolean;
  hasCoo: boolean;
  isCustomItem: boolean; // variant is null
  status: CustomsStatus;
}

export interface OrderReadinessResult {
  orderId: string;
  orderName: string;
  createdAt: string;
  currencyCode: string;
  totalAmount: string;
  shippingCountryCode: string | null;
  shippingCountry: string | null;
  readiness: OrderReadiness;
  lines: LineReadiness[];
}

// ─── Classification ───────────────────────────────────────────────────────────

export function classifyVariant(variant: VariantNode): CustomsStatus {
  const hs = variant.inventoryItem?.harmonizedSystemCode;
  const coo = variant.inventoryItem?.countryCodeOfOrigin;
  const hasHs = !!(hs && hs.trim().length > 0);
  const hasCo = !!(coo && coo.trim().length > 0);

  if (hasHs && hasCo) return "complete";
  if (!hasHs && !hasCo) return "missing_both";
  if (!hasHs) return "missing_hs";
  return "missing_coo";
}

export function classifyLineItem(line: OrderLineItemNode): LineReadiness {
  const isCustomItem = line.variant === null;

  if (isCustomItem) {
    return {
      lineItemId: line.id,
      title: line.title,
      hasHsCode: false,
      hasCoo: false,
      isCustomItem: true,
      status: "missing_both",
    };
  }

  const hs = line.variant?.inventoryItem?.harmonizedSystemCode;
  const coo = line.variant?.inventoryItem?.countryCodeOfOrigin;
  const hasHsCode = !!(hs && hs.trim().length > 0);
  const hasCoo = !!(coo && coo.trim().length > 0);

  let status: CustomsStatus;
  if (hasHsCode && hasCoo) status = "complete";
  else if (!hasHsCode && !hasCoo) status = "missing_both";
  else if (!hasHsCode) status = "missing_hs";
  else status = "missing_coo";

  return {
    lineItemId: line.id,
    title: line.title,
    hasHsCode,
    hasCoo,
    isCustomItem: false,
    status,
  };
}

export function computeOrderReadiness(lines: LineReadiness[]): OrderReadiness {
  if (lines.length === 0) return "complete";

  const allComplete = lines.every((l) => l.status === "complete");
  if (allComplete) return "complete";

  const allIncomplete = lines.every((l) => l.status === "missing_both");
  if (allIncomplete) return "not_ready";

  return "partial";
}

export function classifyOrder(order: OrderNode): OrderReadinessResult {
  const lines = order.lineItems.nodes.map(classifyLineItem);
  const readiness = computeOrderReadiness(lines);

  return {
    orderId: order.id,
    orderName: order.name,
    createdAt: order.createdAt,
    currencyCode: order.currencyCode,
    totalAmount: order.totalPriceSet.shopMoney.amount,
    shippingCountryCode: order.shippingAddress?.countryCode ?? null,
    shippingCountry: order.shippingAddress?.country ?? null,
    readiness,
    lines,
  };
}

// ─── DB upsert helpers ────────────────────────────────────────────────────────

export function buildAuditRecord(
  shopDomain: string,
  product: ProductNode,
  variant: VariantNode,
  status: CustomsStatus
): Prisma.ProductAuditRecordUncheckedCreateInput {
  return {
    shopDomain,
    productId: product.id,
    variantId: variant.id,
    inventoryItemId: variant.inventoryItem?.id ?? null,
    productTitle: product.title,
    variantTitle: variant.title || null,
    vendor: product.vendor || null,
    productType: product.productType || null,
    hasHsCode: status !== "missing_hs" && status !== "missing_both",
    hasCoo: status !== "missing_coo" && status !== "missing_both",
    harmonizedSystemCode: variant.inventoryItem?.harmonizedSystemCode ?? null,
    countryCodeOfOrigin: variant.inventoryItem?.countryCodeOfOrigin ?? null,
    lastAuditedAt: new Date(),
  };
}

/** Batch upsert audit records. Uses chunking for large catalogs. */
export async function upsertAuditRecords(
  shopDomain: string,
  records: Prisma.ProductAuditRecordUncheckedCreateInput[]
): Promise<void> {
  const CHUNK = 100;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((r) =>
        db.productAuditRecord.upsert({
          where: {
            shopDomain_variantId: {
              shopDomain,
              variantId: r.variantId,
            },
          },
          create: r,
          update: {
            productId: r.productId,
            inventoryItemId: r.inventoryItemId,
            productTitle: r.productTitle,
            variantTitle: r.variantTitle,
            vendor: r.vendor,
            productType: r.productType,
            hasHsCode: r.hasHsCode as boolean,
            hasCoo: r.hasCoo as boolean,
            harmonizedSystemCode: r.harmonizedSystemCode,
            countryCodeOfOrigin: r.countryCodeOfOrigin,
            lastAuditedAt: r.lastAuditedAt as Date,
            // Preserve fixStatus on update
          },
        })
      )
    );
  }
}

/** Delete audit records for variants that no longer exist on a product. */
export async function pruneStaleVariants(
  shopDomain: string,
  productId: string,
  currentVariantIds: string[]
): Promise<void> {
  await db.productAuditRecord.deleteMany({
    where: {
      shopDomain,
      productId,
      variantId: { notIn: currentVariantIds },
    },
  });
}

/** Aggregate gap counts for a shop. */
export async function getGapSummary(shopDomain: string) {
  const [total, missingHs, missingCoo, missingBoth] = await Promise.all([
    db.productAuditRecord.count({ where: { shopDomain } }),
    db.productAuditRecord.count({ where: { shopDomain, hasHsCode: false, hasCoo: true } }),
    db.productAuditRecord.count({ where: { shopDomain, hasCoo: false, hasHsCode: true } }),
    db.productAuditRecord.count({ where: { shopDomain, hasHsCode: false, hasCoo: false } }),
  ]);

  const complete = total - missingHs - missingCoo - missingBoth;
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 100;

  return { total, complete, missingHs, missingCoo, missingBoth, percentage };
}

/** Get the most recent completed AuditRun for a shop. */
export async function getLatestAuditRun(shopDomain: string) {
  return db.auditRun.findFirst({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
  });
}

/** Check if an exempt tag list means a product should be skipped. */
export function isExempt(productTags: string[], exemptTags: string[]): boolean {
  if (!exemptTags.length) return false;
  const lower = productTags.map((t) => t.toLowerCase().trim());
  return exemptTags.some((et) => lower.includes(et.toLowerCase().trim()));
}

/** Update orderCount30d for variants that appeared in recent orders. */
export async function updateOrderCounts(
  shopDomain: string,
  variantOrderCounts: Map<string, number>
): Promise<void> {
  const updates = Array.from(variantOrderCounts.entries());
  await Promise.all(
    updates.map(([variantId, count]) =>
      db.productAuditRecord.updateMany({
        where: { shopDomain, variantId },
        data: { orderCount30d: count },
      })
    )
  );
  logger.info({ shopDomain, updated: updates.length }, "Updated order counts for audit records");
}
