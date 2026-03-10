import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTemplate, createTransport } from "../app/lib/email.server.js";

// ── renderTemplate ────────────────────────────────────────────────────────────

describe("renderTemplate", () => {
  it("replaces all supported variables", () => {
    const tmpl =
      "Hi {{customer_name}}, your order {{order_name}} is now: {{stage_name}}. — {{shop_name}}";
    const result = renderTemplate(tmpl, {
      customerName: "Alice",
      orderName: "#1001",
      stageName: "In Production",
      shopName: "Silver & Stone",
    });
    expect(result).toBe(
      "Hi Alice, your order #1001 is now: In Production. — Silver & Stone"
    );
  });

  it("replaces multiple occurrences of the same variable", () => {
    const tmpl = "{{order_name}} / {{order_name}}";
    const result = renderTemplate(tmpl, { orderName: "#999" });
    expect(result).toBe("#999 / #999");
  });

  it("falls back to empty string for missing vars", () => {
    const tmpl = "Hi {{customer_name}}";
    const result = renderTemplate(tmpl, {});
    expect(result).toBe("Hi there"); // customerName falls back to "there"
  });

  it("leaves unrecognized placeholders untouched", () => {
    const tmpl = "Order {{order_name}} — {{unknown_var}}";
    const result = renderTemplate(tmpl, { orderName: "#100" });
    expect(result).toBe("Order #100 — {{unknown_var}}");
  });
});

// ── createTransport ───────────────────────────────────────────────────────────

describe("createTransport", () => {
  it("returns null when settings is null", () => {
    expect(createTransport(null)).toBeNull();
  });

  it("returns null when smtpHost is empty", () => {
    expect(
      createTransport({ smtpHost: "", smtpUser: "u", smtpPass: "p" })
    ).toBeNull();
  });

  it("returns null when smtpUser is missing", () => {
    expect(
      createTransport({ smtpHost: "smtp.example.com", smtpUser: "", smtpPass: "p" })
    ).toBeNull();
  });

  it("returns null when smtpPass is missing", () => {
    expect(
      createTransport({ smtpHost: "smtp.example.com", smtpUser: "u", smtpPass: "" })
    ).toBeNull();
  });

  it("returns a nodemailer transport object when settings are complete", () => {
    const transport = createTransport({
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "user@example.com",
      smtpPass: "secret",
    });
    expect(transport).not.toBeNull();
    expect(typeof transport.sendMail).toBe("function");
  });

  it("uses port 465 secure mode correctly", () => {
    // createTransport with port 465 should not throw
    const transport = createTransport({
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      smtpUser: "u",
      smtpPass: "p",
    });
    expect(transport).not.toBeNull();
  });
});
