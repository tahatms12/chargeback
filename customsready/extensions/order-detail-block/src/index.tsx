// extensions/order-detail-block/src/index.tsx
import { useEffect, useState, useCallback } from "react";
import {
  reactExtension,
  useApi,
  AdminBlock,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Divider,
  Banner,
  SkeletonDisplayText,
  SkeletonBodyText,
  Box,
  Icon,
} from "@shopify/ui-extensions-react/admin";

const TARGET = "admin.order-details.block.render";

export default reactExtension(TARGET, () => <OrderDetailBlock />);

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineReadiness {
  lineItemId: string;
  title: string;
  hasHsCode: boolean;
  hasCoo: boolean;
  isCustomItem: boolean;
  status: "complete" | "missing_hs" | "missing_coo" | "missing_both";
}

interface OrderReadinessResult {
  orderId: string;
  orderName: string;
  readiness: "complete" | "partial" | "not_ready";
  lines: LineReadiness[];
}

// ─── Component ────────────────────────────────────────────────────────────────

function OrderDetailBlock() {
  const { data, sessionToken, extension } = useApi(TARGET);

  const orderId = (data as { selected?: Array<{ id: string }> })?.selected?.[0]?.id;

  const [readiness, setReadiness] = useState<OrderReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    try {
      const token = await sessionToken.get();
      const numericId = orderId.split("/").pop();
      const appUrl = (extension as { appUrl?: string })?.appUrl ?? "";

      const resp = await fetch(`${appUrl}/api/invoice/${numericId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const result = (await resp.json()) as OrderReadinessResult;
      setReadiness(result);
    } catch (err) {
      setError("Unable to load customs data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderId, sessionToken, extension]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  const handleGenerateInvoice = useCallback(async () => {
    if (!orderId) return;
    try {
      const token = await sessionToken.get();
      const numericId = orderId.split("/").pop();
      const appUrl = (extension as { appUrl?: string })?.appUrl ?? "";

      // Trigger download by opening the PDF endpoint
      const url = `${appUrl}/api/invoice/${numericId}?token=${encodeURIComponent(token)}`;
      window.open(url, "_blank");
    } catch (err) {
      // no-op — user can retry
    }
  }, [orderId, sessionToken, extension]);

  return (
    <AdminBlock title="Customs Readiness">
      {loading && (
        <BlockStack gap="200">
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText lines={3} />
        </BlockStack>
      )}

      {error && !loading && (
        <BlockStack gap="300">
          <Banner tone="critical">{error}</Banner>
          <Button onPress={fetchReadiness} variant="secondary">
            Retry
          </Button>
        </BlockStack>
      )}

      {readiness && !loading && (
        <BlockStack gap="400">
          {/* Overall status */}
          <InlineStack gap="300" blockAlignment="center">
            <Text fontWeight="semibold" as="span">
              Overall Status
            </Text>
            <ReadinessBadge readiness={readiness.readiness} />
          </InlineStack>

          {readiness.readiness !== "complete" && (
            <Banner tone="warning">
              {readiness.readiness === "not_ready"
                ? "This order has no customs data. The invoice will contain placeholder values."
                : "Some line items are missing HS codes or country-of-origin data."}
            </Banner>
          )}

          <Divider />

          {/* Per-line breakdown */}
          <BlockStack gap="200">
            <Text fontWeight="semibold" as="span" tone="subdued">
              Line Items
            </Text>
            {readiness.lines.map((line: any) => (
              <LineReadinessRow key={line.lineItemId} line={line} />
            ))}
          </BlockStack>

          <Divider />

          {/* Action */}
          <Button
            variant="primary"
            onPress={handleGenerateInvoice}
          >
            Generate Customs Invoice
          </Button>
        </BlockStack>
      )}
    </AdminBlock>
  );
}

// ─── Line readiness row ───────────────────────────────────────────────────────

function LineReadinessRow({ line }: { line: LineReadiness }) {
  const isOk = line.status === "complete";
  return (
    <BlockStack gap="100">
      <InlineStack gap="200" blockAlignment="center" inlineAlignment="space-between">
        <Text as="span" truncate>
          {line.title}
          {line.isCustomItem && (
            <Text as="span" tone="subdued">
              {" "}
              (Custom item)
            </Text>
          )}
        </Text>
        {isOk ? (
          <Badge tone="success">Ready</Badge>
        ) : (
          <Badge tone="critical">Incomplete</Badge>
        )}
      </InlineStack>
      {!isOk && (
        <InlineStack gap="200">
          {(line.status === "missing_hs" || line.status === "missing_both") && (
            <Text as="span" tone="critical" size="small">
              HS code missing
            </Text>
          )}
          {(line.status === "missing_coo" || line.status === "missing_both") && (
            <Text as="span" tone="critical" size="small">
              Country of origin missing
            </Text>
          )}
        </InlineStack>
      )}
    </BlockStack>
  );
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

function ReadinessBadge({ readiness }: { readiness: string }) {
  if (readiness === "complete") return <Badge tone="success">Complete</Badge>;
  if (readiness === "partial") return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="critical">Not Ready</Badge>;
}
