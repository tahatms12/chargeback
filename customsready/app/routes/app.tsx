import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { enqueueCatalogAudit } from "~/queue.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // First-install: enqueue the initial catalog audit if none has run yet
  try {
    const auditRunCount = await db.auditRun.count({ where: { shopDomain } });
    if (auditRunCount === 0) {
      await enqueueCatalogAudit(shopDomain, "install");
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.warn("[app.tsx] DB/queue check skipped:", err);
  }

  return json({ apiKey: process.env.SHOPIFY_API_KEY! });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <ui-nav-menu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/settings">Settings</Link>
      </ui-nav-menu>

      <div className="cr-layout">
        <div className="cr-orb cr-orb--blue-tl"></div>
        <div className="cr-orb cr-orb--violet-bl"></div>
        <div className="cr-orb cr-orb--blue-tr"></div>

        <header className="cr-nav">
          <div className="cr-nav__brand">
            <span className="cr-nav__logo">⚡</span>
            <span className="cr-nav__name">CustomsReady</span>
          </div>
          <nav className="cr-nav__links">
            <Link to="/app" className="cr-nav__link">Dashboard</Link>
            <Link to="/app/settings" className="cr-nav__link">Settings</Link>
          </nav>
        </header>

        <main className="cr-main">
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("ErrorBoundary in app.tsx caught:", error);
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#d21c1c" }}>App Route Error</h1>
      <p style={{ color: "#ff8a8a" }}>
        {error instanceof Error ? error.message : "Unexpected Server Error in app.tsx"}
      </p>
      <pre style={{ background: "#333", padding: "1rem", color: "#fff", overflowX: "auto" }}>
        {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
      </pre>
      {boundary.error(error)}
    </div>
  );
}
