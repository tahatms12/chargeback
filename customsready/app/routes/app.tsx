import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { enqueueCatalogAudit } from "~/queue.server";
import { requireBilling } from "~/lib/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Billing gate — throws a redirect Response if subscription is required.
  // Must re-throw Responses so Remix handles the billing redirect correctly.
  try {
    await requireBilling(billing, shopDomain);
  } catch (err) {
    if (err instanceof Response) throw err;
    // Non-Response errors from billing (e.g. DB) — log and continue so
    // the app still loads rather than showing a broken screen.
    console.warn("[app.tsx] requireBilling error (non-fatal):", err);
  }

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
