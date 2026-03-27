import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

const CREATE_DRAFT_ORDER_MUTATION = `#graphql
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const response = await admin.graphql(CREATE_DRAFT_ORDER_MUTATION, {
      variables: {
        input: {
          tags: ["CustomsReady_Manual"],
          lineItems: [
            {
              title: "International Shipment (Placeholder)",
              originalUnitPrice: "1.00",
              quantity: 1,
            },
          ],
        },
      },
    });

    const result = (await response.json()) as any;
    const userErrors = result?.data?.draftOrderCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      const errorMsg = userErrors.map((e: any) => e.message).join("; ");
      console.error("[create-draft-order] Shopify errors:", errorMsg);
      return json({ success: false, error: errorMsg }, { status: 422 });
    }

    const draftOrderId = result?.data?.draftOrderCreate?.draftOrder?.id?.split("/").pop();

    if (!draftOrderId) {
      return json({ success: false, error: "Failed to create draft order" }, { status: 500 });
    }

    return json({ success: true, orderId: `draft_${draftOrderId}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-draft-order] Fatal:", msg);
    return json({ success: false, error: msg }, { status: 500 });
  }
}
