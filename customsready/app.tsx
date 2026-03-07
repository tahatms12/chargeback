// app/routes/app.tsx
import type { LoaderFunctionArgs, HeadersFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { enqueueCatalogAudit } from "~/queue.server";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Billing gate — redirects to Shopify billing approval if no active plan
  await billing.require({
    plans: ["CustomsReady Lite Monthly"],
    onFailure: async () =>
      billing.request({
        plan: "CustomsReady Lite Monthly",
        isTest: process.env.NODE_ENV !== "production",
      }),
  });

  // First-install: enqueue the initial catalog audit if none has run yet
  const auditRunCount = await db.auditRun.count({ where: { shopDomain } });
  if (auditRunCount === 0) {
    try {
      await enqueueCatalogAudit(shopDomain, "install");
    } catch (err) {
      // Non-fatal: do not block app loading if Redis is briefly unavailable
      console.error("[app.tsx] Failed to enqueue initial catalog audit:", err);
    }
  }

  return json({ apiKey: process.env.SHOPIFY_API_KEY! });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <a href="/app" rel="home">
          Dashboard
        </a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify App Bridge requires this exact error boundary pattern
export function ErrorBoundary() {
  const error = useRouteError();
  return boundary.error(error);
}
