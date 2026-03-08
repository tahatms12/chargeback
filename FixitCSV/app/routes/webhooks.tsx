import type { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  if (topic === "APP_UNINSTALLED") {
    await db.session.deleteMany({ where: { shop } });
    await db.usageRecord.deleteMany({ where: { shop } });
  }
  return new Response(null, { status: 200 });
};
