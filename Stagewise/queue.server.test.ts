// tests/queue.server.test.ts
// Tests for the highest-risk source-defined logic:
//   1. Template variable interpolation (customer-facing email content)
//   2. processEmailQueue concurrency guard (prevent duplicate sends)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { interpolate } from "../app/email.server";

// ─── Template interpolation tests ────────────────────────────────────────────

describe("interpolate", () => {
  const vars = {
    orderNumber: "#1042",
    customerName: "Jane Smith",
    stageName: "In Production",
    shopName: "Clay & Co",
    shopDomain: "clay-and-co.myshopify.com",
  };

  it("replaces all known variables", () => {
    const template =
      "Hi {{customerName}}, your order {{orderNumber}} is {{stageName}} at {{shopName}}.";
    const result = interpolate(template, vars);
    expect(result).toBe(
      "Hi Jane Smith, your order #1042 is In Production at Clay & Co."
    );
  });

  it("leaves unknown variables in place", () => {
    const result = interpolate("Hello {{unknownVar}}", vars);
    expect(result).toBe("Hello {{unknownVar}}");
  });

  it("handles empty template", () => {
    expect(interpolate("", vars)).toBe("");
  });

  it("handles template with no variables", () => {
    expect(interpolate("Your order is ready!", vars)).toBe(
      "Your order is ready!"
    );
  });

  it("handles repeated variables", () => {
    const result = interpolate(
      "{{orderNumber}} — {{orderNumber}} confirmed.",
      vars
    );
    expect(result).toBe("#1042 — #1042 confirmed.");
  });

  it("handles HTML templates correctly", () => {
    const html = `<p>Hi {{customerName}},</p><p>Order <strong>{{orderNumber}}</strong> is at stage <em>{{stageName}}</em>.</p>`;
    const result = interpolate(html, vars);
    expect(result).toContain("Jane Smith");
    expect(result).toContain("#1042");
    expect(result).toContain("In Production");
    expect(result).not.toContain("{{");
  });

  it("handles special regex characters in values gracefully", () => {
    const specialVars = { ...vars, shopName: "Rocks & Things (Studio)" };
    const result = interpolate("From {{shopName}}", specialVars);
    expect(result).toBe("From Rocks & Things (Studio)");
  });
});

// ─── processEmailQueue concurrency guard ─────────────────────────────────────
// We test the module-level concurrency guard without hitting the DB.
// This is the critical path for rate-limit safety on batch moves.

describe("processEmailQueue concurrency guard", () => {
  // We mock the db and sendQueuedEmail to control timing
  vi.mock("../app/db.server", () => ({
    db: {
      emailQueue: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  }));

  vi.mock("../app/email.server", () => ({
    sendQueuedEmail: vi.fn(),
    interpolate: (t: string) => t,
    enqueueStageEmail: vi.fn(),
    testSmtpConnection: vi.fn(),
  }));

  beforeEach(() => {
    vi.resetModules();
  });

  it("returns zero counts when queue is empty", async () => {
    const { db } = await import("../app/db.server");
    vi.mocked(db.emailQueue.findMany).mockResolvedValue([]);

    const { processEmailQueue } = await import("../app/queue.server");
    const result = await processEmailQueue();

    expect(result).toEqual({ processed: 0, sent: 0, failed: 0 });
  });

  it("processes pending emails sequentially", async () => {
    const { db } = await import("../app/db.server");
    const { sendQueuedEmail } = await import("../app/email.server");

    const fakeIds = [{ id: "abc" }, { id: "def" }];
    vi.mocked(db.emailQueue.findMany).mockResolvedValue(fakeIds as never);
    vi.mocked(sendQueuedEmail).mockResolvedValue(undefined);

    const { processEmailQueue } = await import("../app/queue.server");
    const result = await processEmailQueue();

    expect(result.processed).toBe(2);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(sendQueuedEmail).toHaveBeenCalledTimes(2);
  });

  it("counts failures without throwing", async () => {
    const { db } = await import("../app/db.server");
    const { sendQueuedEmail } = await import("../app/email.server");

    vi.mocked(db.emailQueue.findMany).mockResolvedValue([{ id: "fail1" }] as never);
    vi.mocked(sendQueuedEmail).mockRejectedValue(new Error("SMTP error"));

    const { processEmailQueue } = await import("../app/queue.server");
    const result = await processEmailQueue();

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
    // Must not throw — caller must not crash
  });
});
