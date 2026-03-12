/**
 * services/email.js
 *
 * Email sending via SendGrid.
 * Source explicitly names SendGrid or Postmark; SendGrid is implemented here.
 * (Implementation choice: SendGrid over Postmark)
 */

import sgMail from "@sendgrid/mail";

let initialized = false;

function ensureInitialized() {
  if (!initialized) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable is not set.");
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    initialized = true;
  }
}

/**
 * Sends a follow-up email to a draft order customer.
 *
 * @param {object} params
 * @param {string} params.toEmail       - Recipient email address
 * @param {string} params.subject       - Email subject
 * @param {string} params.bodyText      - Plain text body (with template tokens already resolved)
 * @param {string} params.fromEmail     - Sender address (from env)
 * @returns {Promise<void>}
 */
export async function sendFollowUpEmail({ toEmail, subject, bodyText }) {
  ensureInitialized();

  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL environment variable is not set.");
  }

  if (!toEmail) {
    throw new Error("Cannot send follow-up email: recipient email is missing.");
  }

  const msg = {
    to: toEmail,
    from: fromEmail,
    subject,
    text: bodyText,
    // Convert newlines to HTML paragraphs for HTML version
    html: bodyText
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join(""),
  };

  await sgMail.send(msg);
}

/**
 * Sends a notification email to the merchant when drafts are expired.
 * Only called if merchant_notification_email is configured in shop settings.
 *
 * @param {object} params
 * @param {string}   params.merchantEmail     - Merchant email address
 * @param {string}   params.shopName          - Shop name
 * @param {object[]} params.expiredDrafts     - Array of expired draft order summaries
 * @param {string}   params.expiredDrafts[].name  - Draft order name
 * @param {string}   params.expiredDrafts[].id    - Draft order ID
 * @param {number}   params.expiredDrafts[].ageInDays - Age in days
 * @returns {Promise<void>}
 */
export async function sendMerchantExpiryNotification({ merchantEmail, shopName, expiredDrafts }) {
  ensureInitialized();

  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL environment variable is not set.");
  }

  if (!expiredDrafts || expiredDrafts.length === 0) return;

  const draftList = expiredDrafts
    .map((d) => `  • ${d.name} (${Math.floor(d.ageInDays)} days old)`)
    .join("\n");

  const bodyText = `Hi,

Draft Order Nudge has expired ${expiredDrafts.length} draft order${expiredDrafts.length > 1 ? "s" : ""} for ${shopName}:

${draftList}

These draft orders have been tagged "expired" in your Shopify admin.

To adjust the expiry threshold or email template, open the Draft Order Nudge app in your Shopify admin.

— Draft Order Nudge`;

  const msg = {
    to: merchantEmail,
    from: fromEmail,
    subject: `[${shopName}] ${expiredDrafts.length} draft order${expiredDrafts.length > 1 ? "s" : ""} expired`,
    text: bodyText,
    html: bodyText
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join(""),
  };

  await sgMail.send(msg);
}
