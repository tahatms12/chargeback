// app/lib/billing.server.ts
import { db } from "../db.server";
import { logger } from "./logger.server";

type BillingContext = {
  require: (opts: {
    plans: string[];
    onFailure: () => Promise<void>;
  }) => Promise<void>;
  check: (opts: {
    plans: string[];
    isTest: boolean;
  }) => Promise<{ hasActivePayment: boolean }>;
  request: (opts: { plan: string; isTest: boolean }) => Promise<void>;
};

/**
 * Require an active billing subscription.
 * Redirects to Shopify billing approval if no active plan found.
 */
export async function requireBilling(
  billing: BillingContext,
  shopDomain: string
): Promise<void> {
  try {
    await billing.require({
      plans: ["CustomsReady Lite Monthly"],
      onFailure: async () => {
        await billing.request({
          plan: "CustomsReady Lite Monthly",
          isTest: process.env.NODE_ENV !== "production",
        });
      },
    });

    await db.installation.updateMany({
      where: { shopDomain },
      data: { billingStatus: "active" },
    });
  } catch (err) {
    logger.warn({ shopDomain, error: String(err) }, "Billing gate triggered");
    throw err;
  }
}

export async function checkBillingActive(billing: BillingContext): Promise<boolean> {
  try {
    const status = await billing.check({
      plans: ["CustomsReady Lite Monthly"],
      isTest: process.env.NODE_ENV !== "production",
    });
    return status.hasActivePayment;
  } catch {
    return false;
  }
}
