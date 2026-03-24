// app/lib/graphql.server.ts
import { logger } from "./logger.server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphQLThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

export interface GraphQLCostExtension {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: GraphQLThrottleStatus;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// InventoryItem customs fields
export interface InventoryItemCustoms {
  id: string;
  harmonizedSystemCode: string | null;
  countryCodeOfOrigin: string | null;
}

export interface VariantNode {
  id: string;
  title: string;
  price: string;
  weight: number | null;
  inventoryItem: InventoryItemCustoms | null;
}

export interface ProductNode {
  id: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  variants: {
    nodes: VariantNode[];
  };
}

export interface OrderLineItemNode {
  id: string;
  title: string;
  quantity: number;
  sku: string | null;
  variant: {
    id: string;
    sku: string | null;
    weight: number | null;
    weightUnit: string | null;
    inventoryItem: InventoryItemCustoms | null;
  } | null;
  originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  discountedUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  totalDiscountSet: { shopMoney: { amount: string; currencyCode: string } };
}

export interface ShippingAddress {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  countryCode: string | null;
  phone: string | null;
}

export interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  currencyCode: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  shippingAddress: ShippingAddress | null;
  lineItems: { nodes: OrderLineItemNode[] };
  shippingLines?: {
    nodes: Array<{
      title: string;
      originalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    }>;
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const AUDIT_PRODUCTS_QUERY = `#graphql
  query AuditProducts($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        vendor
        productType
        tags
        variants(first: 100) {
          nodes {
            id
            title
            price
            inventoryItem {
              id
              harmonizedSystemCode
              countryCodeOfOrigin
            }
          }
        }
      }
    }
  }
`;

export const REAUDIT_PRODUCT_QUERY = `#graphql
  query ReauditProduct($id: ID!) {
    product(id: $id) {
      id
      title
      vendor
      productType
      tags
      variants(first: 100) {
        nodes {
          id
          title
          price
          inventoryItem {
            id
            harmonizedSystemCode
            countryCodeOfOrigin
          }
        }
      }
    }
  }
`;

export const RECENT_ORDERS_QUERY = `#graphql
  query RecentOrders($first: Int!, $cursor: String, $query: String!) {
    orders(first: $first, after: $cursor, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        createdAt
        currencyCode
        totalPriceSet {
          shopMoney { amount currencyCode }
        }
        shippingAddress {
          countryCode
          country
        }
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            variant {
              id
              inventoryItem {
                id
                harmonizedSystemCode
                countryCodeOfOrigin
              }
            }
            originalUnitPriceSet {
              shopMoney { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;

export const ORDER_FOR_INVOICE_QUERY = `#graphql
  query OrderForInvoice($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      currencyCode
      totalPriceSet {
        shopMoney { amount currencyCode }
      }
      shippingAddress {
        firstName lastName company
        address1 address2
        city province zip
        country countryCode
        phone
      }
      lineItems(first: 100) {
        nodes {
          id
          title
          quantity
          sku
          variant {
            id
            sku
            inventoryItem {
              id
              harmonizedSystemCode
              countryCodeOfOrigin
            }
          }
          originalUnitPriceSet {
            shopMoney { amount currencyCode }
          }
          discountedUnitPriceSet {
            shopMoney { amount currencyCode }
          }
          totalDiscountSet {
            shopMoney { amount currencyCode }
          }
        }
      }
      shippingLines(first: 5) {
        nodes {
          title
          originalPriceSet {
            shopMoney { amount currencyCode }
          }
        }
      }
    }
  }
`;

// ─── Rate-limit aware GraphQL executor ───────────────────────────────────────

/**
 * Execute a GraphQL query with rate-limit awareness.
 * Reads extensions.cost from the response and sleeps if budget is low.
 */
export async function executeWithThrottling<T>(
  adminGraphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const MAX_RETRIES = 5;
  let attempt = 0;
  let delay = 2000;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await adminGraphql(query, { variables });
      const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
        extensions?: { cost?: GraphQLCostExtension };
      };

      if (json.errors?.length) {
        const errorMsg = json.errors.map((e) => e.message).join("; ");
        throw new Error(`GraphQL errors: ${errorMsg}`);
      }

      // Throttle handling — sleep if budget is getting low
      const cost = json.extensions?.cost;
      if (cost) {
        const { currentlyAvailable, restoreRate } = cost.throttleStatus;
        if (currentlyAvailable < restoreRate * 1.5) {
          const neededMs =
            Math.ceil(
              ((restoreRate * 1.5 - currentlyAvailable) / restoreRate) * 1000
            ) + 200;
          logger.info(
            {
              currentlyAvailable,
              restoreRate,
              sleepMs: neededMs,
            },
            "GraphQL throttle budget low — sleeping"
          );
          await sleep(neededMs);
        }
      }

      return json.data as T;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("THROTTLED") ||
        errorMessage.includes("429") ||
        errorMessage.includes("throttle")
      ) {
        attempt++;
        logger.warn({ attempt, delay, error: errorMessage }, "Rate limited — retrying");
        await sleep(delay);
        delay = Math.min(delay * 2, 30000);
      } else {
        throw err;
      }
    }
  }

  throw new Error(`GraphQL request failed after ${MAX_RETRIES} attempts`);
}

// ─── Paginated product fetcher ────────────────────────────────────────────────

export async function* paginateProducts(
  adminGraphql: Parameters<typeof executeWithThrottling>[0],
  pageSize = 50
): AsyncGenerator<ProductNode[]> {
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await executeWithThrottling<{
      products: { pageInfo: PageInfo; nodes: ProductNode[] };
    }>(adminGraphql, AUDIT_PRODUCTS_QUERY, {
      first: pageSize,
      cursor,
    });

    const { nodes, pageInfo } = data.products;
    yield nodes;

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Convert numeric Shopify ID to GID */
export function toGid(type: string, numericId: string | number): string {
  return `gid://shopify/${type}/${numericId}`;
}

/** Extract numeric ID from GID */
export function fromGid(gid: string): string {
  return gid.split("/").pop() ?? gid;
}
