// app/routes/app._index.tsx
import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  useFetcher,
  Link,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  DataTable,
  Badge,
  Banner,
  ProgressBar,
  EmptyState,
  BlockStack,
  InlineStack,
  Select,
  Spinner,
  Tooltip,
  Divider,
  Box,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { enqueueCatalogAudit } from "~/queue.server";
import {
  getGapSummary,
  getLatestAuditRun,
  classifyOrder,
  type OrderReadinessResult,
} from "~/lib/audit.server";
import {
  executeWithThrottling,
  RECENT_ORDERS_QUERY,
  type OrderNode,
} from "~/lib/graphql.server";
import { logger } from "~/lib/logger.server";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = "productTitle" | "missingType" | "orderCount30d" | "fixStatus";
type SortDir = "asc" | "desc";

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Billing gate
  await billing.require({
    plans: ["CustomsReady Lite Monthly"],
    onFailure: async () =>
      billing.request({ plan: "CustomsReady Lite Monthly", isTest: process.env.NODE_ENV !== "production" }),
  });

  // Summary stats from DB
  const [gapSummary, latestAuditRun, gapRecords, config] = await Promise.all([
    getGapSummary(shopDomain),
    getLatestAuditRun(shopDomain),
    db.productAuditRecord.findMany({
      where: {
        shopDomain,
        OR: [{ hasHsCode: false }, { hasCoo: false }],
      },
      orderBy: [{ orderCount30d: "desc" }, { productTitle: "asc" }],
      take: 250,
    }),
    db.configuration.findUnique({ where: { shopDomain } }),
  ]);

  // Affected international orders — fetch live from Shopify
  // Limit to 60 days; filter by shipping country != home country
  let affectedOrders: OrderReadinessResult[] = [];
  try {
    const homeCountry = config?.homeCountry ?? "US";
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 60);
    const since = sinceDate.toISOString().split("T")[0];

    const ordersData = await executeWithThrottling<{
      orders: { nodes: OrderNode[] };
    }>(
      admin.graphql,
      RECENT_ORDERS_QUERY,
      {
        first: 50,
        query: `created_at:>${since} financial_status:paid`,
        cursor: null,
      }
    );

    affectedOrders = ordersData.orders.nodes
      .filter(
        (o) =>
          o.shippingAddress?.countryCode &&
          o.shippingAddress.countryCode !== homeCountry
      )
      .map(classifyOrder)
      .filter((o) => o.readiness !== "complete")
      .slice(0, 20);
  } catch (err) {
    logger.warn(
      { shop: shopDomain, error: String(err) },
      "Failed to fetch affected orders"
    );
  }

  return json({
    shopDomain,
    gapSummary,
    latestAuditRun,
    gapRecords: gapRecords.map((r) => ({
      id: r.id,
      productId: r.productId,
      variantId: r.variantId,
      productTitle: r.productTitle,
      variantTitle: r.variantTitle,
      vendor: r.vendor,
      hasHsCode: r.hasHsCode,
      hasCoo: r.hasCoo,
      fixStatus: r.fixStatus,
      orderCount30d: r.orderCount30d,
    })),
    affectedOrders,
    hasConfig: !!config?.sellerName,
  });
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "rescan") {
    const auditRunId = await enqueueCatalogAudit(shopDomain, "manual");
    return json({ ok: true, auditRunId });
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppIndex() {
  const {
    gapSummary,
    latestAuditRun,
    gapRecords,
    affectedOrders,
    hasConfig,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Polling for audit progress
  const auditStatusFetcher = useFetcher<{
    status: string;
    progress: number;
    processedVariants: number;
    totalVariants: number;
  }>();
  const [isPolling, setIsPolling] = useState(
    latestAuditRun?.status === "running" || latestAuditRun?.status === "queued"
  );

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      auditStatusFetcher.load("/api/audit-status");
    }, 3000);
    return () => clearInterval(interval);
  }, [isPolling]);

  useEffect(() => {
    if (
      auditStatusFetcher.data?.status === "completed" ||
      auditStatusFetcher.data?.status === "failed"
    ) {
      setIsPolling(false);
    }
  }, [auditStatusFetcher.data]);

  // Sort state for gap table
  const [sortKey, setSortKey] = useState<SortKey>("orderCount30d");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedRecords = [...gapRecords].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "productTitle":
        return mult * a.productTitle.localeCompare(b.productTitle);
      case "missingType": {
        const typeA = !a.hasHsCode && !a.hasCoo ? 0 : !a.hasHsCode ? 1 : 2;
        const typeB = !b.hasHsCode && !b.hasCoo ? 0 : !b.hasHsCode ? 1 : 2;
        return mult * (typeA - typeB);
      }
      case "orderCount30d":
        return mult * (a.orderCount30d - b.orderCount30d);
      case "fixStatus": {
        const order = { needs_review: 0, under_review: 1, customs_verified: 2 };
        return (
          mult *
          ((order[a.fixStatus as keyof typeof order] ?? 0) -
            (order[b.fixStatus as keyof typeof order] ?? 0))
        );
      }
      default:
        return 0;
    }
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const auditRunning =
    isPolling ||
    latestAuditRun?.status === "running" ||
    latestAuditRun?.status === "queued";

  const progress =
    auditStatusFetcher.data?.progress ??
    (latestAuditRun?.totalVariants && latestAuditRun.totalVariants > 0
      ? Math.round(
          (latestAuditRun.processedVariants / latestAuditRun.totalVariants) *
            100
        )
      : 0);

  const lastAuditTime = latestAuditRun?.completedAt
    ? new Date(latestAuditRun.completedAt).toLocaleString()
    : "Never";

  // Gap table rows
  const tableRows = sortedRecords.map((r) => {
    const productNumericId = r.productId.split("/").pop();
    const variantNumericId = r.variantId.split("/").pop();
    const shopifyEditUrl = `shopify:admin/products/${productNumericId}`;

    const missingBadge =
      !r.hasHsCode && !r.hasCoo ? (
        <Badge tone="critical">Missing Both</Badge>
      ) : !r.hasHsCode ? (
        <Badge tone="warning">Missing HS</Badge>
      ) : (
        <Badge tone="attention">Missing COO</Badge>
      );

    const fixStatusBadge =
      r.fixStatus === "customs_verified" ? (
        <Badge tone="success">Verified</Badge>
      ) : r.fixStatus === "under_review" ? (
        <Badge tone="info">Under Review</Badge>
      ) : (
        <Badge>Needs Review</Badge>
      );

    return [
      <BlockStack gap="050" key={r.id}>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {r.productTitle}
        </Text>
        {r.variantTitle && (
          <Text variant="bodySm" tone="subdued" as="span">
            {r.variantTitle}
          </Text>
        )}
        {r.vendor && (
          <Text variant="bodySm" tone="subdued" as="span">
            {r.vendor}
          </Text>
        )}
      </BlockStack>,
      missingBadge,
      <Text as="span" alignment="center">
        {r.orderCount30d}
      </Text>,
      fixStatusBadge,
      <Button
        url={shopifyEditUrl}
        target="_blank"
        variant="plain"
        size="slim"
      >
        Fix in Shopify
      </Button>,
    ];
  });

  return (
    <Page
      title="CustomsReady Lite"
      subtitle="Audit your catalog for missing HS codes and country-of-origin data"
      primaryAction={
        <Button
          variant="primary"
          onClick={() => {
            setIsPolling(true);
          }}
          submit
          form="rescan-form"
          loading={isSubmitting || auditRunning}
          disabled={auditRunning}
        >
          {auditRunning ? "Scanning…" : "Re-scan Catalog"}
        </Button>
      }
      secondaryActions={[
        {
          content: "Export CSV",
          url: "/api/csv-export",
          external: false,
        },
        {
          content: "Settings",
          url: "/app/settings",
        },
      ]}
    >
      <form id="rescan-form" method="post">
        <input type="hidden" name="intent" value="rescan" />
      </form>

      <Layout>
        {/* Config warning */}
        {!hasConfig && (
          <Layout.Section>
            <Banner
              title="Complete your seller configuration"
              tone="warning"
              action={{ content: "Go to Settings", url: "/app/settings" }}
            >
              <Text as="p">
                Add your seller name and address so they appear on generated
                commercial invoices.
              </Text>
            </Banner>
          </Layout.Section>
        )}

        {/* Audit progress / status */}
        {auditRunning && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text variant="headingSm" as="h3">
                    Catalog audit in progress
                  </Text>
                  <Spinner size="small" />
                </InlineStack>
                <ProgressBar
                  progress={progress}
                  size="medium"
                  tone="primary"
                />
                <Text variant="bodySm" tone="subdued" as="p">
                  {auditStatusFetcher.data
                    ? `${auditStatusFetcher.data.processedVariants} of ${auditStatusFetcher.data.totalVariants} variants scanned`
                    : "Starting scan…"}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Summary cards */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <SummaryCard
              label="Total Variants"
              value={gapSummary.total}
              tone="neutral"
            />
            <SummaryCard
              label="Missing HS Code"
              value={gapSummary.missingHs + gapSummary.missingBoth}
              tone="critical"
            />
            <SummaryCard
              label="Missing COO"
              value={gapSummary.missingCoo + gapSummary.missingBoth}
              tone="warning"
            />
            <SummaryCard
              label="Missing Both"
              value={gapSummary.missingBoth}
              tone="critical"
            />
            <SummaryCard
              label="Completeness"
              value={`${gapSummary.percentage}%`}
              tone={gapSummary.percentage === 100 ? "success" : "warning"}
            />
          </InlineStack>
        </Layout.Section>

        {/* Last audit time */}
        {latestAuditRun && !auditRunning && (
          <Layout.Section>
            <Text variant="bodySm" tone="subdued" as="p">
              Last audit:{" "}
              {latestAuditRun.status === "failed"
                ? `Failed — ${latestAuditRun.errorSummary ?? "unknown error"}`
                : lastAuditTime}
            </Text>
          </Layout.Section>
        )}

        {/* Gap table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">
                  Customs Gaps
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  {gapRecords.length} variant
                  {gapRecords.length !== 1 ? "s" : ""} with missing data
                </Text>
              </InlineStack>

              {gapRecords.length === 0 ? (
                <EmptyState
                  heading="No customs gaps found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    All audited variants have HS codes and country-of-origin
                    data. Re-scan after adding new products.
                  </Text>
                </EmptyState>
              ) : (
                <>
                  {/* Sort controls */}
                  <InlineStack gap="300" wrap>
                    {(
                      [
                        ["productTitle", "Product"],
                        ["missingType", "Missing Type"],
                        ["orderCount30d", "Orders (30d)"],
                        ["fixStatus", "Fix Status"],
                      ] as [SortKey, string][]
                    ).map(([key, label]) => (
                      <Button
                        key={key}
                        variant={sortKey === key ? "primary" : "secondary"}
                        size="slim"
                        onClick={() => handleSort(key)}
                      >
                        {label}{" "}
                        {sortKey === key
                          ? sortDir === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </Button>
                    ))}
                  </InlineStack>

                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "numeric",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Product / Variant",
                      "Missing Data",
                      "Orders (30d)",
                      "Fix Status",
                      "Action",
                    ]}
                    rows={tableRows}
                    truncate
                  />
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Affected orders */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Affected International Orders
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Recent international orders with incomplete customs data (last
                60 days)
              </Text>

              {affectedOrders.length === 0 ? (
                <EmptyState
                  heading="No affected international orders"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p">
                    All recent international orders have complete customs data,
                    or there are no international orders in the past 60 days.
                  </Text>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "text",
                    "text",
                    "text",
                  ]}
                  headings={[
                    "Order",
                    "Date",
                    "Destination",
                    "Readiness",
                    "Action",
                  ]}
                  rows={affectedOrders.map((o) => {
                    const orderId = o.orderId.split("/").pop();
                    return [
                      o.orderName,
                      new Date(o.createdAt).toLocaleDateString(),
                      o.shippingCountry ?? o.shippingCountryCode ?? "—",
                      <ReadinessBadge readiness={o.readiness} key={o.orderId} />,
                      <Button
                        url={`shopify:admin/orders/${orderId}`}
                        target="_blank"
                        variant="plain"
                        size="slim"
                      >
                        View Order
                      </Button>,
                    ];
                  })}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "critical" | "warning" | "success";
}) {
  const toneMap = {
    neutral: undefined,
    critical: "critical" as const,
    warning: "warning" as const,
    success: "success" as const,
  };
  return (
    <Card>
      <BlockStack gap="100">
        <Text variant="bodySm" tone="subdued" as="p">
          {label}
        </Text>
        <Text
          variant="heading2xl"
          as="p"
          tone={toneMap[tone]}
        >
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}

function ReadinessBadge({
  readiness,
}: {
  readiness: "complete" | "partial" | "not_ready";
}) {
  if (readiness === "complete")
    return <Badge tone="success">Complete</Badge>;
  if (readiness === "partial")
    return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="critical">Not Ready</Badge>;
}
