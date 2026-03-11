/**
 * index.js
 *
 * Main Express server for the Draft Order Follow-Up & Expiry Nudge app.
 *
 * Responsibilities:
 *   - Serve the embedded React frontend (development via Vite proxy, production via static files)
 *   - Handle Shopify OAuth authentication
 *   - Process Shopify webhooks
 *   - Expose REST API for the embedded frontend
 *   - Start the background poll cron job
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import serveStatic from "serve-static";
import { initDb } from "./db.js";
import shopify from "./shopify.js";
import webhookHandlers from "./routes/webhooks.js";
import apiRouter from "./routes/api.js";
import { startPoller } from "./services/poller.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || "3000", 10);
const isProd = process.env.NODE_ENV === "production";

const FRONTEND_DIST = join(__dirname, "frontend", "dist");

const app = express();

// ---------------------------------------------------------------------------
// Health check (for deployment platforms)
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => res.status(200).send("OK"));

// ---------------------------------------------------------------------------
// Shopify OAuth
// ---------------------------------------------------------------------------
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// ---------------------------------------------------------------------------
// Shopify Webhooks (must be before express.json() body parser)
// ---------------------------------------------------------------------------
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers })
);

// ---------------------------------------------------------------------------
// Protected API routes
// All /api/* routes require a valid Shopify session
// ---------------------------------------------------------------------------
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());
app.use("/api", apiRouter);

// ---------------------------------------------------------------------------
// Frontend
// In production: serve the Vite build from frontend/dist
// In development: the Vite dev server (on port 5173) proxies through here
// ---------------------------------------------------------------------------
if (isProd) {
  app.use(serveStatic(FRONTEND_DIST, { index: false }));
}

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  let html;
  if (isProd) {
    html = readFileSync(join(FRONTEND_DIST, "index.html")).toString();
  } else {
    // In dev, Vite serves index.html; we redirect to the Vite dev server
    // so the merchant experiences HMR. The Vite server is on port 5173 and
    // proxies /api/* back to this server.
    html = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=http://localhost:5173${_req.originalUrl}"></head>
  <body>Redirecting to dev server...</body>
</html>`;
  }

  // Inject the Shopify API key for App Bridge
  html = html.replace(
    /%VITE_SHOPIFY_API_KEY%/g,
    process.env.SHOPIFY_API_KEY || ""
  );

  return res.status(200).set("Content-Type", "text/html").send(html);
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
initDb();
startPoller();

app.listen(PORT, () => {
  console.log(`[server] Draft Order Nudge listening on port ${PORT}`);
  console.log(`[server] Mode: ${isProd ? "production" : "development"}`);
});
