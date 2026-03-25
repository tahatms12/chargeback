import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Divider,
  InlineStack,
  Layout,
  Modal,
  Page,
  ProgressBar,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { CsvUploader } from "~/components/CsvUploader";
import { ErrorTable } from "~/components/ErrorTable";
import { LanguageSelector } from "~/components/LanguageSelector";
import { UsageBanner } from "~/components/UsageBanner";
import { useI18n } from "~/lib/i18n";
import { FREE_TIER_ROW_LIMIT, PAID_PLAN_NAME } from "~/lib/shopify-csv-spec";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { getUsageForMonth, incrementUsage } from "~/lib/usage.server";
import { authenticate } from "~/shopify.server";
import { processAndEnrichCsv } from "~/lib/gemini.server";

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const month = new Date().toISOString().slice(0, 7);
  let rowsUsed = 0;
  try { rowsUsed = await getUsageForMonth(session.shop, month); } catch {}
  const { hasActivePayment } = await billing.check({ plans: [PAID_PLAN_NAME], isTest: true });
  return json({ rowsUsed, rowLimit: FREE_TIER_ROW_LIMIT, hasPlan: Boolean(hasActivePayment) });
};

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "fix") {
    const csv = form.get("csv") as string;
    const locale = (form.get("locale") as string) || "en";
    try {
      const fixedCsv = await processAndEnrichCsv(csv, locale as any);
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Index() {
  const { rowsUsed, rowLimit, hasPlan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [rawCsv, setRawCsv] = useState<string | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    created: number; failed: number; errors: { title: string; messages: string[] }[];
  } | null>(null);

  const submit = useSubmit();
  const nav = useNavigation();
  const { t, locale } = useI18n();

  const isFixing = nav.state === "submitting" && nav.formData?.get("intent") === "fix";
  const fixedCsv = (actionData as any)?.fixedCsv as string | null ?? null;
  const fixError = (actionData as any)?.error as string | null ?? null;

  const onDone = (res: ValidationResult, text: string) => {
    setResult(res);
    setRawCsv(text);
    setPushResult(null);
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
    a.download = "shopify-products.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePushToStore = useCallback(async () => {
    if (!fixedCsv) return;
    setIsPushing(true);
    setPushResult(null);
    try {
      const fd = new FormData();
      fd.set("csv", fixedCsv);
      const response = await fetch("/app/push", { method: "POST", body: fd });
      const data = await response.json();
      setPushResult(data);
    } catch (err: any) {
      setPushResult({ created: 0, failed: 1, errors: [{ title: "Network error", messages: [err.message] }] });
    } finally {
      setIsPushing(false);
      setIsPushModalOpen(false);
    }
  }, [fixedCsv]);

  // Determine what stage we're in
  const stage: "idle" | "validated" | "enriched" = fixedCsv ? "enriched" : result ? "validated" : "idle";

  return (
    <Page
      title="FixitCSV"
      subtitle="Upload any product CSV — we normalize, enrich, and push it to your store."
      titleMetadata={<LanguageSelector />}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Usage banner */}
            <UsageBanner hasPlan={hasPlan} rowsUsed={rowsUsed} rowLimit={rowLimit} />

            {/* Step 1: Upload */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Step 1 — Upload your CSV</Text>
                    <Text as="p" tone="subdued">
                      Any format works: Shopify export, WooCommerce, supplier files, or custom spreadsheets.
                    </Text>
                  </BlockStack>
                  {stage !== "idle" && <Badge tone="success">✓ Uploaded</Badge>}
                </InlineStack>
                <CsvUploader rowsUsed={rowsUsed} rowLimit={rowLimit} hasPlan={hasPlan} onDone={onDone} />
              </BlockStack>
            </Card>

            {/* Step 2: Review + Fix */}
            {result ? (
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd">Step 2 — Review &amp; Enrich</Text>
                      <Text as="p" tone="subdued">
                        {result.passed
                          ? "Your CSV is valid. Click Fix & Enrich to normalize headers and let AI fill in any missing product details."
                          : "Issues detected. Click Fix & Enrich to auto-correct headers, fill missing fields, and produce a clean Shopify-ready file."}
                      </Text>
                    </BlockStack>
                    {stage === "enriched" && <Badge tone="success">✓ Enriched</Badge>}
                  </InlineStack>

                  <ErrorTable result={result} isEnriched={stage === "enriched"} />

                  {/* Fix error */}
                  {fixError ? (
                    <Banner tone="critical">
                      <Text as="p">Enrichment failed: {fixError}. Please try again.</Text>
                    </Banner>
                  ) : null}

                  {/* Progress indicator while fixing */}
                  {isFixing ? (
                    <BlockStack gap="200">
                      <Text as="p" tone="subdued">Normalizing headers and enriching missing data…</Text>
                      <ProgressBar progress={undefined as any} size="small" />
                    </BlockStack>
                  ) : null}

                  {!fixedCsv && !isFixing ? (
                    <Button variant="primary" size="large" loading={isFixing} onClick={handleFix} fullWidth>
                      Fix &amp; Enrich
                    </Button>
                  ) : null}
                </BlockStack>
              </Card>
            ) : null}

            {/* Step 3: Download or Push */}
            {fixedCsv ? (
              <Card>
                <BlockStack gap="300">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Step 3 — Export or Push to Store</Text>
                    <Text as="p" tone="subdued">
                      Your CSV is clean, enriched, and in Shopify's exact column format. Choose what to do next.
                    </Text>
                  </BlockStack>

                  <Divider />

                  {/* Push result */}
                  {pushResult ? (
                    <Banner
                      tone={pushResult.failed === 0 ? "success" : pushResult.created > 0 ? "warning" : "critical"}
                      title={
                        pushResult.failed === 0
                          ? `✓ ${pushResult.created} product${pushResult.created !== 1 ? "s" : ""} added to your store successfully`
                          : `${pushResult.created} added · ${pushResult.failed} failed`
                      }
                    >
                      {pushResult.errors.length > 0 ? (
                        <BlockStack gap="100">
                          {pushResult.errors.slice(0, 5).map((e, i) => (
                            <Text key={i} as="p" tone="subdued">
                              <strong>{e.title}</strong>: {e.messages.join("; ")}
                            </Text>
                          ))}
                          {pushResult.errors.length > 5 && (
                            <Text as="p" tone="subdued">…and {pushResult.errors.length - 5} more</Text>
                          )}
                        </BlockStack>
                      ) : null}
                    </Banner>
                  ) : null}

                  <InlineStack gap="300" align="start">
                    <Tooltip content="Download a Shopify-compatible CSV file to import manually">
                      <Button size="large" onClick={handleDownload}>
                        Download Shopify CSV
                      </Button>
                    </Tooltip>
                    <Tooltip content="Create these products directly in your Shopify store — no import needed">
                      <Button variant="primary" size="large" loading={isPushing} onClick={() => setIsPushModalOpen(true)}>
                        Push to Store
                      </Button>
                    </Tooltip>
                  </InlineStack>
                </BlockStack>
              </Card>
            ) : null}
          </BlockStack>
        </Layout.Section>

        {/* Sidebar help */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">What FixitCSV does</Text>
              <BlockStack gap="100">
                <Text as="p" tone="subdued">✓ Accepts any CSV format — supplier exports, WooCommerce, Google Sheets</Text>
                <Text as="p" tone="subdued">✓ Normalizes 170+ alternate column names to Shopify format</Text>
                <Text as="p" tone="subdued">✓ AI fills missing titles, descriptions, tags, and handles</Text>
                <Text as="p" tone="subdued">✓ Outputs in Shopify's exact column order</Text>
                <Text as="p" tone="subdued">✓ Push directly to your store — no manual import step</Text>
              </BlockStack>
            </BlockStack>
          </Card>

          {!hasPlan ? (
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Free tier: {rowsUsed}/{rowLimit} rows used</Text>
                <ProgressBar progress={(rowsUsed / rowLimit) * 100} size="small" tone={rowsUsed >= rowLimit ? "critical" : "highlight"} />
                <Text as="p" tone="subdued">Upgrade to Pro for unlimited rows and priority enrichment.</Text>
                <Button url="/app/billing" variant="plain">Upgrade to Pro ($7/month) →</Button>
              </BlockStack>
            </Card>
          ) : null}
        </Layout.Section>
      </Layout>

      {/* Push confirmation modal */}
      <Modal
        open={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        title="Push products to your Shopify store?"
        primaryAction={{
          content: isPushing ? "Pushing…" : "Yes, push to store",
          loading: isPushing,
          onAction: handlePushToStore,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setIsPushModalOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p">
              This will create new products directly in your Shopify store using the enriched data.
            </Text>
            <Text as="p" tone="subdued">
              Products with the same handle as an existing product will be skipped. If any product fails, the rest will still be created.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
