import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  Banner,
  Spinner,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { scanInstalledApps } from "../lib/scanner/app-scanner.server";
import { scanLiquidFiles } from "../lib/scanner/liquid-scanner.server";
import { buildReport } from "../lib/scanner/report-builder.server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load compatibility database once at module level
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "../../database/compatibility-db.json");

let compatibilityDb;
try {
  compatibilityDb = JSON.parse(readFileSync(DB_PATH, "utf-8"));
} catch (err) {
  throw new Error(`Failed to load compatibility database from ${DB_PATH}: ${err.message}`);
}

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const accessToken = session.accessToken;

  let auditId;

  try {
    // Create an in-progress audit record so we have an ID to redirect to
    const auditRecord = await prisma.auditRun.create({
      data: {
        shop,
        status: "running",
        appResults: "[]",
        liquidResults: "[]",
        summary: "{}",
      },
    });
    auditId = auditRecord.id;

    // Run both scanners
    const [appResults, liquidScanOutput] = await Promise.all([
      scanInstalledApps(admin, compatibilityDb),
      scanLiquidFiles(shop, accessToken),
    ]);

    // Build the report
    const report = buildReport(appResults, liquidScanOutput, shop);

    // Persist results
    await prisma.auditRun.update({
      where: { id: auditId },
      data: {
        status: "complete",
        themeId: liquidScanOutput.activeTheme?.id ?? null,
        themeName: liquidScanOutput.activeTheme?.name ?? null,
        appResults: JSON.stringify(report.appResults),
        liquidResults: JSON.stringify(report.liquidResults),
        summary: JSON.stringify(report.summary),
      },
    });

    return redirect(`/app/audit/${auditId}`);
  } catch (err) {
    // If we have an audit record, mark it as errored
    if (auditId) {
      await prisma.auditRun.update({
        where: { id: auditId },
        data: {
          status: "error",
          errorMessage: err.message,
        },
      }).catch(() => {});
    }

    return json(
      {
        error: `Audit failed: ${err.message}. Please ensure the app has read_apps and read_themes permissions and try again.`,
      },
      { status: 500 }
    );
  }
};

export default function NewAudit() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const isSubmitting = navigation.state === "submitting";

  function handleRunAudit() {
    submit({}, { method: "POST" });
  }

  return (
    <Page
      title="Run New Audit"
      backAction={{ content: "Back", url: "/app" }}
    >
      <Layout>
        {actionData?.error && (
          <Layout.Section>
            <Banner title="Audit failed" tone="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">What happens during the audit</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                This audit will take approximately 30–60 seconds to complete. During the scan:
              </Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  1. All installed apps are fetched via the Shopify Admin API and
                  cross-referenced against our compatibility database.
                </Text>
                <Text as="p" variant="bodyMd">
                  2. Your active theme's Liquid files are read and scanned for classic
                  customer account constructs that break with New Customer Accounts.
                </Text>
                <Text as="p" variant="bodyMd">
                  3. A report is generated showing exactly what needs attention before
                  you switch, with estimated developer hours to resolve each issue.
                </Text>
              </BlockStack>

              <Banner tone="info">
                <p>
                  <strong>Note:</strong> This audit reads your app list and theme files. It does
                  not modify anything. The scan is read-only.
                </p>
              </Banner>

              <InlineStack>
                {isSubmitting ? (
                  <InlineStack gap="300" align="center">
                    <Spinner size="small" />
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Scanning your store… this may take up to 60 seconds.
                    </Text>
                  </InlineStack>
                ) : (
                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleRunAudit}
                    disabled={isSubmitting}
                  >
                    Start Audit
                  </Button>
                )}
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
