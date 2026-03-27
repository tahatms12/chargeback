// app/routes/app.api.send-customs-email.$orderId.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

const ORDER_INVOICE_SEND_MUTATION = `#graphql
  mutation orderInvoiceSend($id: ID!, $email: EmailInput) {
    orderInvoiceSend(id: $id, email: $email) {
      order {
        id
        name
        email
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DRAFT_SEND_INVOICE_MUTATION = `#graphql
  mutation draftOrderInvoiceSend($id: ID!, $email: EmailInput!) {
    draftOrderInvoiceSend(id: $id, email: $email) {
      draftOrder {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const rawOrderId = params.orderId;

  if (!rawOrderId) {
    return json({ success: false, error: "Missing order ID" }, { status: 400 });
  }

  const { email, name } = await request.json();
  const customMessage = "Your order has been reviewed for international customs. " +
    "All required customs documentation (Commercial Invoice, CN22/CN23) has been prepared " +
    "by our team using CustomsReady AI Powered. Please keep this email and your order confirmation " +
    "for any customs queries during delivery.";

  const isDraft = rawOrderId.startsWith("draft_");
  const numericId = isDraft ? rawOrderId.replace("draft_", "") : rawOrderId;
  const gid = isDraft ? `gid://shopify/DraftOrder/${numericId}` : `gid://shopify/Order/${numericId}`;

  try {
    let result: any;
    
    if (isDraft) {
      if (!email) {
        return json({ success: false, error: "Email is required to send draft invoice" }, { status: 400 });
      }
      const response = await admin.graphql(DRAFT_SEND_INVOICE_MUTATION, {
        variables: {
          id: gid,
          email: { to: email, customMessage },
        },
      });
      result = await response.json();
      
      const userErrors = result?.data?.draftOrderInvoiceSend?.userErrors ?? [];
      if (userErrors.length > 0) {
        throw new Error(userErrors.map((e: any) => e.message).join("; "));
      }
      
      return json({ 
        success: true, 
        orderName: result?.data?.draftOrderInvoiceSend?.draftOrder?.name ?? rawOrderId, 
        customerEmail: email 
      });
      
    } else {
      const emailInput: any = { customMessage };
      if (email) emailInput.to = email;

      const response = await admin.graphql(ORDER_INVOICE_SEND_MUTATION, {
        variables: { id: gid, email: emailInput },
      });
      result = await response.json();

      const userErrors = result?.data?.orderInvoiceSend?.userErrors ?? [];
      if (userErrors.length > 0) {
        throw new Error(userErrors.map((e: any) => e.message).join("; "));
      }

      const orderName = result?.data?.orderInvoiceSend?.order?.name ?? rawOrderId;
      const customerEmail = result?.data?.orderInvoiceSend?.order?.email ?? email;

      return json({ success: true, orderName, customerEmail });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-customs-email] Failed:", msg);
    return json({ success: false, error: msg }, { status: 500 });
  }
}
