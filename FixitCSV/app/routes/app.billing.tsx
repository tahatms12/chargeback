import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { PAID_PLAN_NAME } from "~/lib/shopify-csv-spec";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  await billing.require({
    plans: [PAID_PLAN_NAME as any],
    isTest: true,
    onFailure: async () => billing.request({
      plan: PAID_PLAN_NAME as any,
      isTest: true,
    }),
  });
  return redirect("/app");
};
