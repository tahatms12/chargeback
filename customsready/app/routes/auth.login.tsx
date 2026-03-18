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
    return await login(new Request(url.toString()));
  } catch (err: unknown) {
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
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0a1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "48px 40px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 40,
              marginBottom: 12,
              filter: "drop-shadow(0 0 16px rgba(99,179,237,0.5))",
            }}
          >
            ⚡
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "-0.5px",
            }}
          >
            Install CustomsReady
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
            Enter your Shopify store domain to get started
          </p>
        </div>

        {/* Error box */}
        {actionData?.error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 20,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {actionData.error}
          </div>
        )}

        <Form method="post">
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="shop"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
              }}
            >
              Shop domain
            </label>
            <input
              id="shop"
              name="shop"
              type="text"
              autoComplete="off"
              placeholder="your-store.myshopify.com"
              style={{
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(99,179,237,0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: isSubmitting
                ? "rgba(99,179,237,0.4)"
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "opacity 0.2s, transform 0.1s",
              letterSpacing: "0.2px",
            }}
            onMouseDown={(e) => {
              (e.target as HTMLButtonElement).style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              (e.target as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            {isSubmitting ? "Redirecting…" : "Install App"}
          </button>
        </Form>
      </div>
    </div>
  );
}
