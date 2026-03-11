/**
 * services/draftOrders.js
 *
 * Core business logic for the draft order lifecycle.
 *
 * This module is the highest-risk logic in the app:
 *   - Evaluates draft order age against merchant-configured thresholds
 *   - Decides which action (if any) to take: follow_up or expire
 *   - Calls Shopify Admin API to expire (tag) a draft order
 *
 * All side effects (email sending, DB writes) are the caller's responsibility.
 * Pure evaluation functions are exported for testability.
 */

/**
 * Computes the age of a draft order in fractional days from its created_at timestamp.
 *
 * @param {string} createdAtISO - ISO 8601 string from Shopify (e.g. "2024-01-15T10:00:00-05:00")
 * @param {Date} [now]          - Reference point for age calculation (defaults to Date.now())
 * @returns {number}            - Age in fractional days (>= 0)
 */
export function computeAgeInDays(createdAtISO, now = new Date()) {
  const created = new Date(createdAtISO);
  if (isNaN(created.getTime())) {
    throw new Error(`Invalid created_at value: ${createdAtISO}`);
  }
  const msElapsed = now.getTime() - created.getTime();
  return Math.max(0, msElapsed / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates a single draft order against the shop's configured thresholds and
 * the set of actions already recorded for this draft.
 *
 * Rules (source-defined):
 *   1. If age >= follow_up_days AND follow_up not yet sent AND draft not yet expired → send follow_up
 *   2. If age >= expiry_days AND draft not yet expired → expire
 *
 * Note: expiry check does NOT require a prior follow-up to have been sent.
 * A draft that jumps straight past both thresholds will be expired directly.
 *
 * @param {object} params
 * @param {number}   params.ageInDays      - Current age of the draft in days
 * @param {number}   params.followUpDays   - Threshold from shop settings
 * @param {number}   params.expiryDays     - Threshold from shop settings
 * @param {string[]} params.existingActions - Already-recorded action_type values for this draft
 *
 * @returns {{ shouldFollowUp: boolean, shouldExpire: boolean }}
 */
export function evaluateDraftOrder({ ageInDays, followUpDays, expiryDays, existingActions }) {
  const hasFollowUp = existingActions.includes("follow_up_sent");
  const hasExpired  = existingActions.includes("expired");

  if (hasExpired) {
    // Already fully processed — nothing to do
    return { shouldFollowUp: false, shouldExpire: false };
  }

  const shouldExpire    = ageInDays >= expiryDays;
  // Only send follow-up if the draft hasn't yet reached expiry threshold
  const shouldFollowUp  = !hasFollowUp && ageInDays >= followUpDays && !shouldExpire;

  return { shouldFollowUp, shouldExpire };
}

/**
 * Validates that shop settings are internally consistent.
 * Returns an array of validation error strings (empty = valid).
 *
 * @param {object} settings
 * @param {number} settings.follow_up_days
 * @param {number} settings.expiry_days
 * @returns {string[]}
 */
export function validateSettings({ follow_up_days, expiry_days }) {
  const errors = [];

  if (!Number.isInteger(follow_up_days) || follow_up_days < 1) {
    errors.push("follow_up_days must be a positive integer.");
  }
  if (!Number.isInteger(expiry_days) || expiry_days < 1) {
    errors.push("expiry_days must be a positive integer.");
  }
  if (Number.isInteger(follow_up_days) && Number.isInteger(expiry_days)) {
    if (expiry_days <= follow_up_days) {
      errors.push("expiry_days must be greater than follow_up_days.");
    }
  }

  return errors;
}

/**
 * Renders an email template by substituting {{variable}} tokens.
 *
 * Available tokens:
 *   {{customer_name}}   - Customer's full name or "Valued Customer" if unknown
 *   {{draft_order_name}} - Draft order name (e.g. "#D1001")
 *   {{draft_order_url}}  - Invoice URL for the customer to view the draft
 *   {{shop_name}}        - Shop name
 *
 * @param {string} template
 * @param {object} vars
 * @returns {string}
 */
export function renderTemplate(template, vars) {
  return template
    .replace(/\{\{customer_name\}\}/g,    vars.customer_name    || "Valued Customer")
    .replace(/\{\{draft_order_name\}\}/g, vars.draft_order_name || "")
    .replace(/\{\{draft_order_url\}\}/g,  vars.draft_order_url  || "")
    .replace(/\{\{shop_name\}\}/g,        vars.shop_name        || "");
}

// ---------------------------------------------------------------------------
// Shopify Admin API helpers
// ---------------------------------------------------------------------------

/**
 * Fetches all open draft orders for a shop using the Admin REST API.
 * Handles pagination via the `link` header to fetch all pages.
 *
 * @param {string} shop  - Shop domain (e.g. "mystore.myshopify.com")
 * @param {string} token - Offline access token
 * @returns {Promise<object[]>} - Array of draft order objects
 */
export async function fetchOpenDraftOrders(shop, token) {
  const allDrafts = [];
  let url = `https://${shop}/admin/api/2024-01/draft_orders.json?status=open&limit=250`;

  while (url) {
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Shopify API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    allDrafts.push(...(data.draft_orders || []));

    // Follow pagination links if present
    const linkHeader = response.headers.get("link");
    url = parseLinkHeaderNext(linkHeader);
  }

  return allDrafts;
}

/**
 * Marks a draft order as expired by adding the "expired" tag and a note.
 * Does NOT delete the draft — the merchant can still see it in admin.
 *
 * @param {string} shop
 * @param {string} token
 * @param {object} draftOrder - The full draft order object from Shopify
 * @returns {Promise<void>}
 */
export async function markDraftOrderExpired(shop, token, draftOrder) {
  const existingTags = draftOrder.tags
    ? draftOrder.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!existingTags.includes("expired")) {
    existingTags.push("expired");
  }

  const existingNote = draftOrder.note || "";
  const expiryNote = `[Draft Order Nudge] Marked as expired on ${new Date().toISOString().split("T")[0]}.`;
  const newNote = existingNote
    ? `${existingNote}\n\n${expiryNote}`
    : expiryNote;

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/draft_orders/${draftOrder.id}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        draft_order: {
          id: draftOrder.id,
          tags: existingTags.join(", "),
          note: newNote,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to update draft order ${draftOrder.id}: ${response.status} ${body}`
    );
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses the `link` header from Shopify pagination and returns the next page URL.
 * Returns null if there is no next page.
 *
 * Example header:
 *   <https://...?page_info=abc>; rel="next", <https://...?page_info=xyz>; rel="previous"
 */
function parseLinkHeaderNext(linkHeader) {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}
