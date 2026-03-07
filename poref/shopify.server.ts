// app/shopify.server.ts

import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./db.server";
import { handleAfterAuth } from "./utils/billing.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(",") ?? [
    "read_orders",
    "write_orders",
    "read_all_orders",
    "read_customers",
  ],
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  webhooks: {
    "orders/create": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    "orders/updated": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    "app/uninstalled": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    "customers/data_request": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    "customers/redact": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    "shop/redact": {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      // Register webhooks and handle billing redirect after fresh install/reauth
      shopify.registerWebhooks({ session });
      await handleAfterAuth(session);
    },
  },
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
