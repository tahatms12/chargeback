// app/queue.server.ts
// Implementation choice: DB-backed email queue with configurable per-send delay.
// Source requirement: batch-safe email queueing to avoid rate limits when merchant
// moves many orders at once.
//
// Two execution modes:
//   1. In-process polling loop (started from entry.server.tsx on boot)
//   2. HTTP-triggered batch via GET /api/email-queue (for cron jobs)

import { db } from "./db.server";
import { sendQueuedEmail } from "./email.server";

const BATCH_SIZE = Number(process.env.EMAIL_QUEUE_BATCH_SIZE || 10);
const SEND_DELAY_MS = Number(process.env.EMAIL_SEND_DELAY_MS || 1000);
const POLL_INTERVAL_MS = Number(process.env.EMAIL_QUEUE_POLL_MS || 30_000);

// Guard against concurrent runs (single-server deployment)
let processorRunning = false;

/**
 * Process up to BATCH_SIZE pending emails, one per SEND_DELAY_MS.
 * Returns a summary of what was processed.
 */
export async function processEmailQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  if (processorRunning) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  processorRunning = true;
  let sent = 0;
  let failed = 0;

  try {
    const pending = await db.emailQueue.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true },
    });

    for (const { id } of pending) {
      try {
        await sendQueuedEmail(id);
        sent++;
      } catch {
        failed++;
      }
      // Rate-limit: wait between sends
      if (pending.indexOf({ id } as (typeof pending)[0]) < pending.length - 1) {
        await delay(SEND_DELAY_MS);
      }
    }

    return { processed: pending.length, sent, failed };
  } finally {
    processorRunning = false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start an in-process polling loop.
 * Called once from entry.server.tsx.
 * Does not crash the server if email sending fails.
 */
export function startEmailQueuePoller(): void {
  if (process.env.NODE_ENV === "test") return;

  const run = async () => {
    try {
      const result = await processEmailQueue();
      if (result.processed > 0) {
        console.log(
          `[email-queue] processed=${result.processed} sent=${result.sent} failed=${result.failed}`
        );
      }
    } catch (err) {
      console.error("[email-queue] Processor error:", err);
    }
  };

  // Run immediately on boot, then on interval
  run();
  setInterval(run, POLL_INTERVAL_MS);
}
