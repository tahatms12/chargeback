// app/routes/api.csv-export.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { fromGid } from "~/lib/graphql.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const records = await db.productAuditRecord.findMany({
    where: {
      shopDomain,
      OR: [{ hasHsCode: false }, { hasCoo: false }],
    },
    orderBy: [{ orderCount30d: "desc" }, { productTitle: "asc" }],
  });

  const headers = [
    "Product ID",
    "Variant ID",
    "Product Title",
    "Variant Title",
    "Vendor",
    "Product Type",
    "Has HS Code",
    "HS Code",
    "Has Country of Origin",
    "Country of Origin",
    "Fix Status",
    "Orders (30d)",
    "Last Audited",
    "Shopify Edit URL",
  ];

  const rows = records.map((r) => {
    const productNumId = fromGid(r.productId);
    const editUrl = `https://${shopDomain}/admin/products/${productNumId}`;
    return [
      productNumId,
      fromGid(r.variantId),
      csvEscape(r.productTitle),
      csvEscape(r.variantTitle ?? ""),
      csvEscape(r.vendor ?? ""),
      csvEscape(r.productType ?? ""),
      r.hasHsCode ? "Yes" : "No",
      csvEscape(r.harmonizedSystemCode ?? ""),
      r.hasCoo ? "Yes" : "No",
      csvEscape(r.countryCodeOfOrigin ?? ""),
      r.fixStatus,
      String(r.orderCount30d),
      r.lastAuditedAt.toISOString(),
      editUrl,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customsready-gaps-${new Date().toISOString().split("T")[0]}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
