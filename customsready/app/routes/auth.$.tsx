// app/routes/auth.$.tsx
// Catch-all auth route for the new Shopify embedded auth strategy.
// authenticate.admin() handles the token exchange internally and throws
// a Response that Remix passes through — do NOT wrap in try/catch or
// add an ErrorBoundary here, as that would intercept the token exchange.
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};
