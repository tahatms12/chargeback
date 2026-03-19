import type { LoaderFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { I18nProvider, useI18n } from "~/lib/i18n";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY! });
};

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <I18nProvider>
      <AppShell apiKey={apiKey} />
    </I18nProvider>
  );
}

function AppShell({ apiKey }: { apiKey: string }) {
  const { t } = useI18n();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">{t("nav.home")}</Link>
      </NavMenu>
      <Outlet />
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
