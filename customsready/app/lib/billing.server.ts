// app/lib/billing.server.ts
import { db } from "../db.server";
import { logger } from "./logger.server";
import { PLAN_NAME } from "~/shopify.server";

/**
 * Require an active billing subscription.
 * Redirects to Shopify billing approval if no active plan found.
 */
export async function requireBilling(
  billing: any,
  shopDomain: string
): Promise<void> {
  const isTest = process.env.NODE_ENV !== "production";
  
  // billing.require automatically throws a redirect Response if the plan is not active.
  const billingCheck = await billing.require({
    plans: [PLAN_NAME],
    isTest: isTest,
    onFailure: async () => {
      // Sometimes billing.require needs explicit onFailure to redirect
      await billing.request({
        plan: PLAN_NAME,
        isTest: isTest,
      });
    },
  });

  // If this line is reached, billing is active.
  try {
    await db.installation.updateMany({
      where: { shopDomain },
      data: { billingStatus: "active" },
    });
  } catch (err) {
    logger.error({ shopDomain, error: String(err) }, "Failed to update billing status");
  }
}

export async function checkBillingActive(billing: any): Promise<boolean> {
  try {
    const status = await billing.check({
      plans: [PLAN_NAME],
      isTest: process.env.NODE_ENV !== "production",
    });
    return status.hasActivePayment;
  } catch {
    return false;
  }
}
