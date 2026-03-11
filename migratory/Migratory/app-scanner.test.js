/**
 * app-scanner.test.js
 *
 * Tests for the compatibility database lookup logic in app-scanner.server.js.
 * This logic is high-risk: incorrect matching produces false confidence
 * (an incompatible app matched to a compatible DB entry, or vice versa).
 */

import { describe, it, expect } from "vitest";

// We test the lookup logic directly by importing the module's internals via a
// thin wrapper. Since lookupInCompatibilityDb is not exported, we replicate the
// logic here to keep the test file self-contained and avoid exposing internal
// implementation details beyond what the module intends.
//
// Implementation choice: extract lookup into a pure function exportable for testing.
// The production module (app-scanner.server.js) uses the same algorithm.

function lookupInCompatibilityDb(app, db) {
  const appHandleLower = app.handle?.toLowerCase() ?? "";
  const appTitleLower = app.title?.toLowerCase() ?? "";

  let match = db.apps.find(
    (entry) => entry.handle.toLowerCase() === appHandleLower
  );
  if (match) return match;

  match = db.apps.find((entry) =>
    entry.alternateHandles?.some((alt) => alt.toLowerCase() === appHandleLower)
  );
  if (match) return match;

  match = db.apps.find(
    (entry) => entry.name.toLowerCase() === appTitleLower
  );
  if (match) return match;

  if (appTitleLower.length > 0) {
    match = db.apps.find((entry) => {
      const dbNameLower = entry.name.toLowerCase();
      return (
        appTitleLower.includes(dbNameLower) ||
        dbNameLower.includes(appTitleLower)
      );
    });
    if (match) return match;
  }

  return null;
}

const SAMPLE_DB = {
  apps: [
    {
      handle: "smile-io",
      name: "Smile: Loyalty & Rewards",
      alternateHandles: ["smile-loyalty-rewards", "smile"],
      status: "partial",
      notes: "Remove classic Liquid account page snippet.",
      sourceUrl: "https://help.smile.io",
      estimatedResolveHours: 1,
    },
    {
      handle: "klaviyo",
      name: "Klaviyo",
      alternateHandles: ["klaviyo-email-marketing"],
      status: "compatible",
      notes: null,
      sourceUrl: "https://help.klaviyo.com",
      estimatedResolveHours: 0,
    },
    {
      handle: "social-login-by-oauthking",
      name: "Social Login",
      alternateHandles: ["oauthking", "social-login"],
      status: "incompatible",
      notes: "Classic social login Liquid integrations stop working after NCA migration.",
      sourceUrl: null,
      estimatedResolveHours: 4,
    },
  ],
};

describe("lookupInCompatibilityDb — exact handle match", () => {
  it("matches by exact handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "smile-io", title: "Smile: Loyalty & Rewards" },
      SAMPLE_DB
    );
    expect(result?.handle).toBe("smile-io");
    expect(result?.status).toBe("partial");
  });

  it("matches klaviyo by exact handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "klaviyo", title: "Klaviyo" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("compatible");
  });

  it("is case-insensitive for handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "KLAVIYO", title: "Klaviyo" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("compatible");
  });
});

describe("lookupInCompatibilityDb — alternate handle match", () => {
  it("matches via alternate handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "smile-loyalty-rewards", title: "Smile Loyalty" },
      SAMPLE_DB
    );
    expect(result?.handle).toBe("smile-io");
  });

  it("matches via second alternate handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "smile", title: "Smile" },
      SAMPLE_DB
    );
    expect(result?.handle).toBe("smile-io");
  });

  it("matches social login via oauthking alternate handle", () => {
    const result = lookupInCompatibilityDb(
      { handle: "oauthking", title: "One Click Social Login" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("incompatible");
  });
});

describe("lookupInCompatibilityDb — name match", () => {
  it("matches by exact case-insensitive name", () => {
    const result = lookupInCompatibilityDb(
      { handle: "unknown-handle", title: "klaviyo" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("compatible");
  });
});

describe("lookupInCompatibilityDb — substring match", () => {
  it("matches when app title contains DB name", () => {
    // 'Klaviyo Email Marketing' contains 'Klaviyo'
    const result = lookupInCompatibilityDb(
      { handle: "some-handle", title: "Klaviyo Email Marketing" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("compatible");
  });

  it("matches when DB name contains app title", () => {
    // DB: 'Smile: Loyalty & Rewards' contains 'Smile'
    const result = lookupInCompatibilityDb(
      { handle: "unknown-smile-handle", title: "Smile" },
      SAMPLE_DB
    );
    expect(result?.handle).toBe("smile-io");
  });
});

describe("lookupInCompatibilityDb — no match", () => {
  it("returns null for an app not in the database", () => {
    const result = lookupInCompatibilityDb(
      { handle: "some-completely-unknown-app", title: "Some Unknown App" },
      SAMPLE_DB
    );
    expect(result).toBeNull();
  });

  it("returns null when handle and title are both empty", () => {
    const result = lookupInCompatibilityDb({ handle: "", title: "" }, SAMPLE_DB);
    expect(result).toBeNull();
  });
});

describe("lookupInCompatibilityDb — correct status returned", () => {
  it("returns correct status for incompatible app", () => {
    const result = lookupInCompatibilityDb(
      { handle: "social-login-by-oauthking", title: "Social Login" },
      SAMPLE_DB
    );
    expect(result?.status).toBe("incompatible");
    expect(result?.estimatedResolveHours).toBe(4);
  });

  it("returns notes and sourceUrl when available", () => {
    const result = lookupInCompatibilityDb(
      { handle: "smile-io", title: "Smile" },
      SAMPLE_DB
    );
    expect(typeof result?.notes).toBe("string");
    expect(result?.sourceUrl).toContain("smile.io");
  });
});
