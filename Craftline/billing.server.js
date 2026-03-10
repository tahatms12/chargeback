// Implementation choice due to missing source detail:
// Billing check performed against Shopify AppSubscription API.
// Free tier: up to 10 active orders in queue.
// Paid tier: $9/month, unlimited orders. (Source fact)

const PLAN_MONTHLY_PRICE = "9.00";
const PLAN_NAME = "Maker Queue — Unlimited";
const FREE_TIER_ORDER_LIMIT = 10;

/**
 * Returns the currently active app subscription for the shop, or null.
 */
export async function getActiveSubscription(admin) {
  const response = await admin.graphql(`
    query GetSubscription {
      appInstallation {
        activeSubscriptions {
          id
          name
          status
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price { amount currencyCode }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();
  const subs = data?.data?.appInstallation?.activeSubscriptions ?? [];

  return subs.find((s) => s.status === "ACTIVE") ?? null;
}

/**
 * Returns true if the shop is on a paid plan or within the free tier.
 *
 * @param {Object} admin - Shopify admin API client
 * @param {number} activeOrderCount - current number of orders in queue
 */
export async function checkBillingAccess(admin, activeOrderCount) {
  if (activeOrderCount < FREE_TIER_ORDER_LIMIT) {
    return { allowed: true, onFreeTier: true, subscription: null };
  }

  const subscription = await getActiveSubscription(admin);

  if (subscription) {
    return { allowed: true, onFreeTier: false, subscription };
  }

  return { allowed: false, onFreeTier: false, subscription: null };
}

/**
 * Creates a recurring $9/month subscription and returns the confirmation URL.
 * The merchant is redirected to this URL to approve billing.
 *
 * @param {Object} admin - Shopify admin API client
 * @param {string} returnUrl - URL to redirect to after billing approval
 * @returns {string} confirmationUrl
 */
export async function createSubscription(admin, returnUrl) {
  const response = await admin.graphql(
    `
    mutation CreateSubscription($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
      appSubscriptionCreate(
        name: $name
        lineItems: $lineItems
        returnUrl: $returnUrl
        test: $test
      ) {
        appSubscription { id status }
        confirmationUrl
        userErrors { field message }
      }
    }
    `,
    {
      variables: {
        name: PLAN_NAME,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: { amount: PLAN_MONTHLY_PRICE, currencyCode: "USD" },
                interval: "EVERY_30_DAYS",
              },
            },
          },
        ],
        returnUrl,
        // Use test: true in development. Set to false (or omit) for production.
        test: process.env.NODE_ENV !== "production",
      },
    },
  );

  const data = await response.json();
  const result = data?.data?.appSubscriptionCreate;

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e) => e.message).join("; "));
  }

  return result.confirmationUrl;
}

export { FREE_TIER_ORDER_LIMIT };
