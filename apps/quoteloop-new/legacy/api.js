/**
 * routes/api.js
 *
 * REST API endpoints consumed by the embedded React frontend.
 * All routes are protected by shopify.validateAuthenticatedSession()
 * (applied in index.js before mounting this router).
 *
 * Endpoints:
 *   GET  /api/draft-orders        - List all open draft orders with age and action status
 *   GET  /api/settings            - Get shop settings
 *   PUT  /api/settings            - Save shop settings
 *   POST /api/draft-orders/:id/send-followup  - Manually trigger a follow-up for one draft
 *   POST /api/draft-orders/:id/expire         - Manually expire one draft
 */

import { Router } from "express";
import {
  getShopSettings,
  saveShopSettings,
  getActionsForDraft,
  recordAction,
} from "../db.js";
import {
  fetchOpenDraftOrders,
  computeAgeInDays,
  renderTemplate,
  markDraftOrderExpired,
  validateSettings,
} from "../services/draftOrders.js";
import { sendFollowUpEmail } from "../services/email.js";

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/draft-orders
// Returns open draft orders enriched with age and action status.
// ---------------------------------------------------------------------------
router.get("/draft-orders", async (req, res) => {
  const { shop, accessToken } = res.locals.shopify.session;

  try {
    const rawDrafts = await fetchOpenDraftOrders(shop, accessToken);
    const settings  = getShopSettings(shop);

    const enriched = rawDrafts.map((draft) => {
      const ageInDays = computeAgeInDays(draft.created_at);
      const actions   = getActionsForDraft(shop, draft.id);

      let status = "open";
      if (actions.includes("expired"))          status = "expired";
      else if (actions.includes("follow_up_sent")) status = "follow_up_sent";
      else if (ageInDays >= settings.expiry_days)  status = "expiry_due";
      else if (ageInDays >= settings.follow_up_days) status = "followup_due";

      const customer = draft.customer;
      const customerName = customer
        ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
        : null;

      return {
        id:            String(draft.id),
        name:          draft.name,
        customer_name: customerName,
        customer_email: customer?.email || draft.email || null,
        total_price:   draft.total_price,
        currency:      draft.currency,
        created_at:    draft.created_at,
        age_in_days:   Math.floor(ageInDays),
        invoice_url:   draft.invoice_url || null,
        status,
        actions,
      };
    });

    // Sort oldest-first so most at-risk drafts appear at the top
    enriched.sort((a, b) => b.age_in_days - a.age_in_days);

    res.json({ draft_orders: enriched });
  } catch (err) {
    console.error("[api] GET /draft-orders error:", err.message);
    res.status(500).json({ error: "Failed to fetch draft orders.", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/settings
// ---------------------------------------------------------------------------
router.get("/settings", (req, res) => {
  const { shop } = res.locals.shopify.session;
  try {
    const settings = getShopSettings(shop);
    res.json({ settings });
  } catch (err) {
    console.error("[api] GET /settings error:", err.message);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/settings
// ---------------------------------------------------------------------------
router.put("/settings", (req, res) => {
  const { shop } = res.locals.shopify.session;
  const {
    follow_up_days,
    expiry_days,
    follow_up_email_subject,
    follow_up_email_body,
    merchant_notification_email,
  } = req.body;

  const parsed = {
    follow_up_days:              parseInt(follow_up_days, 10),
    expiry_days:                 parseInt(expiry_days, 10),
    follow_up_email_subject:     (follow_up_email_subject || "").trim(),
    follow_up_email_body:        (follow_up_email_body    || "").trim(),
    merchant_notification_email: (merchant_notification_email || "").trim() || null,
  };

  const errors = validateSettings(parsed);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  if (!parsed.follow_up_email_subject) {
    return res.status(400).json({ errors: ["follow_up_email_subject is required."] });
  }
  if (!parsed.follow_up_email_body) {
    return res.status(400).json({ errors: ["follow_up_email_body is required."] });
  }

  try {
    saveShopSettings(shop, parsed);
    const saved = getShopSettings(shop);
    res.json({ settings: saved });
  } catch (err) {
    console.error("[api] PUT /settings error:", err.message);
    res.status(500).json({ error: "Failed to save settings." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/draft-orders/:id/send-followup
// Manually trigger a follow-up email for a specific draft order.
// ---------------------------------------------------------------------------
router.post("/draft-orders/:id/send-followup", async (req, res) => {
  const { shop, accessToken } = res.locals.shopify.session;
  const draftOrderId = req.params.id;

  try {
    // Fetch the specific draft order
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/draft_orders/${draftOrderId}.json`,
      { headers: { "X-Shopify-Access-Token": accessToken } }
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Draft order not found." });
    }

    const { draft_order: draft } = await response.json();

    const existingActions = getActionsForDraft(shop, draft.id);
    if (existingActions.includes("follow_up_sent")) {
      return res.status(409).json({ error: "Follow-up already sent for this draft order." });
    }

    const customerEmail = draft.customer?.email || draft.email;
    if (!customerEmail) {
      return res.status(422).json({ error: "Draft order has no customer email address." });
    }

    const settings = getShopSettings(shop);

    // Fetch shop name
    const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    const shopData = await shopRes.json();
    const shopName = shopData.shop?.name || shop;

    const customerName = draft.customer
      ? [draft.customer.first_name, draft.customer.last_name].filter(Boolean).join(" ")
      : "";

    const body = renderTemplate(settings.follow_up_email_body, {
      customer_name:    customerName,
      draft_order_name: draft.name,
      draft_order_url:  draft.invoice_url || "",
      shop_name:        shopName,
    });

    const subject = renderTemplate(settings.follow_up_email_subject, {
      customer_name:    customerName,
      draft_order_name: draft.name,
      shop_name:        shopName,
    });

    await sendFollowUpEmail({ toEmail: customerEmail, subject, bodyText: body });
    recordAction(shop, draft.id, "follow_up_sent");

    res.json({ success: true, sent_to: customerEmail });
  } catch (err) {
    console.error("[api] POST /send-followup error:", err.message);
    res.status(500).json({ error: "Failed to send follow-up email.", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/draft-orders/:id/expire
// Manually expire a specific draft order.
// ---------------------------------------------------------------------------
router.post("/draft-orders/:id/expire", async (req, res) => {
  const { shop, accessToken } = res.locals.shopify.session;
  const draftOrderId = req.params.id;

  try {
    const response = await fetch(
      `https://${shop}/admin/api/2024-01/draft_orders/${draftOrderId}.json`,
      { headers: { "X-Shopify-Access-Token": accessToken } }
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Draft order not found." });
    }

    const { draft_order: draft } = await response.json();

    const existingActions = getActionsForDraft(shop, draft.id);
    if (existingActions.includes("expired")) {
      return res.status(409).json({ error: "Draft order is already marked as expired." });
    }

    await markDraftOrderExpired(shop, accessToken, draft);
    recordAction(shop, draft.id, "expired");

    res.json({ success: true });
  } catch (err) {
    console.error("[api] POST /expire error:", err.message);
    res.status(500).json({ error: "Failed to expire draft order.", detail: err.message });
  }
});

export default router;
