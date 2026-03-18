import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("shop")) {
      throw redirect(`/app?${url.searchParams.toString()}`);
    }
    return redirect("/auth/login");
  } catch (err) {
    if (err instanceof Response) throw err;
    const errorBody = err instanceof Error ? err.stack : String(err);
    // Bypass Remix's default production error hiding
    throw Response.json({ message: errorBody }, {
      status: 500,
      statusText: "Explicit Index Loader Error",
    });
  }
};

export default function Index() {
  return null;
}
