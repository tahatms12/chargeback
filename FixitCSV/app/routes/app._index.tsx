import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { BlockStack, Card, Layout, Page, Text } from "@shopify/polaris";
import { useState } from "react";
import { CsvUploader } from "~/components/CsvUploader";
import { ErrorTable } from "~/components/ErrorTable";
import { UsageBanner } from "~/components/UsageBanner";
import { FREE_TIER_ROW_LIMIT, PAID_PLAN_NAME } from "~/lib/shopify-csv-spec";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { getUsageForMonth, incrementUsage } from "~/lib/usage.server";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const month = new Date().toISOString().slice(0, 7);
  const rowsUsed = await getUsageForMonth(session.shop, month);
  const check = await billing.check({ plans: [PAID_PLAN_NAME], isTest: process.env.NODE_ENV !== "production" });
  return json({ rowsUsed, rowLimit: FREE_TIER_ROW_LIMIT, hasPlan: check.hasActivePayment });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const rows = Number(form.get("rows") || 0);
  if (rows > 0) {
    const month = new Date().toISOString().slice(0, 7);
    await incrementUsage(session.shop, month, rows);
  }
  return json({ ok: true });
};

export default function Index() {
  const { rowsUsed, rowLimit, hasPlan } = useLoaderData<typeof loader>();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const submit = useSubmit();

  const onDone = (res: ValidationResult) => {
    setResult(res);
    const fd = new FormData();
    fd.set("rows", String(res.totalRows));
    submit(fd, { method: "POST" });
  };

  return (
    <Page title="Shopify CSV Pre-Import Validator">
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <UsageBanner hasPlan={hasPlan} rowsUsed={rowsUsed} rowLimit={rowLimit} />
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Upload product CSV</Text>
                <Text as="p" tone="subdued">CSV validation is fully client-side. CSV contents are never stored server-side.</Text>
                <CsvUploader rowsUsed={rowsUsed} rowLimit={rowLimit} hasPlan={hasPlan} onDone={onDone} />
              </BlockStack>
            </Card>
            {result ? <ErrorTable result={result} /> : null}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
