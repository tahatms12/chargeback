import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ errors: {} });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = String(formData.get("shop") ?? "").trim();

  if (!shop) {
    return json({ errors: { shop: "Shop domain is required." } });
  }

  // Attach shop to the request URL so login() can read it
  const url = new URL(request.url);
  url.searchParams.set("shop", shop);
  return login(new Request(url.toString(), request));
};

export default function AuthLogin() {
  const actionData = useActionData<typeof action>() as any;
  const navigation = useNavigation();
  const [shop, setShop] = useState("");

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", fontFamily: "sans-serif" }}>
      <h1>Install Customsready</h1>
      <Form method="post">
        <label>
          Shop domain
          <input
            name="shop"
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="your-store.myshopify.com"
            style={{ display: "block", width: "100%", marginTop: 8, padding: 8 }}
          />
        </label>
        {actionData?.errors?.shop && (
          <p style={{ color: "red" }}>{actionData.errors.shop}</p>
        )}
        <button
          type="submit"
          disabled={navigation.state === "submitting"}
          style={{ marginTop: 16, padding: "8px 16px" }}
        >
          {navigation.state === "submitting" ? "Redirecting…" : "Install"}
        </button>
      </Form>
    </div>
  );
}
