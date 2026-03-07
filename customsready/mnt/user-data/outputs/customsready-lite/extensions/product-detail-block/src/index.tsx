// extensions/product-detail-block/src/index.tsx
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
  SkeletonBodyText,
  Banner,
} from "@shopify/ui-extensions-react/admin";

const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <ProductDetailBlock />);

interface VariantAudit {
  variantId: string;
  variantTitle: string | null;
  hasHsCode: boolean;
  hasCoo: boolean;
  harmonizedSystemCode: string | null;
  countryCodeOfOrigin: string | null;
  fixStatus: string;
}

interface ProductAuditData {
  productId: string;
  productTitle: string;
  variants: VariantAudit[];
  lastAuditedAt: string | null;
}

function ProductDetailBlock() {
  const { data, sessionToken, extension } = useApi(TARGET);

  const productId = (data as { selected?: Array<{ id: string }> })?.selected?.[0]?.id;

  const [auditData, setAuditData] = useState<ProductAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      const token = await sessionToken.get();
      const numericId = productId.split("/").pop();
      const appUrl = (extension as { appUrl?: string })?.appUrl ?? "";

      const resp = await fetch(
        `${appUrl}/api/product-audit/${numericId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (resp.status === 404) {
        setAuditData(null);
        setLoading(false);
        return;
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setAuditData(await resp.json() as ProductAuditData);
    } catch {
      setError("Unable to load customs status. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [productId, sessionToken, extension]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  return (
    <AdminBlock title="Customs Data Status">
      {loading && <SkeletonBodyText lines={3} />}

      {error && !loading && (
        <BlockStack gap="300">
          <Banner tone="critical">{error}</Banner>
          <Button onPress={fetchAuditData} variant="secondary">
            Retry
          </Button>
        </BlockStack>
      )}

      {!loading && !error && !auditData && (
        <BlockStack gap="200">
          <Text tone="subdued">
            This product has not been audited yet. Run a catalog scan from the
            CustomsReady Lite dashboard.
          </Text>
        </BlockStack>
      )}

      {auditData && !loading && (
        <BlockStack gap="400">
          {/* Summary */}
          {(() => {
            const allComplete = auditData.variants.every(
              (v) => v.hasHsCode && v.hasCoo
            );
            const anyComplete = auditData.variants.some(
              (v) => v.hasHsCode && v.hasCoo
            );
            const status = allComplete
              ? "complete"
              : anyComplete
              ? "partial"
              : "not_ready";
            return (
              <InlineStack gap="200" blockAlignment="center">
                <Text fontWeight="semibold">Product Status</Text>
                {status === "complete" ? (
                  <Badge tone="success">All Variants Ready</Badge>
                ) : status === "partial" ? (
                  <Badge tone="warning">Partial</Badge>
                ) : (
                  <Badge tone="critical">Not Ready</Badge>
                )}
              </InlineStack>
            );
          })()}

          <Divider />

          {/* Per-variant rows */}
          <BlockStack gap="300">
            {auditData.variants.map((v) => (
              <BlockStack key={v.variantId} gap="150">
                <InlineStack
                  gap="200"
                  blockAlignment="center"
                  inlineAlignment="space-between"
                >
                  <Text fontWeight="semibold" as="span">
                    {v.variantTitle || "Default Variant"}
                  </Text>
                  {v.hasHsCode && v.hasCoo ? (
                    <Badge tone="success">Ready</Badge>
                  ) : (
                    <Badge tone="critical">Incomplete</Badge>
                  )}
                </InlineStack>

                <InlineStack gap="300">
                  <BlockStack gap="050">
                    <Text size="small" tone="subdued">
                      HS Code
                    </Text>
                    {v.hasHsCode ? (
                      <Text size="small" fontWeight="semibold">
                        {v.harmonizedSystemCode}
                      </Text>
                    ) : (
                      <Text size="small" tone="critical">
                        Missing
                      </Text>
                    )}
                  </BlockStack>

                  <BlockStack gap="050">
                    <Text size="small" tone="subdued">
                      Country of Origin
                    </Text>
                    {v.hasCoo ? (
                      <Text size="small" fontWeight="semibold">
                        {v.countryCodeOfOrigin}
                      </Text>
                    ) : (
                      <Text size="small" tone="critical">
                        Missing
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>

                {(!v.hasHsCode || !v.hasCoo) && (
                  <Text size="small" tone="subdued">
                    Edit this product's variant in Shopify admin → Shipping
                    section to add HS code and country of origin.
                  </Text>
                )}
              </BlockStack>
            ))}
          </BlockStack>

          {auditData.lastAuditedAt && (
            <>
              <Divider />
              <Text tone="subdued" size="small">
                Last audited:{" "}
                {new Date(auditData.lastAuditedAt).toLocaleString()}
              </Text>
            </>
          )}
        </BlockStack>
      )}
    </AdminBlock>
  );
}
