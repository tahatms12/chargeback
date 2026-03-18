import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { renderToBuffer } from "~/pdf/pdfUtils";
import { CN22Doc } from "~/pdf/CN22";
import { CN23Doc } from "~/pdf/CN23";
import { db } from "~/db.server";
import { fetchAndMapOrder } from "~/lib/orderMapper";
import React from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    throw new Response("Missing order ID", { status: 400 });
  }

  const data = await fetchAndMapOrder(admin, orderId);
  
  const isCN23 = data.totalDeclaredValue > 400;

  // Record it in DB
  await db.invoiceRecord.create({
    data: {
      shopDomain: session.shop,
      orderId: orderId,
      invoiceType: isCN23 ? "CN23" : "CN22",
      totalValue: data.totalDeclaredValue,
      currency: data.currency,
      destinationCountry: data.buyerDetails.country,
    }
  });

  const DocComponent = isCN23 ? CN23Doc : CN22Doc;
  const pdfBuffer = await renderToBuffer(React.createElement(DocComponent, { data }));

  return new Response(pdfBuffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isCN23 ? 'CN23' : 'CN22'}_${orderId}.pdf"`,
    },
  });
}
