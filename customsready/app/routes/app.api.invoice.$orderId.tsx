import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { renderToBuffer } from "~/pdf/pdfUtils";
import { CommercialInvoiceDoc } from "~/pdf/CommercialInvoice";
import { db } from "~/db.server";
import React from "react";
import type { CommercialInvoiceData } from "~/types/customs";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin, session } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    return json({ error: "Missing order ID" }, { status: 400 });
  }

  const payload = await request.json();
  const invoiceDataData = payload.invoiceData as CommercialInvoiceData;

  if (!invoiceDataData) {
    return json({ error: "Missing invoiceData payload" }, { status: 400 });
  }

  // Record it in DB — fields match InvoiceRecord model in schema.prisma
  try {
    await db.invoiceRecord.create({
      data: {
        shopDomain: session.shop,
        orderId: orderId,
        orderName: invoiceDataData.orderName,
        declaredValue: invoiceDataData.totalDeclaredValue,
        currency: invoiceDataData.currency,
        documentType: "COMMERCIAL_INVOICE",
      }
    });
  } catch (dbErr) {
    // Non-fatal — log but don't fail the PDF download
    console.warn('[invoice] DB record failed:', dbErr);
  }

  const pdfBuffer = await renderToBuffer(React.createElement(CommercialInvoiceDoc, { data: invoiceDataData }));
  const pdfBase64 = pdfBuffer.toString("base64");

  return json({
    pdfBase64,
    filename: `Commercial_Invoice_${orderId.replace('draft_', '')}.pdf`
  });
}
