import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin && session) {
    return new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      return new Response("Noted", { status: 200 });
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
