/**
 * liquid-scanner.server.js
 *
 * Reads the active theme's Liquid files via the Shopify Theme Asset REST API
 * (requires read_themes scope), then pattern-matches for:
 *  - Classic customer account Liquid objects (customer.account_activation_url, etc.)
 *  - Classic account form tags (customer_login, create_customer, etc.)
 *  - Classic account URL references (/account/login, /account/register)
 *  - Multipass references
 *  - Script injection patterns on account-related pages
 *
 * Source requirement: "Detect Liquid customizations in theme files referencing classic
 *   account-related objects (customer.account_activation_url, classic login form patterns)"
 * Source requirement: "Detect scripts in theme injecting on /account, /login, /register pages"
 * Source requirement: "Advanced Liquid parsing beyond pattern matching" — EXCLUDED per MVP
 */

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

/**
 * Patterns that identify classic account Liquid constructs which break
 * when switching to New Customer Accounts.
 *
 * severity: "high" — will definitely break; requires dev action
 *           "medium" — likely breaks or requires verification
 */
const CLASSIC_ACCOUNT_PATTERNS = [
  {
    id: "account_activation_url",
    pattern: /customer\.account_activation_url/gi,
    label: "Classic account activation URL",
    description:
      "customer.account_activation_url is not available in New Customer Accounts. Activation is handled by Shopify's hosted flow.",
    severity: "high",
  },
  {
    id: "customer_login_form",
    pattern: /\{%-?\s*form\s+['"]customer_login['"]/gi,
    label: "Classic customer_login form tag",
    description:
      'The {% form "customer_login" %} Liquid tag renders the classic login form, which is replaced by the New Customer Accounts hosted login page.',
    severity: "high",
  },
  {
    id: "create_customer_form",
    pattern: /\{%-?\s*form\s+['"]create_customer['"]/gi,
    label: "Classic create_customer form tag",
    description:
      'The {% form "create_customer" %} Liquid tag renders the classic registration form, which is replaced by the New Customer Accounts hosted registration page.',
    severity: "high",
  },
  {
    id: "recover_customer_password_form",
    pattern: /\{%-?\s*form\s+['"]recover_customer_password['"]/gi,
    label: "Classic recover_customer_password form tag",
    description:
      "Password recovery via Liquid form tag is handled natively by New Customer Accounts. Classic form will no longer render.",
    severity: "high",
  },
  {
    id: "reset_customer_password_form",
    pattern: /\{%-?\s*form\s+['"]reset_customer_password['"]/gi,
    label: "Classic reset_customer_password form tag",
    description:
      "Password reset via Liquid form tag is handled natively by New Customer Accounts. Classic form will no longer render.",
    severity: "high",
  },
  {
    id: "account_register_url",
    pattern: /\/account\/register/gi,
    label: "/account/register URL reference",
    description:
      "/account/register is removed in New Customer Accounts. Registration is now initiated from the hosted login page.",
    severity: "high",
  },
  {
    id: "routes_account_login_url",
    pattern: /routes\.account_login_url/gi,
    label: "routes.account_login_url Liquid object",
    description:
      "routes.account_login_url points to /account/login which behaves differently under New Customer Accounts.",
    severity: "medium",
  },
  {
    id: "account_login_url_path",
    pattern: /['"`]\/account\/login['"`]/gi,
    label: "/account/login URL reference (hardcoded)",
    description:
      "Hardcoded /account/login URL references may not redirect correctly in New Customer Accounts.",
    severity: "medium",
  },
  {
    id: "multipass",
    pattern: /multipass/gi,
    label: "Multipass reference",
    description:
      "Multipass is only available on Shopify Plus. Its token URL structure changes with New Customer Accounts. Non-Plus stores cannot use Multipass at all.",
    severity: "high",
  },
  {
    id: "customer_account_activation_url_literal",
    pattern: /\/account\/activate/gi,
    label: "/account/activate URL reference",
    description:
      "Account activation URL structure changes in New Customer Accounts. Classic activation links stop working.",
    severity: "high",
  },
  {
    id: "customer_addresses",
    pattern: /customer\.addresses|form\s+['"]customer_address['"]/gi,
    label: "Classic customer address form or object",
    description:
      "Customer address management in the classic account page is replaced by New Customer Accounts' built-in address management. Custom Liquid for address management will stop rendering.",
    severity: "high",
  },
  {
    id: "customer_orders_loop",
    pattern: /customer\.orders/gi,
    label: "customer.orders Liquid object",
    description:
      "The customer.orders object used in classic account page templates is not available in New Customer Accounts templates (which are not Liquid-based).",
    severity: "high",
  },
];

const SCRIPT_INJECTION_PATTERNS = [
  {
    id: "script_targeting_account",
    // Matches any string literal starting with /account (e.g. '/account/login', '/account/orders.json')
    // or the Shopify.routes.account object reference
    pattern: /Shopify\.routes\.account|['"]\/account[/'"]|fetch\(['"]\/account/gi,
    label: "Script referencing /account route",
    description:
      "Scripts that target the /account path may not fire on New Customer Accounts-hosted pages, which are served from a separate Shopify domain.",
    severity: "high",
  },
  {
    id: "pixel_gtag",
    pattern: /gtag\s*\(|googletagmanager\.com|google-analytics\.com/gi,
    label: "Google Analytics / GTM pixel",
    description:
      "Google Analytics or GTM scripts injected in Liquid on account-related pages may not fire on NCA-hosted pages. Consider migrating to the Web Pixels API.",
    severity: "medium",
  },
  {
    id: "pixel_meta",
    pattern: /fbq\s*\(|_fbq|connect\.facebook\.net|meta.*pixel/gi,
    label: "Meta (Facebook) Pixel",
    description:
      "Meta Pixel scripts in Liquid on account pages will not fire on NCA-hosted pages. Consider migrating to the Web Pixels API or Shopify's built-in Meta integration.",
    severity: "medium",
  },
  {
    id: "pixel_tiktok",
    // ttq is TikTok's pixel global; match ttq followed by . or ( to avoid false positives
    pattern: /ttq[.(]|analytics\.tiktok\.com/gi,
    label: "TikTok Pixel",
    description:
      "TikTok Pixel scripts in Liquid on account pages will not fire on NCA-hosted pages.",
    severity: "medium",
  },
  {
    id: "checkout_order_id",
    pattern: /Shopify\.checkout\.|checkout\.order_id|first_time_accessed/gi,
    label: "Order status page script reference",
    description:
      "Classic order status page scripts using Shopify.checkout object are affected by the migration. Consider using the Web Pixels API for order-confirmation tracking.",
    severity: "medium",
  },
];

// ---------------------------------------------------------------------------
// File targeting
// ---------------------------------------------------------------------------

/**
 * Returns true if a theme asset key is relevant to scan for account-related
 * patterns. Scans:
 *  - All files under templates/customers/ (highest priority)
 *  - layout/theme.liquid (global script injection)
 *  - Any section or snippet whose filename contains account/login/register/customer keywords
 *
 * This targeted approach avoids reading all 100+ theme files unnecessarily while
 * capturing the files most likely to contain classic account constructs.
 */
function isAccountRelevantFile(key) {
  if (key.startsWith("templates/customers/")) return true;
  if (key === "layout/theme.liquid") return true;

  const lower = key.toLowerCase();
  const accountKeywords = [
    "account",
    "login",
    "register",
    "customer",
    "order-status",
    "order_status",
    "activation",
    "activate",
    "multipass",
    "password",
  ];
  return accountKeywords.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Fetches JSON from the Shopify Admin REST API using the session credentials
 * directly (avoids REST client version quirks). Throws on non-2xx response.
 *
 * @param {string} shop - myshopify domain, e.g. "mystore.myshopify.com"
 * @param {string} accessToken
 * @param {string} path - e.g. "themes.json"
 * @param {object} [query] - URL query params
 */
async function shopifyRestGet(shop, accessToken, path, query = {}) {
  const url = new URL(`https://${shop}/admin/api/2024-10/${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Shopify REST API error (${response.status}) for ${path}: ${text}`
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

/**
 * Runs all pattern sets against a single file's content. Returns an array of
 * findings, each with label, severity, description, and a short snippet of
 * context around the first match.
 *
 * @param {string} content - Raw Liquid file content
 * @param {string} key - Asset filename, used to decide which patterns to apply
 * @returns {Array<LiquidFinding>}
 *
 * LiquidFinding shape:
 * {
 *   patternId: string,
 *   label: string,
 *   description: string,
 *   severity: "high" | "medium",
 *   snippet: string,   // 80-char excerpt around first match
 *   matchCount: number // total occurrences in this file
 * }
 */
function detectPatternsInContent(content, key) {
  const findings = [];
  const allPatterns = [...CLASSIC_ACCOUNT_PATTERNS, ...SCRIPT_INJECTION_PATTERNS];

  for (const def of allPatterns) {
    // Reset lastIndex before using global flag
    def.pattern.lastIndex = 0;

    const matches = [...content.matchAll(def.pattern)];
    if (matches.length === 0) continue;

    const firstMatch = matches[0];
    const matchIndex = firstMatch.index;

    // Extract a ~80 char snippet of context around the first match
    const snippetStart = Math.max(0, matchIndex - 30);
    const snippetEnd = Math.min(content.length, matchIndex + 50);
    const snippet = content
      .slice(snippetStart, snippetEnd)
      .replace(/\n/g, " ")
      .trim();

    findings.push({
      patternId: def.id,
      label: def.label,
      description: def.description,
      severity: def.severity,
      snippet: `...${snippet}...`,
      matchCount: matches.length,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scans the active theme's Liquid files for classic customer account constructs
 * and script injection patterns that will break when switching to New Customer Accounts.
 *
 * Strategy:
 * 1. Fetch the list of all themes and identify the active (main) theme.
 * 2. List all assets in the active theme.
 * 3. Filter to account-relevant Liquid files.
 * 4. Fetch each file's content individually (with a small delay between requests
 *    to avoid hitting the 2 req/s REST rate limit).
 * 5. Pattern-match each file.
 *
 * @param {string} shop - myshopify domain
 * @param {string} accessToken - Session access token
 * @returns {Promise<{ activeTheme: {id: string, name: string}, results: LiquidScanResult[] }>}
 *
 * LiquidScanResult shape:
 * {
 *   file: string,        // asset key, e.g. "templates/customers/login.liquid"
 *   findings: LiquidFinding[]
 * }
 */
export async function scanLiquidFiles(shop, accessToken) {
  // 1. Get the active theme
  const themesData = await shopifyRestGet(shop, accessToken, "themes.json");
  const activeTheme = themesData.themes.find((t) => t.role === "main");

  if (!activeTheme) {
    throw new Error("No active (main) theme found on this store.");
  }

  // 2. List all assets in the active theme
  const assetsData = await shopifyRestGet(
    shop,
    accessToken,
    `themes/${activeTheme.id}/assets.json`
  );
  const allAssets = assetsData.assets;

  // 3. Filter to account-relevant Liquid files
  const targetFiles = allAssets
    .filter((asset) => asset.key.endsWith(".liquid"))
    .filter((asset) => isAccountRelevantFile(asset.key));

  // 4. Fetch and scan each file with rate-limit-safe delay
  const results = [];

  for (const asset of targetFiles) {
    // 200ms delay between REST calls to stay under the 2 req/s REST limit
    await new Promise((resolve) => setTimeout(resolve, 200));

    let content;
    try {
      const assetData = await shopifyRestGet(
        shop,
        accessToken,
        `themes/${activeTheme.id}/assets.json`,
        { "asset[key]": asset.key }
      );
      content = assetData.asset?.value ?? "";
    } catch (err) {
      // Some assets may return 404 if they are references to theme files that
      // don't exist in this particular theme variant. Skip and continue.
      continue;
    }

    if (!content) continue;

    const findings = detectPatternsInContent(content, asset.key);

    if (findings.length > 0) {
      results.push({
        file: asset.key,
        findings,
      });
    }
  }

  return {
    activeTheme: {
      id: String(activeTheme.id),
      name: activeTheme.name,
    },
    results,
  };
}

// Export for use in tests
export { detectPatternsInContent, isAccountRelevantFile, CLASSIC_ACCOUNT_PATTERNS, SCRIPT_INJECTION_PATTERNS };
