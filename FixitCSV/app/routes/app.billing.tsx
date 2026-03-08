import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { PAID_PLAN_NAME } from "~/lib/shopify-csv-spec";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const check = await billing.check({ plans: [PAID_PLAN_NAME], isTest: process.env.NODE_ENV !== "production" });
  if (check.hasActivePayment) return redirect("/app");

  await billing.request({
    plan: PAID_PLAN_NAME,
    isTest: process.env.NODE_ENV !== "production",
    returnUrl: `${process.env.SHOPIFY_APP_URL}/app`
  });
  return null;
};
