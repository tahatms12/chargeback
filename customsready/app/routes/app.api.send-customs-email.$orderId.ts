// app/routes/app.api.send-customs-email.$orderId.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

const ORDER_SEND_EMAIL_MUTATION = `#graphql
  mutation orderSendEmail($input: OrderSendEmailInput!) {
    orderSendEmail(input: $input) {
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

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const orderId = params.orderId;

  if (!orderId) {
    return json({ success: false, error: "Missing order ID" }, { status: 400 });
  }

  const gid = `gid://shopify/Order/${orderId}`;

  try {
    const response = await admin.graphql(ORDER_SEND_EMAIL_MUTATION, {
      variables: {
        input: {
          id: gid,
          customMessage:
            "Your order has been reviewed for international customs. " +
            "All required customs documentation (Commercial Invoice, CN22/CN23) has been prepared " +
            "by our team using CustomsReady Lite. Please keep this email and your order confirmation " +
            "for any customs queries during delivery.",
        },
      },
    });

    const result = (await response.json()) as any;
    const userErrors = result?.data?.orderSendEmail?.userErrors ?? [];

    if (userErrors.length > 0) {
      const errorMsg = userErrors.map((e: any) => e.message).join("; ");
      console.error("[send-customs-email] Shopify userErrors:", errorMsg);
      return json({ success: false, error: errorMsg }, { status: 422 });
    }

    const orderName = result?.data?.orderSendEmail?.order?.name ?? orderId;
    const customerEmail = result?.data?.orderSendEmail?.order?.email ?? "";
    console.info(`[send-customs-email] Email sent for order ${orderName} to ${customerEmail}`);

    return json({ success: true, orderName, customerEmail });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-customs-email] Failed:", msg);
    return json({ success: false, error: msg }, { status: 500 });
  }
}
