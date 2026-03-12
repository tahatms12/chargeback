import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  if (!admin) return new Response();
  return new Response("Actioned", { status: 200 });
};
