// app/routes/api.fix-status.ts
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { z } from "zod";

const FixStatusSchema = z.object({
  recordId: z.string().min(1),
  fixStatus: z.enum(["needs_review", "under_review", "customs_verified"]),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const body = await request.json();
  const result = FixStatusSchema.safeParse(body);

  if (!result.success) {
    return json({ ok: false, error: "Invalid input" }, { status: 422 });
  }

  const { recordId, fixStatus } = result.data;

  // Ensure the record belongs to this shop (authorization check)
  const record = await db.productAuditRecord.findFirst({
    where: { id: recordId, shopDomain },
  });

  if (!record) {
    return json({ ok: false, error: "Record not found" }, { status: 404 });
  }

  await db.productAuditRecord.update({
    where: { id: recordId },
    data: { fixStatus },
  });

  return json({ ok: true });
};
