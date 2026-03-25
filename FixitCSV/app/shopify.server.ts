import "@shopify/shopify-app-remix/adapters/node";
import { ApiVersion, AppDistribution, BillingInterval, DeliveryMethod, shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "~/db.server";
import { PAID_PLAN_NAME, PAID_PLAN_PRICE } from "~/lib/shopify-csv-spec";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(",") || ["read_products", "write_products"],
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  auth: {
    path: "/auth/login",
    callbackPath: "/auth/callback",
  },
  sessionStorage: new PrismaSessionStorage(db),
  distribution: AppDistribution.AppStore,
  billing: {
    [PAID_PLAN_NAME]: {
      lineItems: [
        {
          amount: PAID_PLAN_PRICE,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
    },
  },
  webhooks: {
    APP_UNINSTALLED: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks" },
    CUSTOMERS_DATA_REQUEST: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks" },
    CUSTOMERS_REDACT: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks" },
    SHOP_REDACT: { deliveryMethod: DeliveryMethod.Http, callbackUrl: "/webhooks" }
  }
});

export default shopify;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
