// app/billing.server.ts
// Source fact: Free tier = up to 10 active orders. Paid = $9/month unlimited.

import { db } from "./db.server";
import { FREE_ORDER_LIMIT, MONTHLY_PLAN } from './lib/constants';

export { FREE_ORDER_LIMIT, MONTHLY_PLAN };

/**
 * Count active orders in the production queue for a shop.
 * "Active" means any order currently assigned to a stage.
 */
export async function getActiveOrderCount(shopDomain: string): Promise<number> {
  return db.orderStage.count({ where: { shopDomain } });
}

/**
 * Check whether a shop is within the free tier limit.
 */
export async function isWithinFreeTier(shopDomain: string): Promise<boolean> {
  const count = await getActiveOrderCount(shopDomain);
  return count < FREE_ORDER_LIMIT;
}

/**
 * Determine whether billing is required given the current order count
 * and the merchant's current subscription state.
 *
 * Returns:
 *   { required: false }                  — within free tier, no subscription needed
 *   { required: true, atLimit: true }    — at/over limit, subscription needed
 *   { required: false, subscribed: true }— already subscribed
 */
export async function billingStatus(
  shopDomain: string,
  hasActiveSubscription: boolean
): Promise<{
  required: boolean;
  atLimit: boolean;
  subscribed: boolean;
  activeOrderCount: number;
  freeLimit: number;
}> {
  const activeOrderCount = await getActiveOrderCount(shopDomain);
  const atLimit = activeOrderCount >= FREE_ORDER_LIMIT;

  return {
    required: atLimit && !hasActiveSubscription,
    atLimit,
    subscribed: hasActiveSubscription,
    activeOrderCount,
    freeLimit: FREE_ORDER_LIMIT,
  };
}
