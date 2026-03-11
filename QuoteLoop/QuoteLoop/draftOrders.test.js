/**
 * tests/draftOrders.test.js
 *
 * Tests for the core threshold evaluation logic in services/draftOrders.js.
 *
 * This is the highest-risk logic in the app because errors here would either:
 *   a) fail to send follow-ups / mark expirations (revenue leak continues)
 *   b) send duplicate follow-ups or re-expire already-expired drafts
 *   c) archive active drafts the merchant considers live (support risk from source)
 *
 * All tests use pure functions that accept explicit parameters — no Shopify API
 * calls or database access involved.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeAgeInDays,
  evaluateDraftOrder,
  validateSettings,
  renderTemplate,
} from "../web/services/draftOrders.js";

// ---------------------------------------------------------------------------
// computeAgeInDays
// ---------------------------------------------------------------------------

describe("computeAgeInDays", () => {
  it("returns 0 for a draft created right now", () => {
    const now = new Date();
    const age = computeAgeInDays(now.toISOString(), now);
    assert.equal(age, 0);
  });

  it("returns approximately 7 for a draft created 7 days ago", () => {
    const now     = new Date("2024-03-10T12:00:00Z");
    const created = new Date("2024-03-03T12:00:00Z");
    const age     = computeAgeInDays(created.toISOString(), now);
    assert.ok(Math.abs(age - 7) < 0.001, `Expected ~7, got ${age}`);
  });

  it("returns approximately 30 for a draft created 30 days ago", () => {
    const now     = new Date("2024-03-10T00:00:00Z");
    const created = new Date("2024-02-09T00:00:00Z");
    const age     = computeAgeInDays(created.toISOString(), now);
    assert.ok(Math.abs(age - 30) < 0.001, `Expected ~30, got ${age}`);
  });

  it("returns 0 (not negative) if created_at is in the future", () => {
    const now     = new Date("2024-03-10T00:00:00Z");
    const future  = new Date("2024-03-15T00:00:00Z");
    const age     = computeAgeInDays(future.toISOString(), now);
    assert.equal(age, 0);
  });

  it("throws for an invalid date string", () => {
    assert.throws(
      () => computeAgeInDays("not-a-date"),
      /Invalid created_at value/
    );
  });

  it("handles ISO strings with timezone offset", () => {
    const now     = new Date("2024-03-10T12:00:00Z");
    const created = "2024-03-03T07:00:00-05:00"; // = 12:00:00 UTC
    const age     = computeAgeInDays(created, now);
    assert.ok(Math.abs(age - 7) < 0.001, `Expected ~7, got ${age}`);
  });
});

// ---------------------------------------------------------------------------
// evaluateDraftOrder
// ---------------------------------------------------------------------------

describe("evaluateDraftOrder", () => {
  const SETTINGS = { followUpDays: 7, expiryDays: 14 };

  it("takes no action on a fresh draft (1 day old)", () => {
    const result = evaluateDraftOrder({
      ageInDays: 1,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: false });
  });

  it("takes no action just below the follow-up threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 6.9,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: false });
  });

  it("triggers follow-up at exactly the follow-up threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 7,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: true, shouldExpire: false });
  });

  it("triggers follow-up between follow-up and expiry threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 10,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: true, shouldExpire: false });
  });

  it("triggers expiry at exactly the expiry threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 14,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: true });
  });

  it("triggers only expiry (not follow-up) past expiry threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 30,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: true });
  });

  it("does not re-send follow-up if already sent", () => {
    const result = evaluateDraftOrder({
      ageInDays: 10,
      ...SETTINGS,
      existingActions: ["follow_up_sent"],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: false });
  });

  it("still expires if follow-up was sent but draft now past expiry threshold", () => {
    const result = evaluateDraftOrder({
      ageInDays: 14,
      ...SETTINGS,
      existingActions: ["follow_up_sent"],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: true });
  });

  it("does nothing if draft is already expired", () => {
    const result = evaluateDraftOrder({
      ageInDays: 30,
      ...SETTINGS,
      existingActions: ["follow_up_sent", "expired"],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: false });
  });

  it("does nothing if draft is expired even if below expiry threshold (manual early expiry)", () => {
    const result = evaluateDraftOrder({
      ageInDays: 5,
      ...SETTINGS,
      existingActions: ["expired"],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: false });
  });

  it("triggers expiry directly on a draft past expiry threshold with no prior actions", () => {
    // Draft that was never followed up and jumped past both thresholds
    const result = evaluateDraftOrder({
      ageInDays: 20,
      ...SETTINGS,
      existingActions: [],
    });
    assert.deepEqual(result, { shouldFollowUp: false, shouldExpire: true });
  });
});

// ---------------------------------------------------------------------------
// validateSettings
// ---------------------------------------------------------------------------

describe("validateSettings", () => {
  it("returns no errors for valid settings", () => {
    const errors = validateSettings({ follow_up_days: 7, expiry_days: 14 });
    assert.deepEqual(errors, []);
  });

  it("errors when follow_up_days is 0", () => {
    const errors = validateSettings({ follow_up_days: 0, expiry_days: 14 });
    assert.ok(errors.length > 0);
  });

  it("errors when expiry_days is negative", () => {
    const errors = validateSettings({ follow_up_days: 7, expiry_days: -1 });
    assert.ok(errors.length > 0);
  });

  it("errors when expiry_days equals follow_up_days", () => {
    const errors = validateSettings({ follow_up_days: 7, expiry_days: 7 });
    assert.ok(errors.length > 0);
    assert.ok(errors.some((e) => e.includes("expiry_days must be greater")));
  });

  it("errors when expiry_days is less than follow_up_days", () => {
    const errors = validateSettings({ follow_up_days: 14, expiry_days: 7 });
    assert.ok(errors.length > 0);
  });

  it("errors when values are non-integers", () => {
    const errors = validateSettings({ follow_up_days: "seven", expiry_days: 14 });
    assert.ok(errors.length > 0);
  });
});

// ---------------------------------------------------------------------------
// renderTemplate
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  const template = "Hi {{customer_name}}, your quote {{draft_order_name}} is at {{draft_order_url}}. — {{shop_name}}";

  it("replaces all known tokens", () => {
    const result = renderTemplate(template, {
      customer_name:    "Alice Smith",
      draft_order_name: "#D1001",
      draft_order_url:  "https://shop.myshopify.com/invoices/abc",
      shop_name:        "Acme Wholesale",
    });
    assert.ok(result.includes("Alice Smith"));
    assert.ok(result.includes("#D1001"));
    assert.ok(result.includes("https://shop.myshopify.com/invoices/abc"));
    assert.ok(result.includes("Acme Wholesale"));
    assert.ok(!result.includes("{{"));
    assert.ok(!result.includes("}}"));
  });

  it("falls back to 'Valued Customer' when customer_name is empty", () => {
    const result = renderTemplate("Hi {{customer_name}}", { customer_name: "" });
    assert.ok(result.includes("Valued Customer"));
  });

  it("falls back to 'Valued Customer' when customer_name is missing", () => {
    const result = renderTemplate("Hi {{customer_name}}", {});
    assert.ok(result.includes("Valued Customer"));
  });

  it("handles repeated tokens", () => {
    const result = renderTemplate(
      "{{draft_order_name}} — {{draft_order_name}}",
      { draft_order_name: "#D1001" }
    );
    assert.equal(result, "#D1001 — #D1001");
  });

  it("returns template unchanged when no tokens match", () => {
    const result = renderTemplate("No tokens here.", {});
    assert.equal(result, "No tokens here.");
  });
});
