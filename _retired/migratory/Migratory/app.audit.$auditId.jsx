import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  DataTable,
  Banner,
  BlockStack,
  InlineStack,
  Button,
  Divider,
  Box,
  Tooltip,
  Link,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const { auditId } = params;

  const audit = await prisma.auditRun.findUnique({
    where: { id: auditId },
  });

  if (!audit || audit.shop !== shop) {
    throw new Response("Audit not found", { status: 404 });
  }

  let appResults = [];
  let liquidResults = [];
  let summary = {};

  try { appResults = JSON.parse(audit.appResults); } catch {}
  try { liquidResults = JSON.parse(audit.liquidResults); } catch {}
  try { summary = JSON.parse(audit.summary); } catch {}

  return json({
    auditId: audit.id,
    shop: audit.shop,
    createdAt: audit.createdAt,
    status: audit.status,
    errorMessage: audit.errorMessage,
    themeName: audit.themeName,
    appResults,
    liquidResults,
    summary,
  });
};

const RISK_BADGE_TONE = {
  low: "success",
  medium: "warning",
  high: "critical",
  critical: "critical",
};

const STATUS_BADGE_TONE = {
  compatible: "success",
  incompatible: "critical",
  partial: "warning",
  unknown: "info",
};

const STATUS_BADGE_LABEL = {
  compatible: "Compatible",
  incompatible: "Incompatible",
  partial: "Partial",
  unknown: "Unknown",
};

const SEVERITY_BADGE_TONE = {
  high: "critical",
  medium: "warning",
};

export default function AuditReport() {
  const {
    auditId,
    shop,
    createdAt,
    status,
    errorMessage,
    themeName,
    appResults,
    liquidResults,
    summary,
  } = useLoaderData();
  const navigate = useNavigate();

  if (status === "error") {
    return (
      <Page
        title="Audit Failed"
        backAction={{ content: "Back to Audits", url: "/app" }}
      >
        <Layout>
          <Layout.Section>
            <Banner title="The audit encountered an error" tone="critical">
              <p>{errorMessage ?? "An unknown error occurred during the audit."}</p>
              <p>Please try running a new audit. If the problem persists, ensure the app has read_apps and read_themes permissions.</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const riskLevel = summary.riskLevel ?? "unknown";
  const formattedDate = new Date(createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ---------------------------------------------------------------------------
  // App results table rows
  // ---------------------------------------------------------------------------
  const appRows = [...appResults]
    .sort((a, b) => {
      const order = { incompatible: 0, partial: 1, unknown: 2, compatible: 3 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    })
    .map((app) => [
      app.appName,
      app.developerName ?? "—",
      <Badge tone={STATUS_BADGE_TONE[app.status] ?? "info"}>
        {STATUS_BADGE_LABEL[app.status] ?? app.status}
      </Badge>,
      app.notes ? (
        <Tooltip content={app.notes}>
          <Text as="span" variant="bodySm" tone="subdued">
            {app.notes.length > 60 ? `${app.notes.slice(0, 57)}…` : app.notes}
          </Text>
        </Tooltip>
      ) : "—",
      app.estimatedResolveHours != null && app.status !== "compatible"
        ? `${app.estimatedResolveHours}h`
        : "—",
    ]);

  // ---------------------------------------------------------------------------
  // Liquid results table rows (flattened: one row per finding)
  // ---------------------------------------------------------------------------
  const liquidRows = liquidResults.flatMap((fileResult) =>
    fileResult.findings.map((finding) => [
      <Text as="span" variant="bodySm" fontWeight="medium">
        {fileResult.file}
      </Text>,
      <Badge tone={SEVERITY_BADGE_TONE[finding.severity] ?? "info"}>
        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
      </Badge>,
      finding.label,
      `${finding.matchCount} occurrence${finding.matchCount !== 1 ? "s" : ""}`,
    ])
  );

  return (
    <Page
      title="Migration Audit Report"
      subtitle={`${shop} · ${formattedDate} · Theme: ${themeName ?? "Unknown"}`}
      backAction={{ content: "All Audits", url: "/app" }}
      secondaryActions={[
        {
          content: "Download PDF",
          onAction: () => {
            window.open(`/app/audit/${auditId}/pdf`, "_blank");
          },
        },
        {
          content: "Run New Audit",
          onAction: () => navigate("/app/audit/new"),
        },
      ]}
    >
      <Layout>
        {/* ------------------------------------------------------------------ */}
        {/* Summary Banner                                                       */}
        {/* ------------------------------------------------------------------ */}
        <Layout.Section>
          <Banner
            title={`Overall Migration Risk: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`}
            tone={
              riskLevel === "low"
                ? "success"
                : riskLevel === "medium"
                ? "warning"
                : "critical"
            }
          >
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                {riskLevel === "low" &&
                  "No major compatibility issues detected. Review the full report before switching."}
                {riskLevel === "medium" &&
                  "Some apps are not in our database and require manual verification. Review before switching."}
                {riskLevel === "high" &&
                  "One or more apps require action before you can safely switch to New Customer Accounts."}
                {riskLevel === "critical" &&
                  "Critical compatibility issues found. Do not switch to New Customer Accounts until these are resolved."}
              </Text>
              {summary.estimatedDeveloperHours > 0 && (
                <Text as="p" variant="bodyMd">
                  <strong>Estimated developer time to resolve: {summary.estimatedDeveloperHours} hours</strong>
                </Text>
              )}
            </BlockStack>
          </Banner>
        </Layout.Section>

        {/* ------------------------------------------------------------------ */}
        {/* Summary Cards                                                        */}
        {/* ------------------------------------------------------------------ */}
        <Layout.Section>
          <Layout>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Apps Scanned</Text>
                  <Text as="p" variant="headingXl">{summary.totalAppsScanned ?? 0}</Text>
                  <BlockStack gap="100">
                    <InlineStack gap="200">
                      <Badge tone="success">{summary.appsCompatible ?? 0} Compatible</Badge>
                      <Badge tone="critical">{summary.appsIncompatible ?? 0} Incompatible</Badge>
                    </InlineStack>
                    <InlineStack gap="200">
                      <Badge tone="warning">{summary.appsPartial ?? 0} Partial</Badge>
                      <Badge tone="info">{summary.appsUnknown ?? 0} Unknown</Badge>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Liquid Findings</Text>
                  <Text as="p" variant="headingXl">
                    {summary.highSeverityLiquidFindings + summary.mediumSeverityLiquidFindings ?? 0}
                  </Text>
                  <BlockStack gap="100">
                    <Badge tone="critical">{summary.highSeverityLiquidFindings ?? 0} High severity</Badge>
                    <Badge tone="warning">{summary.mediumSeverityLiquidFindings ?? 0} Medium severity</Badge>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Est. Dev Hours</Text>
                  <Text as="p" variant="headingXl">{summary.estimatedDeveloperHours ?? 0}h</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Based on flagged issues and typical resolution time.
                    Actual hours may vary.
                  </Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* ------------------------------------------------------------------ */}
        {/* App Compatibility Table                                              */}
        {/* ------------------------------------------------------------------ */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">App Compatibility</Text>
              {summary.appsNotInDatabase > 0 && (
                <Banner tone="info">
                  <p>
                    <strong>{summary.appsNotInDatabase} apps</strong> were not found in our
                    compatibility database and are marked Unknown. These apps require manual
                    verification before you switch.
                  </p>
                </Banner>
              )}

              {appRows.length === 0 ? (
                <EmptyState heading="No apps found">
                  <p>No installed apps were detected on this store.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text", "numeric"]}
                  headings={["App", "Developer", "Status", "Notes", "Est. Hours"]}
                  rows={appRows}
                  sortable={[false, false, false, false, true]}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* ------------------------------------------------------------------ */}
        {/* Liquid Theme Findings                                                */}
        {/* ------------------------------------------------------------------ */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Liquid Theme Findings</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                The following classic account constructs were found in your active theme
                ({themeName ?? "Unknown"}). These will stop working after the migration.
              </Text>

              {liquidRows.length === 0 ? (
                <Banner tone="success">
                  <p>
                    No classic account Liquid patterns detected in your active theme.
                  </p>
                </Banner>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "numeric"]}
                  headings={["File", "Severity", "Finding", "Count"]}
                  rows={liquidRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* ------------------------------------------------------------------ */}
        {/* Detailed Liquid Findings with snippets                              */}
        {/* ------------------------------------------------------------------ */}
        {liquidResults.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">Liquid Finding Details</Text>
                {liquidResults.map((fileResult) => (
                  <BlockStack key={fileResult.file} gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="medium">
                      {fileResult.file}
                    </Text>
                    {fileResult.findings.map((finding) => (
                      <Box
                        key={finding.patternId}
                        padding="300"
                        background={finding.severity === "high" ? "bg-fill-critical-secondary" : "bg-fill-warning-secondary"}
                        borderRadius="200"
                      >
                        <BlockStack gap="200">
                          <InlineStack gap="200" align="start">
                            <Badge tone={finding.severity === "high" ? "critical" : "warning"}>
                              {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                            </Badge>
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {finding.label}
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              ({finding.matchCount} occurrence{finding.matchCount !== 1 ? "s" : ""})
                            </Text>
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {finding.description}
                          </Text>
                          {finding.snippet && (
                            <Box
                              padding="200"
                              background="bg-fill-secondary"
                              borderRadius="100"
                            >
                              <Text as="p" variant="bodySm" fontFamily="mono">
                                {finding.snippet}
                              </Text>
                            </Box>
                          )}
                        </BlockStack>
                      </Box>
                    ))}
                    <Divider />
                  </BlockStack>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Disclaimer                                                           */}
        {/* Source requirement: disclaimer language about unknown-status apps    */}
        {/* ------------------------------------------------------------------ */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Important Disclaimer</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                This report is generated by automated pattern matching and database lookup.{" "}
                <strong>
                  {summary.appsNotInDatabase} of {summary.totalAppsScanned} installed apps
                  were not found in the compatibility database and are marked "Unknown."
                </strong>{" "}
                An all-clear result means only that no patterns were detected and that matched
                apps are currently listed as compatible in our database. It does not guarantee
                your store will be unaffected by the migration.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Before switching, always: (1) test the migration in a development store,
                (2) verify compatibility with app vendors directly for unknown-status apps, and
                (3) review{" "}
                <Link
                  url="https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts"
                  external
                >
                  Shopify's official New Customer Accounts documentation
                </Link>
                .
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
