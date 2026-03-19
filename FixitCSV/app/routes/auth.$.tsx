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
    throw Response.json({ message: errorBody }, {
      status: 500,
      statusText: "Auth Server Error",
    });
  }
};

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ color: "#ef4444" }}>Authentication Error</h1>
      <p style={{ opacity: 0.7 }}>
        {error instanceof Error ? error.message : "An unexpected error occurred during authentication."}
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre style={{ background: "#111", padding: "1rem", borderRadius: "8px", overflow: "auto", fontSize: "12px", marginTop: "1rem" }}>
          {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
        </pre>
      )}
    </div>
  );
}
