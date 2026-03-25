import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { BlockStack, Banner, Button, Card, InlineStack, Layout, Modal, Page, Text } from "@shopify/polaris";
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
  try {
    rowsUsed = await getUsageForMonth(session.shop, month);
  } catch (err) {
    console.warn("[app._index] DB fetch failed:", err);
  }

  const { hasActivePayment } = await billing.check({
    plans: [PAID_PLAN_NAME],
    isTest: true,
  });

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

  // Push-to-store state
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ created: number; failed: number; errors: { title: string; messages: string[] }[] } | null>(null);

  const submit = useSubmit();
  const nav = useNavigation();
  const { t, locale } = useI18n();

  const isFixing = nav.state === "submitting" && nav.formData?.get("intent") === "fix";
  const fixedCsv = (actionData as any)?.fixedCsv as string | null ?? null;

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

                  {/* Push result banner */}
                  {pushResult ? (
                    <Banner
                      title={pushResult.failed === 0
                        ? `✓ ${pushResult.created} product${pushResult.created !== 1 ? "s" : ""} added to your store`
                        : `${pushResult.created} added · ${pushResult.failed} failed`}
                      tone={pushResult.failed === 0 ? "success" : "warning"}
                    >
                      {pushResult.errors.length > 0 && (
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
                      )}
                    </Banner>
                  ) : null}

                  {/* Action buttons */}
                  {!fixedCsv && !result.passed ? (
                    <Button variant="primary" loading={isFixing} onClick={handleFix}>
                      Fix & Enrich
                    </Button>
                  ) : null}

                  {fixedCsv ? (
                    <InlineStack gap="300">
                      <Button variant="primary" tone="success" onClick={handleDownload}>
                        Download Shopify CSV
                      </Button>
                      <Button variant="primary" loading={isPushing} onClick={() => setIsPushModalOpen(true)}>
                        Push to Store
                      </Button>
                    </InlineStack>
                  ) : null}
                </BlockStack>
              </Card>
            ) : null}
          </BlockStack>
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
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsPushModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p">
              This will create new products directly in your Shopify store using the enriched CSV data.
            </Text>
            <Text as="p" tone="subdued">
              Each product handle is treated as unique — existing products with the same handle will not be overwritten. Remaining products will continue if any individual product fails.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
