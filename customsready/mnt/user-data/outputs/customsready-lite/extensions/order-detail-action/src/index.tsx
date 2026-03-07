// extensions/order-detail-action/src/index.tsx
import { useEffect, useState, useCallback } from "react";
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  Divider,
  SkeletonBodyText,
  Box,
} from "@shopify/ui-extensions-react/admin";

const TARGET = "admin.order-details.action.render";

export default reactExtension(TARGET, () => <OrderDetailAction />);

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
  currencyCode: string;
  totalAmount: string;
}

function OrderDetailAction() {
  const { data, sessionToken, extension, close } = useApi(TARGET);

  const orderId = (data as { selected?: Array<{ id: string }> })?.selected?.[0]?.id;

  const [readiness, setReadiness] = useState<OrderReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchData = async () => {
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

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        setReadiness((await resp.json()) as OrderReadinessResult);
      } catch {
        setError("Unable to load order customs data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, sessionToken, extension]);

  const handleDownload = useCallback(async () => {
    if (!orderId) return;
    setGenerating(true);
    try {
      const token = await sessionToken.get();
      const numericId = orderId.split("/").pop();
      const appUrl = (extension as { appUrl?: string })?.appUrl ?? "";
      const url = `${appUrl}/api/invoice/${numericId}`;

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error("PDF generation failed");

      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `invoice-${readiness?.orderName ?? numericId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      setDownloadStarted(true);
    } catch {
      setError("PDF download failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [orderId, sessionToken, extension, readiness]);

  const missingCount = readiness?.lines.filter(
    (l) => l.status !== "complete"
  ).length ?? 0;

  return (
    <AdminAction
      title="Generate Commercial Invoice"
      primaryAction={
        <Button
          variant="primary"
          onPress={handleDownload}
          loading={generating}
          disabled={loading}
        >
          {downloadStarted ? "Download Again" : "Download PDF"}
        </Button>
      }
      secondaryAction={
        <Button variant="secondary" onPress={close}>
          Cancel
        </Button>
      }
    >
      {loading && (
        <BlockStack gap="200">
          <SkeletonBodyText lines={4} />
        </BlockStack>
      )}

      {error && (
        <Banner tone="critical">{error}</Banner>
      )}

      {readiness && !loading && (
        <BlockStack gap="400">
          {/* Summary */}
          <InlineStack gap="300" blockAlignment="center">
            <Text fontWeight="semibold">Order {readiness.orderName}</Text>
            <ReadinessBadge readiness={readiness.readiness} />
          </InlineStack>

          {/* Warning for incomplete data */}
          {missingCount > 0 && (
            <Banner tone="warning">
              {missingCount} line item{missingCount !== 1 ? "s" : ""} will show
              placeholder values (<strong>[HS CODE REQUIRED]</strong> or{" "}
              <strong>[COO REQUIRED]</strong>). Verify with your customs broker
              before filing.
            </Banner>
          )}

          <Divider />

          {/* Line-by-line preview */}
          <BlockStack gap="200">
            <Text fontWeight="semibold" tone="subdued">
              Invoice Lines
            </Text>
            {readiness.lines.map((line) => (
              <InlineStack
                key={line.lineItemId}
                gap="200"
                blockAlignment="center"
                inlineAlignment="space-between"
              >
                <Text as="span" truncate>
                  {line.title}
                  {line.isCustomItem && (
                    <Text as="span" tone="subdued">
                      {" "}
                      (Custom)
                    </Text>
                  )}
                </Text>
                <InlineStack gap="100">
                  <Badge tone={line.hasHsCode ? "success" : "critical"}>
                    HS
                  </Badge>
                  <Badge tone={line.hasCoo ? "success" : "critical"}>
                    COO
                  </Badge>
                </InlineStack>
              </InlineStack>
            ))}
          </BlockStack>

          <Divider />

          <Text tone="subdued" size="small">
            This invoice is generated from your Shopify order data. It must be
            verified with your customs broker before filing.
          </Text>
        </BlockStack>
      )}
    </AdminAction>
  );
}

function ReadinessBadge({ readiness }: { readiness: string }) {
  if (readiness === "complete") return <Badge tone="success">Complete</Badge>;
  if (readiness === "partial") return <Badge tone="warning">Partial</Badge>;
  return <Badge tone="critical">Not Ready</Badge>;
}
