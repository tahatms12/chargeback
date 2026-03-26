import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { renderToBuffer } from "~/pdf/pdfUtils";
import { CommercialInvoiceDoc } from "~/pdf/CommercialInvoice";
import { db } from "~/db.server";
import { fetchAndMapOrder } from "~/lib/orderMapper";
import React from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    throw new Response("Missing order ID", { status: 400 });
  }

  const invoiceData = await fetchAndMapOrder(admin, orderId);
  
  // Record it in DB
  await db.invoiceRecord.create({
    data: {
      shopDomain: session.shop,
      orderId: orderId,
      invoiceType: "COMMERCIAL_INVOICE",
      totalValue: invoiceData.totalDeclaredValue,
      currency: invoiceData.currency,
      destinationCountry: invoiceData.buyerDetails.country,
    }
  });

  const pdfBuffer = await renderToBuffer(React.createElement(CommercialInvoiceDoc, { data: invoiceData }));

  return new Response(pdfBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Commercial_Invoice_${orderId}.pdf"`,
    },
  });
}
