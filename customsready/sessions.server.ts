// app/lib/sessions.server.ts
// Verifies session tokens sent from UI extensions via Authorization: Bearer header.
// Extensions cannot use cookies, so they pass the App Bridge session token directly.

import { authenticate } from "~/shopify.server";
import type { Request } from "@remix-run/node";

/**
 * Authenticate a request from a UI extension.
 * Extensions send: Authorization: Bearer <session_token>
 *
 * Use this in API routes called directly by extensions
 * (e.g. /api/invoice/:id called from the order block).
 *
 * Returns { shop } on success, throws 401 on failure.
 */
export async function authenticateExtensionRequest(request: Request): Promise<{
  shop: string;
}> {
  // shopify-app-remix handles both embedded session cookies and bearer tokens
  // authenticate.admin() will correctly handle the bearer token from extensions
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
}
