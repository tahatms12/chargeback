import nodemailer from "nodemailer";
import prisma from "../db.server.js";

/**
 * Replaces template variables in a string.
 * Supported: {{order_name}}, {{customer_name}}, {{stage_name}}, {{shop_name}}
 */
export function renderTemplate(template, vars) {
  return template
    .replace(/\{\{order_name\}\}/g, vars.orderName ?? "")
    .replace(/\{\{customer_name\}\}/g, vars.customerName ?? "there")
    .replace(/\{\{stage_name\}\}/g, vars.stageName ?? "")
    .replace(/\{\{shop_name\}\}/g, vars.shopName ?? "");
}

/**
 * Adds an email job to the queue. Does not send immediately.
 *
 * @param {string} shop
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.orderName
 * @param {string} params.toEmail
 * @param {string|null} params.toName
 * @param {string} params.subject
 * @param {string} params.body
 */
export async function queueEmail(shop, { orderId, orderName, toEmail, toName, subject, body }) {
  return prisma.emailQueue.create({
    data: {
      shop,
      orderId,
      orderName,
      toEmail,
      toName: toName ?? null,
      subject,
      body,
      status: "pending",
    },
  });
}

/**
 * Creates a nodemailer transport from shop SMTP settings.
 * Returns null if settings are incomplete.
 */
export function createTransport(settings) {
  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: (settings.smtpPort || 587) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });
}

/**
 * Sends a single email via nodemailer.
 *
 * @param {nodemailer.Transporter} transport
 * @param {Object} settings - ShopSettings record for from address
 * @param {Object} emailData - EmailQueue record
 * @returns {Promise<void>}
 */
export async function sendEmail(transport, settings, emailData) {
  await transport.sendMail({
    from: settings.smtpFromName
      ? `"${settings.smtpFromName}" <${settings.smtpFrom || settings.smtpUser}>`
      : settings.smtpFrom || settings.smtpUser,
    to: emailData.toName
      ? `"${emailData.toName}" <${emailData.toEmail}>`
      : emailData.toEmail,
    subject: emailData.subject,
    text: emailData.body,
    // html version is plain text wrapped — merchant-configured body
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap;">${emailData.body}</pre>`,
  });
}

/**
 * Processes all pending emails for a shop using the shop's SMTP settings.
 * Marks each as sent or failed.
 * Called synchronously inside the move-order action — processes one batch per call.
 *
 * Batch safety: processes up to 10 pending emails per call to stay within SMTP rate limits.
 *
 * @param {string} shop
 * @returns {Promise<{ sent: number, failed: number }>}
 */
export async function processEmailQueue(shop) {
  const settings = await prisma.shopSettings.findUnique({ where: { shop } });

  const transport = createTransport(settings);
  if (!transport) {
    // No SMTP configured — leave queue as-is
    return { sent: 0, failed: 0, reason: "smtp_not_configured" };
  }

  const pending = await prisma.emailQueue.findMany({
    where: { shop, status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  let sent = 0;
  let failed = 0;

  for (const job of pending) {
    try {
      await sendEmail(transport, settings, job);
      await prisma.emailQueue.update({
        where: { id: job.id },
        data: { status: "sent", processedAt: new Date() },
      });
      sent++;
    } catch (err) {
      const attempts = job.attempts + 1;
      await prisma.emailQueue.update({
        where: { id: job.id },
        data: {
          status: attempts >= 3 ? "failed" : "pending",
          attempts,
          error: err.message,
          processedAt: new Date(),
        },
      });
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Sends a test email to verify SMTP settings.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function sendTestEmail(settings, toEmail) {
  const transport = createTransport(settings);
  if (!transport) {
    return { ok: false, error: "SMTP settings are incomplete." };
  }

  try {
    await sendEmail(transport, settings, {
      toEmail,
      toName: null,
      subject: "Maker Queue — SMTP test",
      body: "This is a test email from Maker Queue. Your SMTP settings are working correctly.",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
