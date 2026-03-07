// app/routes/api.product-audit.$productId.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { toGid } from "~/lib/graphql.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const { productId } = params;

  if (!productId) {
    return new Response("Missing product ID", { status: 400 });
  }

  const productGid = productId.startsWith("gid://")
    ? productId
    : toGid("Product", productId);

  const records = await db.productAuditRecord.findMany({
    where: { shopDomain, productId: productGid },
    orderBy: { variantTitle: "asc" },
  });

  if (records.length === 0) {
    return Response.json(null, { status: 404 });
  }

  const latestAudit = records.reduce((latest, r) =>
    r.lastAuditedAt > latest.lastAuditedAt ? r : latest
  );

  return Response.json({
    productId: productGid,
    productTitle: records[0].productTitle,
    lastAuditedAt: latestAudit.lastAuditedAt,
    variants: records.map((r) => ({
      variantId: r.variantId,
      variantTitle: r.variantTitle,
      hasHsCode: r.hasHsCode,
      hasCoo: r.hasCoo,
      harmonizedSystemCode: r.harmonizedSystemCode,
      countryCodeOfOrigin: r.countryCodeOfOrigin,
      fixStatus: r.fixStatus,
    })),
  });
};
