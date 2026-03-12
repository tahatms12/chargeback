/**
 * shopify.js
 *
 * Configures and exports the Shopify app Express middleware.
 * Uses offline access tokens so the background poller can authenticate
 * without an active user session.
 */

import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "./db.js";

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || "read_draft_orders,write_draft_orders,read_customers").split(","),
    hostName: (process.env.HOST || "").replace(/https?:\/\//, ""),
    hostScheme: "https",
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new SQLiteSessionStorage(),
  useOnlineTokens: false, // Offline tokens required for background polling
});

export default shopify;
