// app/routes/api.invoice.$orderId.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import {
  executeWithThrottling,
  ORDER_FOR_INVOICE_QUERY,
  toGid,
  type OrderNode,
} from "~/lib/graphql.server";
import { buildInvoiceData, generateInvoicePdf } from "~/lib/pdf.server";
import { logger } from "~/lib/logger.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const { orderId } = params;

  if (!orderId) {
    return new Response("Missing order ID", { status: 400 });
  }

  // Accept both numeric and GID formats
  const orderGid = orderId.startsWith("gid://")
    ? orderId
    : toGid("Order", orderId);

  // Fetch order from Shopify (live — buyer address read here, not stored)
  let order: OrderNode;
  try {
    const data = await executeWithThrottling<{ order: OrderNode | null }>(
      admin.graphql,
      ORDER_FOR_INVOICE_QUERY,
      { id: orderGid }
    );

    if (!data.order) {
      return new Response("Order not found", { status: 404 });
    }

    order = data.order;
  } catch (err) {
    logger.error(
      { shopDomain, orderId, error: String(err) },
      "Failed to fetch order for invoice"
    );
    return new Response("Failed to fetch order data", { status: 500 });
  }

  // Load seller configuration
  const config = await db.configuration.findUnique({
    where: { shopDomain },
  });

  // Build invoice data (buyer address used here but NOT persisted)
  const invoiceData = buildInvoiceData(order, config);

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateInvoicePdf(invoiceData);
  } catch (err) {
    logger.error(
      { shopDomain, orderId, error: String(err) },
      "PDF generation failed"
    );
    return new Response("PDF generation failed", { status: 500 });
  }

  // Log the generation event — NO PII stored
  await db.pdfGenerationLog.create({
    data: {
      shopDomain,
      orderId: order.id,
      orderName: order.name,
      completenessStatus: invoiceData.completenessStatus,
      generatedAt: new Date(),
    },
  });

  logger.info(
    {
      shopDomain,
      orderId: order.id,
      orderName: order.name,
      completeness: invoiceData.completenessStatus,
    },
    "Commercial invoice PDF served"
  );

  const url = new URL(request.url);
  const isPrint = url.searchParams.get("print") === "1";
  const disposition = isPrint
    ? `inline; filename="invoice-${order.name.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`
    : `attachment; filename="invoice-${order.name.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "no-store, no-cache",
    },
  });
};

// Also expose order readiness data as JSON for extension polling
export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const { orderId } = params;

  if (!orderId) {
    return new Response("Missing order ID", { status: 400 });
  }

  const orderGid = orderId.startsWith("gid://")
    ? orderId
    : toGid("Order", orderId);

  try {
    const data = await executeWithThrottling<{ order: OrderNode | null }>(
      admin.graphql,
      ORDER_FOR_INVOICE_QUERY,
      { id: orderGid }
    );

    if (!data.order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const { classifyOrder } = await import("~/lib/audit.server");
    const result = classifyOrder(data.order);

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
