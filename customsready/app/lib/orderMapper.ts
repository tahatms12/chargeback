import { lookupHsCode } from "./hsCodes";
import type { CommercialInvoiceData, LineItemCustoms } from "~/types/customs";

const ORDER_DETAIL_QUERY = `#graphql
  query getOrderDetails($id: ID!) {
    order(id: $id) {
      name
      createdAt
      currencyCode
      email
      totalPriceSet {
        shopMoney { amount }
      }
      shippingAddress {
        name
        address1
        address2
        city
        provinceCode
        zip
        countryCodeV2
        phone
      }
      lineItems(first: 50) {
        edges {
          node {
            title
            quantity
            originalUnitPriceSet {
              shopMoney { amount }
            }
            variant {
              inventoryItem {
                measurement {
                  weight {
                    unit
                    value
                  }
                }
                harmonizedSystemCode
                countryCodeOfOrigin
              }
              metafields(first: 2, namespace: "customsready") {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
    shop {
      name
      billingAddress {
        address1
        city
        zip
        countryCodeV2
      }
    }
  }
`;

const DRAFT_ORDER_DETAIL_QUERY = `#graphql
  query getDraftOrderDetails($id: ID!) {
    draftOrder(id: $id) {
      name
      createdAt
      currencyCode
      email
      totalPriceSet {
        shopMoney { amount }
      }
      shippingAddress {
        name
        address1
        address2
        city
        provinceCode
        zip
        countryCodeV2
        phone
      }
      lineItems(first: 50) {
        edges {
          node {
            title
            quantity
            originalUnitPriceSet {
              shopMoney { amount }
            }
            variant {
              inventoryItem {
                measurement {
                  weight {
                    unit
                    value
                  }
                }
                harmonizedSystemCode
                countryCodeOfOrigin
              }
              metafields(first: 2, namespace: "customsready") {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
    shop {
      name
      billingAddress {
        address1
        city
        zip
        countryCodeV2
      }
    }
  }
`;

function mapLineItems(edges: any[]): LineItemCustoms[] {
  return edges.map(({ node }: any) => {
    let weightGrams = 0;
    const measurement = node.variant?.inventoryItem?.measurement?.weight;
    if (measurement) {
      const w = measurement.value;
      switch (measurement.unit) {
        case "KILOGRAMS": weightGrams = w * 1000; break;
        case "GRAMS": weightGrams = w; break;
        case "POUNDS": weightGrams = w * 453.592; break;
        case "OUNCES": weightGrams = w * 28.3495; break;
      }
    }

    let hsCode = node.variant?.inventoryItem?.harmonizedSystemCode || "";
    let countryOfOrigin = node.variant?.inventoryItem?.countryCodeOfOrigin || "US";

    if (!hsCode) {
      for (const edge of (node.variant?.metafields?.edges ?? [])) {
        if (edge.node.key === "hs_code") hsCode = edge.node.value;
        if (edge.node.key === "country_of_origin") countryOfOrigin = edge.node.value;
      }
    }
    if (!hsCode) {
      hsCode = lookupHsCode(node.title) || "";
    }

    return {
      title: node.title,
      description: "",
      quantity: node.quantity,
      unitPrice: parseFloat(node.originalUnitPriceSet?.shopMoney?.amount || "0"),
      totalPrice: parseFloat(node.originalUnitPriceSet?.shopMoney?.amount || "0") * node.quantity,
      weightGrams,
      hsCode,
      countryOfOrigin,
    };
  });
}

function buildInvoiceData(
  order: any,
  shopData: any,
  orderId: string
): CommercialInvoiceData {
  const lineItems = mapLineItems(order.lineItems.edges);
  const totalDeclaredValue = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);

  return {
    orderDate: new Date(order.createdAt).toISOString().split("T")[0],
    orderId,
    orderName: order.name,
    currency: order.currencyCode,
    totalDeclaredValue,
    sellerDetails: {
      name: shopData.name,
      address: `${shopData.billingAddress?.address1 || ""}, ${shopData.billingAddress?.city || ""}`,
    },
    buyerDetails: {
      name: order.shippingAddress?.name || "",
      addressLine1: order.shippingAddress?.address1 || "",
      addressLine2: order.shippingAddress?.address2 || "",
      city: order.shippingAddress?.city || "",
      province: order.shippingAddress?.provinceCode || "",
      zip: order.shippingAddress?.zip || "",
      country: order.shippingAddress?.countryCodeV2 || "",
      email: order.email || "",
    },
    lineItems,
  };
}

/**
 * Fetch and map an order by its numeric ID.
 * Supports both placed orders and draft orders.
 * Draft orders have IDs prefixed with "draft_" (e.g. "draft_12345").
 */
export async function fetchAndMapOrder(
  admin: any,
  orderId: string
): Promise<CommercialInvoiceData> {
  const isDraft = orderId.startsWith("draft_");
  const numericId = isDraft ? orderId.replace("draft_", "") : orderId;

  if (isDraft) {
    const gid = `gid://shopify/DraftOrder/${numericId}`;
    const response = await admin.graphql(DRAFT_ORDER_DETAIL_QUERY, {
      variables: { id: gid },
    });
    const json = await response.json();

    if (json.errors) {
      console.error(`GraphQL errors for draft order ${numericId}:`, json.errors);
      throw new Error(`Shopify API Error: ${json.errors[0]?.message || "Access denied or invalid ID"}`);
    }

    const data = json.data;
    if (!data || !data.draftOrder) {
      throw new Error(`Draft order ${numericId} not found or inaccessible`);
    }

    const order = data.draftOrder;
    const shopData = data.shop || { name: "Unknown Shop" };

    if (!order.shippingAddress) {
      // Draft orders may not have a shipping address — use placeholder
      order.shippingAddress = {
        name: "N/A",
        address1: "",
        address2: "",
        city: "",
        provinceCode: "",
        zip: "",
        countryCodeV2: "N/A",
        phone: "",
      };
    }

    return buildInvoiceData(order, shopData, orderId);
  } else {
    const gid = `gid://shopify/Order/${numericId}`;
    const response = await admin.graphql(ORDER_DETAIL_QUERY, {
      variables: { id: gid },
    });
    
    const json = await response.json();
    
    if (json.errors) {
      console.error(`GraphQL errors for order ${numericId}:`, json.errors);
      throw new Error(`Shopify API Error: ${json.errors[0]?.message || "Access denied or invalid ID"}`);
    }

    const data = json.data;
    if (!data || !data.order) {
      throw new Error(`Order ${numericId} not found or inaccessible`);
    }

    const order = data.order;
    const shopData = data.shop || { name: "Unknown Shop" };

    if (!order.shippingAddress) {
      // Placed orders might lack a shipping address (e.g. digital goods, POS)
      order.shippingAddress = {
        name: order.name || "N/A",
        address1: "No Shipping Address",
        address2: "",
        city: "",
        provinceCode: "",
        zip: "",
        countryCodeV2: "N/A",
        phone: "",
      };
    }

    return buildInvoiceData(order, shopData, orderId);
  }
}
