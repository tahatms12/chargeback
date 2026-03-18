// app/routes/auth.$.tsx
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useRouteError } from "@remix-run/react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.admin(request);
    return null;
  } catch (err) {
    if (err instanceof Response) throw err;
    const errorBody = err instanceof Error ? err.stack : String(err);
    // Throwing a Response bypasses Remix's default production error hiding
    throw Response.json({ message: errorBody }, {
      status: 500,
      statusText: "Explicit Server Error",
    });
  }
};

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#fff" }}>Auth Callback Error</h1>
      <p style={{ color: "#ff8a8a" }}>
        {error instanceof Error ? error.message : "Unexpected Server Error in Auth"}
      </p>
      <pre style={{ color: "#fff", background: "#333", padding: "1rem" }}>
        {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
