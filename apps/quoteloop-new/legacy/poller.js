/**
 * services/poller.js
 *
 * Scheduled background job that polls all installed shops for stale draft orders.
 *
 * Implementation choice: Polls every hour by default (POLL_INTERVAL_CRON env var).
 * Source notes that polling is required because Shopify webhook events for draft
 * orders are limited — specifically, there is no inactivity/age-based webhook.
 *
 * Per poll cycle for each shop:
 *   1. Load offline access token
 *   2. Load shop settings (follow-up threshold, expiry threshold)
 *   3. Fetch all open draft orders from Shopify Admin API
 *   4. For each draft order, evaluate age against thresholds
 *   5. Send follow-up email if threshold reached and not yet sent
 *   6. Mark as expired if expiry threshold reached and not yet expired
 *   7. Send merchant notification if any drafts were expired this cycle
 */

import cron from "node-cron";
import {
  getAllShops,
  getOfflineToken,
  getShopSettings,
  getActionsForDraft,
  recordAction,
} from "../db.js";
import {
  computeAgeInDays,
  evaluateDraftOrder,
  renderTemplate,
  fetchOpenDraftOrders,
  markDraftOrderExpired,
} from "./draftOrders.js";
import { sendFollowUpEmail, sendMerchantExpiryNotification } from "./email.js";

/**
 * Processes all draft orders for a single shop.
 * Returns a summary of actions taken.
 */
export async function processShop(shop) {
  const token = getOfflineToken(shop);
  if (!token) {
    console.warn(`[poller] No offline token for ${shop}, skipping.`);
    return;
  }

  const settings = getShopSettings(shop);
  let openDrafts;

  try {
    openDrafts = await fetchOpenDraftOrders(shop, token);
  } catch (err) {
    console.error(`[poller] Failed to fetch draft orders for ${shop}:`, err.message);
    return;
  }

  const expiredThisCycle = [];

  for (const draft of openDrafts) {
    try {
      const ageInDays = computeAgeInDays(draft.created_at);
      const existingActions = getActionsForDraft(shop, draft.id);

      const { shouldFollowUp, shouldExpire } = evaluateDraftOrder({
        ageInDays,
        followUpDays: settings.follow_up_days,
        expiryDays: settings.expiry_days,
        existingActions,
      });

      if (shouldFollowUp) {
        await handleFollowUp({ shop, token, draft, settings, ageInDays });
      }

      if (shouldExpire) {
        await handleExpiry({ shop, token, draft, ageInDays });
        expiredThisCycle.push({ name: draft.name, id: String(draft.id), ageInDays });
      }
    } catch (err) {
      console.error(
        `[poller] Error processing draft order ${draft.id} for ${shop}:`,
        err.message
      );
      // Continue to next draft rather than aborting the whole shop
    }
  }

  // Notify merchant if drafts were expired this cycle and notification is configured
  if (expiredThisCycle.length > 0 && settings.merchant_notification_email) {
    try {
      // Fetch shop name for the notification email
      const shopName = await fetchShopName(shop, token);
      await sendMerchantExpiryNotification({
        merchantEmail: settings.merchant_notification_email,
        shopName,
        expiredDrafts: expiredThisCycle,
      });
      console.log(
        `[poller] Sent merchant expiry notification for ${shop}: ${expiredThisCycle.length} draft(s) expired.`
      );
    } catch (err) {
      console.error(`[poller] Failed to send merchant notification for ${shop}:`, err.message);
    }
  }

  if (expiredThisCycle.length > 0 || openDrafts.length > 0) {
    console.log(
      `[poller] ${shop}: ${openDrafts.length} open drafts checked. ` +
        `${expiredThisCycle.length} expired this cycle.`
    );
  }
}

async function handleFollowUp({ shop, draft, settings, ageInDays }) {
  const customerEmail = draft.customer?.email || draft.email;
  if (!customerEmail) {
    console.warn(
      `[poller] Draft ${draft.id} (${draft.name}) for ${shop} has no customer email — skipping follow-up.`
    );
    return;
  }

  // We need the shop name for the email template
  const token = getOfflineToken(shop);
  const shopName = await fetchShopName(shop, token);

  const customerName =
    draft.customer
      ? [draft.customer.first_name, draft.customer.last_name].filter(Boolean).join(" ")
      : "";

  const body = renderTemplate(settings.follow_up_email_body, {
    customer_name: customerName,
    draft_order_name: draft.name,
    draft_order_url: draft.invoice_url || "",
    shop_name: shopName,
  });

  const subject = renderTemplate(settings.follow_up_email_subject, {
    customer_name: customerName,
    draft_order_name: draft.name,
    shop_name: shopName,
  });

  await sendFollowUpEmail({ toEmail: customerEmail, subject, bodyText: body });
  recordAction(shop, draft.id, "follow_up_sent");

  console.log(
    `[poller] Sent follow-up email for draft ${draft.name} (${Math.floor(ageInDays)}d old) to ${customerEmail} — ${shop}`
  );
}

async function handleExpiry({ shop, token, draft, ageInDays }) {
  await markDraftOrderExpired(shop, token, draft);
  recordAction(shop, draft.id, "expired");

  console.log(
    `[poller] Expired draft ${draft.name} (${Math.floor(ageInDays)}d old) — ${shop}`
  );
}

/**
 * Fetches the shop name from Shopify Admin API.
 * Cached per poll run via a module-level Map to avoid redundant calls.
 */
const shopNameCache = new Map();

async function fetchShopName(shop, token) {
  if (shopNameCache.has(shop)) return shopNameCache.get(shop);

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": token },
    });
    if (!response.ok) return shop;
    const data = await response.json();
    const name = data.shop?.name || shop;
    shopNameCache.set(shop, name);
    // Clear cache after 1 hour
    setTimeout(() => shopNameCache.delete(shop), 60 * 60 * 1000);
    return name;
  } catch {
    return shop;
  }
}

/**
 * Runs one full poll cycle across all installed shops.
 * Called by the cron job and can be invoked manually for testing.
 */
export async function runPollCycle() {
  const shops = getAllShops();
  if (shops.length === 0) return;

  console.log(`[poller] Poll cycle started — ${shops.length} shop(s) to process.`);
  await Promise.allSettled(shops.map((shop) => processShop(shop)));
  console.log(`[poller] Poll cycle complete.`);
}

/**
 * Starts the cron job.
 * Must be called after initDb() has run.
 */
export function startPoller() {
  const schedule = process.env.POLL_INTERVAL_CRON || "0 * * * *";

  if (!cron.validate(schedule)) {
    console.error(`[poller] Invalid POLL_INTERVAL_CRON: "${schedule}". Poller not started.`);
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      await runPollCycle();
    } catch (err) {
      console.error("[poller] Unhandled error in poll cycle:", err);
    }
  });

  console.log(`[poller] Scheduled with cron: "${schedule}"`);
}
