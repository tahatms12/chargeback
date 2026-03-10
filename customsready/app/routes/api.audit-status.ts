// app/routes/api.audit-status.ts
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const run = await db.auditRun.findFirst({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
  });

  if (!run) {
    return json({ status: "none", progress: 0, processedVariants: 0, totalVariants: 0 });
  }

  const progress =
    run.totalVariants > 0
      ? Math.round((run.processedVariants / run.totalVariants) * 100)
      : run.status === "completed"
      ? 100
      : 0;

  return json({
    status: run.status,
    progress,
    processedVariants: run.processedVariants,
    totalVariants: run.totalVariants,
    completedAt: run.completedAt,
    errorSummary: run.errorSummary,
  });
};
