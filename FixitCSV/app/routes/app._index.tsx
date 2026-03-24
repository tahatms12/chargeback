import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { BlockStack, Card, Layout, Page, Text, Button } from "@shopify/polaris";
import { useState } from "react";
import { CsvUploader } from "~/components/CsvUploader";
import { ErrorTable } from "~/components/ErrorTable";
import { LanguageSelector } from "~/components/LanguageSelector";
import { UsageBanner } from "~/components/UsageBanner";
import { useI18n } from "~/lib/i18n";
import { FREE_TIER_ROW_LIMIT, PAID_PLAN_NAME } from "~/lib/shopify-csv-spec";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { getUsageForMonth, incrementUsage } from "~/lib/usage.server";
import { authenticate } from "~/shopify.server";
import { repairCsvWithGemini } from "~/lib/gemini.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const month = new Date().toISOString().slice(0, 7);
  
  let rowsUsed = 0;
  try {
    rowsUsed = await getUsageForMonth(session.shop, month);
  } catch (err) {
    console.warn('[app._index] DB fetch failed:', err);
  }
  
  const { hasActivePayment } = await billing.check({
    plans: [PAID_PLAN_NAME],
    isTest: true,
  });
  
  return json({ rowsUsed, rowLimit: FREE_TIER_ROW_LIMIT, hasPlan: Boolean(hasActivePayment) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  
  const intent = form.get("intent");
  if (intent === "fix") {
    const csv = form.get("csv") as string;
    const locale = (form.get("locale") as string) || "en";
    try {
      const fixedCsv = await repairCsvWithGemini(csv, locale as any);
      return json({ ok: true, fixedCsv });
    } catch (err: any) {
      return json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  const rows = Number(form.get("rows") || 0);
  if (rows > 0) {
    const month = new Date().toISOString().slice(0, 7);
    await incrementUsage(session.shop, month, rows);
  }
  return json({ ok: true, fixedCsv: null });
};

export default function Index() {
  const { rowsUsed, rowLimit, hasPlan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [rawCsv, setRawCsv] = useState<string | null>(null);
  const submit = useSubmit();
  const nav = useNavigation();
  const { t, locale } = useI18n();

  const isFixing = nav.state === "submitting" && nav.formData?.get("intent") === "fix";
  const fixedCsv = (actionData as any)?.fixedCsv;

  const onDone = (res: ValidationResult, text: string) => {
    setResult(res);
    setRawCsv(text);
    const fd = new FormData();
    fd.set("rows", String(res.totalRows));
    submit(fd, { method: "POST" });
  };

  const handleFix = () => {
    if (!rawCsv) return;
    const fd = new FormData();
    fd.set("intent", "fix");
    fd.set("csv", rawCsv);
    fd.set("locale", locale);
    submit(fd, { method: "POST" });
  };

  const handleDownload = () => {
    if (!fixedCsv) return;
    const blob = new Blob([fixedCsv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixed-products.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Page title={t("page.title")} titleMetadata={<LanguageSelector />}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <UsageBanner hasPlan={hasPlan} rowsUsed={rowsUsed} rowLimit={rowLimit} />
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">{t("upload.title")}</Text>
                <Text as="p" tone="subdued">{t("upload.desc")}</Text>
                <CsvUploader rowsUsed={rowsUsed} rowLimit={rowLimit} hasPlan={hasPlan} onDone={onDone} />
              </BlockStack>
            </Card>
            {result ? (
              <Card>
                <BlockStack gap="300">
                  <ErrorTable result={result} />
                  {!result.passed && !fixedCsv ? (
                    <Button variant="primary" loading={isFixing} onClick={handleFix}>Auto-Fix with Gemini AI</Button>
                  ) : null}
                  {fixedCsv ? (
                    <Button variant="primary" tone="success" onClick={handleDownload}>Download Fixed CSV</Button>
                  ) : null}
                </BlockStack>
              </Card>
            ) : null}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
