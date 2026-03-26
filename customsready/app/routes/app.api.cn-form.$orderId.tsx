import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { renderToBuffer } from "~/pdf/pdfUtils";
import { CN22Doc } from "~/pdf/CN22";
import { CN23Doc } from "~/pdf/CN23";
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
  const data = payload.invoiceData as CommercialInvoiceData;

  if (!data) {
    return json({ error: "Missing invoiceData payload" }, { status: 400 });
  }
  
  const isCN23 = data.totalDeclaredValue > 400;

  // Record it in DB — fields match InvoiceRecord model in schema.prisma
  try {
    await db.invoiceRecord.create({
      data: {
        shopDomain: session.shop,
        orderId: orderId,
        orderName: data.orderName,
        declaredValue: data.totalDeclaredValue,
        currency: data.currency,
        documentType: isCN23 ? "CN23" : "CN22",
      }
    });
  } catch (dbErr) {
    // Non-fatal — log but don't fail the PDF download
    console.warn('[cn-form] DB record failed:', dbErr);
  }

  const DocComponent = isCN23 ? CN23Doc : CN22Doc;
  const pdfBuffer = await renderToBuffer(React.createElement(DocComponent, { data }));
  const pdfBase64 = pdfBuffer.toString("base64");

  return json({
    pdfBase64,
    filename: `${isCN23 ? 'CN23' : 'CN22'}_${orderId.replace('draft_', '')}.pdf`
  });
}
