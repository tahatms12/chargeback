export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        margin: 0,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <section
        style={{
          textAlign: "center",
          background: "#ffffff",
          padding: "2rem 2.5rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
          maxWidth: "640px",
        }}
      >
        <h1 style={{ marginBottom: "0.75rem", fontSize: "1.8rem" }}>
          Chargeback Frontend Restored
        </h1>
        <p style={{ margin: 0, lineHeight: 1.6, color: "#334155" }}>
          This frontend root has been restored to ensure stable deployments while
          backend and Shopify applications remain isolated in their own
          directories.
        </p>
      </section>
    </main>
  );
}
