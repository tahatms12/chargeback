import { lookupHsCode } from "./hsCodes";
import type { CommercialInvoiceData, LineItemCustoms } from "~/types/customs";

export async function fetchAndMapOrder(admin: any, orderId: string): Promise<CommercialInvoiceData> {
  const response = await admin.graphql(
    `#graphql
    query getOrderDetails($id: ID!) {
      order(id: $id) {
        name
        createdAt
        currencyCode
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
    }`,
    { variables: { id: `gid://shopify/Order/${orderId}` } }
  );
  
  const { data } = await response.json();
  const order = data.order;
  const shopData = data.shop;
  
  if (!order || !order.shippingAddress) {
    throw new Error("Order not found or missing shipping address");
  }

  const lineItems: LineItemCustoms[] = order.lineItems.edges.map(({ node }: any) => {
    let weightGrams = 0;
    if (node.variant && node.variant.weight && node.variant.weightUnit) {
      const w = parseFloat(node.variant.weight);
      switch(node.variant.weightUnit) {
        case "KILOGRAMS": weightGrams = w * 1000; break;
        case "GRAMS": weightGrams = w; break;
        case "POUNDS": weightGrams = w * 453.592; break;
        case "OUNCES": weightGrams = w * 28.3495; break;
      }
    }
    
    let hsCode = "";
    let countryOfOrigin = "US"; // default
    if (node.variant && node.variant.metafields) {
      for (const edge of node.variant.metafields.edges) {
        if (edge.node.key === "hs_code") hsCode = edge.node.value;
        if (edge.node.key === "country_of_origin") countryOfOrigin = edge.node.value;
      }
    }
    
    if (!hsCode) {
      hsCode = lookupHsCode(node.title) || "";
    }

    return {
      title: node.title,
      quantity: node.quantity,
      unitPrice: parseFloat(node.originalUnitPriceSet.shopMoney.amount),
      totalPrice: parseFloat(node.originalUnitPriceSet.shopMoney.amount) * node.quantity,
      weightGrams,
      hsCode,
      countryOfOrigin,
    };
  });

  const totalDeclaredValue = lineItems.reduce((acc, item) => acc + item.totalPrice, 0);

  return {
    orderDate: new Date(order.createdAt).toISOString().split('T')[0],
    orderId: orderId,
    orderName: order.name,
    currency: order.currencyCode,
    totalDeclaredValue,
    sellerDetails: {
      name: shopData.name,
      address: `${shopData.billingAddress?.address1 || ""}, ${shopData.billingAddress?.city || ""}`,
    },
    buyerDetails: {
      name: order.shippingAddress.name || "",
      addressLine1: order.shippingAddress.address1 || "",
      addressLine2: order.shippingAddress.address2 || "",
      city: order.shippingAddress.city || "",
      province: order.shippingAddress.provinceCode || "",
      zip: order.shippingAddress.zip || "",
      country: order.shippingAddress.countryCodeV2 || "",
      email: "",
    },
    lineItems,
  };
}
