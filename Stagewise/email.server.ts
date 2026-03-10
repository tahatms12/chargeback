// app/email.server.ts
// Implementation choice: outbound email via nodemailer + merchant-configured SMTP.
// Rationale: Shopify has no public API for arbitrary transactional order emails
// on non-Plus plans. Merchant SMTP is the only reliable mechanism without a
// third-party email service dependency.

import nodemailer from "nodemailer";
import { db } from "./db.server";

export interface EmailTemplateVars {
  orderNumber: string;
  customerName: string;
  stageName: string;
  shopName: string;
  shopDomain: string;
}

/**
 * Interpolate {{variable}} placeholders in a template string.
 */
export function interpolate(template: string, vars: EmailTemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return (vars as Record<string, string>)[key] ?? `{{${key}}}`;
  });
}

/**
 * Build a transporter for the given shop's SMTP settings.
 * Returns null if the shop has not configured SMTP.
 */
async function buildTransporter(shopDomain: string): Promise<nodemailer.Transporter | null> {
  const settings = await db.emailSettings.findUnique({ where: { shopDomain } });
  if (!settings || !settings.smtpHost || !settings.fromEmail) {
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth:
      settings.smtpUser && settings.smtpPass
        ? { user: settings.smtpUser, pass: settings.smtpPass }
        : undefined,
  });
}

/**
 * Send a single email for a queue record.
 * Updates the queue record status on success or failure.
 */
export async function sendQueuedEmail(queueId: string): Promise<void> {
  const record = await db.emailQueue.findUnique({ where: { id: queueId } });
  if (!record) return;

  await db.emailQueue.update({
    where: { id: queueId },
    data: { attempts: { increment: 1 } },
  });

  const settings = await db.emailSettings.findUnique({
    where: { shopDomain: record.shopDomain },
  });

  if (!settings?.smtpHost || !settings?.fromEmail) {
    await db.emailQueue.update({
      where: { id: queueId },
      data: {
        status: "failed",
        error: "SMTP not configured. Visit Settings to add email configuration.",
      },
    });
    return;
  }

  const transporter = await buildTransporter(record.shopDomain);
  if (!transporter) {
    await db.emailQueue.update({
      where: { id: queueId },
      data: { status: "failed", error: "Failed to build SMTP transporter." },
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: record.customerEmail,
      subject: record.subject,
      html: record.body,
    });

    await db.emailQueue.update({
      where: { id: queueId },
      data: { status: "sent", sentAt: new Date(), error: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.emailQueue.update({
      where: { id: queueId },
      data: { status: "failed", error: message },
    });
    throw err;
  }
}

/**
 * Add an email to the persistent send queue.
 * Called immediately when an order moves to a stage that has sendEmail=true.
 */
export async function enqueueStageEmail({
  shopDomain,
  orderId,
  orderNumber,
  customerEmail,
  subject,
  body,
}: {
  shopDomain: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  subject: string;
  body: string;
}): Promise<void> {
  await db.emailQueue.create({
    data: {
      shopDomain,
      orderId,
      orderNumber,
      customerEmail,
      subject,
      body,
      status: "pending",
    },
  });
}

/**
 * Test the SMTP connection for a store.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export async function testSmtpConnection(
  shopDomain: string
): Promise<{ ok: boolean; error?: string }> {
  const transporter = await buildTransporter(shopDomain);
  if (!transporter) {
    return { ok: false, error: "SMTP not configured." };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
