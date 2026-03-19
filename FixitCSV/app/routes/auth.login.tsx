import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ errors: {} });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  let shop = String(formData.get("shop") ?? "").trim().toLowerCase();

  if (!shop) {
    return json({ error: "Shop domain is required." });
  }

  // Normalize: strip https://, trailing slashes, and ensure .myshopify.com
  shop = shop
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  if (!shop.includes(".")) {
    shop = `${shop}.myshopify.com`;
  }

  const url = new URL(request.url);
  url.searchParams.set("shop", shop);

  try {
    return await login(new Request(url.toString(), {
      headers: request.headers,
    }));
  } catch (err: unknown) {
    if (err instanceof Response) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth.login] login() threw:", message);
    return json({ error: `Login failed: ${message}` });
  }
};

export default function AuthLogin() {
  const actionData = useActionData<typeof action>() as { error?: string } | null;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "48px 40px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 8,
              letterSpacing: "-1px",
            }}
          >
            fixitcsv
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              opacity: 0.9,
            }}
          >
            Start fixing your catalog
          </h1>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Enter your Shopify store URL to continue
          </p>
        </div>

        {actionData?.error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 20,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12,
              color: "#ef4444",
              fontSize: 13,
            }}
          >
            {actionData.error}
          </div>
        )}

        <Form method="post">
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="shop"
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Shop domain
            </label>
            <input
              id="shop"
              name="shop"
              type="text"
              autoComplete="off"
              placeholder="my-store.myshopify.com"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: isSubmitting ? "#fff/50" : "#fff",
              border: "none",
              borderRadius: 12,
              color: "#000",
              fontSize: 15,
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isSubmitting ? "Connecting..." : "Continue to Store →"}
          </button>
        </Form>
        
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Secure redirect to Shopify App Store
          </p>
        </div>
      </div>
    </div>
  );
}
