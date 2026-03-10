// app/routes/health.ts
// Health check endpoint for load balancers and uptime monitors.
// Must NOT be authenticated — called by infrastructure, not Shopify.
import type { LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/db.server";

export const loader = async (_args: LoaderFunctionArgs) => {
  // Verify database connectivity
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (err) {
    return Response.json(
      { status: "unhealthy", reason: "database unreachable" },
      { status: 503 }
    );
  }

  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
  });
};
