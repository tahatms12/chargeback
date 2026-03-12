/**
 * liquid-scanner.test.js
 *
 * Tests for the pattern matching logic in liquid-scanner.server.js.
 * This is the highest-risk source-defined logic: false negatives mean
 * merchants migrate with broken customizations they were not warned about.
 */

import { describe, it, expect } from "vitest";
import {
  detectPatternsInContent,
  isAccountRelevantFile,
} from "../app/lib/scanner/liquid-scanner.server.js";

// ---------------------------------------------------------------------------
// isAccountRelevantFile
// ---------------------------------------------------------------------------

describe("isAccountRelevantFile", () => {
  it("includes all templates/customers/ files", () => {
    expect(isAccountRelevantFile("templates/customers/account.liquid")).toBe(true);
    expect(isAccountRelevantFile("templates/customers/login.liquid")).toBe(true);
    expect(isAccountRelevantFile("templates/customers/register.liquid")).toBe(true);
    expect(isAccountRelevantFile("templates/customers/activate_account.liquid")).toBe(true);
    expect(isAccountRelevantFile("templates/customers/reset_password.liquid")).toBe(true);
    expect(isAccountRelevantFile("templates/customers/order.liquid")).toBe(true);
  });

  it("includes layout/theme.liquid", () => {
    expect(isAccountRelevantFile("layout/theme.liquid")).toBe(true);
  });

  it("includes sections and snippets with account-related keywords", () => {
    expect(isAccountRelevantFile("sections/main-login.liquid")).toBe(true);
    expect(isAccountRelevantFile("sections/main-account.liquid")).toBe(true);
    expect(isAccountRelevantFile("sections/customer-login-form.liquid")).toBe(true);
    expect(isAccountRelevantFile("snippets/customer-order.liquid")).toBe(true);
    expect(isAccountRelevantFile("sections/register-form.liquid")).toBe(true);
  });

  it("includes files with password and activation keywords", () => {
    expect(isAccountRelevantFile("templates/customers/reset_password.liquid")).toBe(true);
    expect(isAccountRelevantFile("sections/account-activate.liquid")).toBe(true);
  });

  it("excludes unrelated product and collection templates", () => {
    expect(isAccountRelevantFile("templates/product.liquid")).toBe(false);
    expect(isAccountRelevantFile("templates/collection.liquid")).toBe(false);
    expect(isAccountRelevantFile("sections/header.liquid")).toBe(false);
    expect(isAccountRelevantFile("sections/footer.liquid")).toBe(false);
    expect(isAccountRelevantFile("snippets/cart-drawer.liquid")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectPatternsInContent — classic account constructs
// ---------------------------------------------------------------------------

describe("detectPatternsInContent — classic account constructs", () => {
  it("detects customer.account_activation_url", () => {
    const content = `<a href="{{ customer.account_activation_url }}">Activate Account</a>`;
    const findings = detectPatternsInContent(content, "templates/customers/activate_account.liquid");
    const ids = findings.map((f) => f.patternId);
    expect(ids).toContain("account_activation_url");
  });

  it("detects classic customer_login form tag", () => {
    const content = `{% form 'customer_login' %}<input type="email">{% endform %}`;
    const findings = detectPatternsInContent(content, "templates/customers/login.liquid");
    expect(findings.some((f) => f.patternId === "customer_login_form")).toBe(true);
  });

  it("detects classic customer_login form tag with double quotes", () => {
    const content = `{% form "customer_login" %}<input type="email">{% endform %}`;
    const findings = detectPatternsInContent(content, "templates/customers/login.liquid");
    expect(findings.some((f) => f.patternId === "customer_login_form")).toBe(true);
  });

  it("detects classic create_customer form tag", () => {
    const content = `{% form 'create_customer' %}<input type="email">{% endform %}`;
    const findings = detectPatternsInContent(content, "templates/customers/register.liquid");
    expect(findings.some((f) => f.patternId === "create_customer_form")).toBe(true);
  });

  it("detects classic recover_customer_password form tag", () => {
    const content = `{% form 'recover_customer_password' %}{% endform %}`;
    const findings = detectPatternsInContent(content, "templates/customers/login.liquid");
    expect(findings.some((f) => f.patternId === "recover_customer_password_form")).toBe(true);
  });

  it("detects /account/register URL references", () => {
    const content = `<a href="/account/register">Create account</a>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "account_register_url")).toBe(true);
  });

  it("detects /account/login hardcoded URL", () => {
    const content = `<a href="/account/login">Sign in</a>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "account_login_url_path")).toBe(true);
  });

  it("detects multipass references", () => {
    const content = `// Multipass token: {{ shop.metafields.multipass.token }}`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "multipass")).toBe(true);
  });

  it("detects customer.addresses", () => {
    const content = `{% for address in customer.addresses %}<p>{{ address.address1 }}</p>{% endfor %}`;
    const findings = detectPatternsInContent(content, "templates/customers/account.liquid");
    expect(findings.some((f) => f.patternId === "customer_addresses")).toBe(true);
  });

  it("detects customer.orders", () => {
    const content = `{% for order in customer.orders %}<p>{{ order.name }}</p>{% endfor %}`;
    const findings = detectPatternsInContent(content, "templates/customers/account.liquid");
    expect(findings.some((f) => f.patternId === "customer_orders_loop")).toBe(true);
  });

  it("counts multiple occurrences correctly", () => {
    const content = `
      {% for order in customer.orders %}
        {{ order.name }}
      {% endfor %}
      {% assign all_orders = customer.orders %}
    `;
    const findings = detectPatternsInContent(content, "templates/customers/account.liquid");
    const ordersFinding = findings.find((f) => f.patternId === "customer_orders_loop");
    expect(ordersFinding).toBeDefined();
    expect(ordersFinding.matchCount).toBe(2);
  });

  it("returns severity 'high' for breaking patterns", () => {
    const content = `{% form 'customer_login' %}{% endform %}`;
    const findings = detectPatternsInContent(content, "templates/customers/login.liquid");
    const loginFinding = findings.find((f) => f.patternId === "customer_login_form");
    expect(loginFinding?.severity).toBe("high");
  });

  it("returns an empty array when no classic patterns are present", () => {
    const content = `<h1>Welcome to our store</h1><p>Browse our products</p>`;
    const findings = detectPatternsInContent(content, "templates/index.liquid");
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// detectPatternsInContent — script injection patterns
// ---------------------------------------------------------------------------

describe("detectPatternsInContent — script injection patterns", () => {
  it("detects Google Tag Manager script", () => {
    const content = `<script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"></script>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "pixel_gtag")).toBe(true);
  });

  it("detects gtag() function call", () => {
    const content = `<script>gtag('event', 'page_view', {});</script>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "pixel_gtag")).toBe(true);
  });

  it("detects Meta/Facebook Pixel fbq call", () => {
    const content = `<script>fbq('track', 'PageView');</script>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "pixel_meta")).toBe(true);
  });

  it("detects TikTok Pixel ttq call", () => {
    const content = `<script>ttq.track('ViewContent', {});</script>`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "pixel_tiktok")).toBe(true);
  });

  it("detects order status checkout script", () => {
    const content = `if (Shopify.checkout.order_id) { trackOrder(Shopify.checkout.order_id); }`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "checkout_order_id")).toBe(true);
  });

  it("detects script targeting /account route", () => {
    const content = `fetch('/account/orders.json').then(...)`;
    const findings = detectPatternsInContent(content, "layout/theme.liquid");
    expect(findings.some((f) => f.patternId === "script_targeting_account")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Snippet extraction
// ---------------------------------------------------------------------------

describe("detectPatternsInContent — snippet extraction", () => {
  it("includes a non-empty snippet for each finding", () => {
    const content = `Here is some Liquid: {% form 'customer_login' %}<input>{% endform %} and more text`;
    const findings = detectPatternsInContent(content, "templates/customers/login.liquid");
    expect(findings.length).toBeGreaterThan(0);
    findings.forEach((f) => {
      expect(typeof f.snippet).toBe("string");
      expect(f.snippet.length).toBeGreaterThan(0);
    });
  });
});
