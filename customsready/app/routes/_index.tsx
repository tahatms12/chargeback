import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Root index: route shop installs to /auth, everything else to /auth/login.
// Using /auth (not /app) ensures the new embedded auth strategy handles it.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/auth?${url.searchParams.toString()}`);
  }
  return redirect("/auth/login");
};

export default function Index() {
  return null;
}
