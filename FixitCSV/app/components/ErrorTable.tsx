import { Badge, BlockStack, InlineStack, Text, Banner } from "@shopify/polaris";
import type { ValidationResult } from "~/lib/csv-validator.client";

interface ErrorTableProps {
  result: ValidationResult;
  isEnriched?: boolean; // when true, pre-enrichment header errors are hidden
}

export function ErrorTable({ result, isEnriched = false }: ErrorTableProps) {
  // After enrichment, header normalization happened server-side — don't show stale client-side header errors
  const showHeaderErrors = result.headerErrors.length > 0 && !isEnriched;

  return (
    <BlockStack gap="300">
      {/* Status badges */}
      <InlineStack gap="200" align="start">
        <Badge
          tone={
            isEnriched
              ? "success"
              : result.passed
              ? "success"
              : result.headerErrors.length > 0
              ? "critical"
              : "attention"
          }
        >
          {isEnriched
            ? `✓ ${result.totalRows} rows enriched and ready`
            : result.passed
            ? `✓ ${result.totalRows} rows ready`
            : result.headerErrors.length > 0
            ? `${result.headerErrors.length} header issue${result.headerErrors.length !== 1 ? "s" : ""}`
            : `${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`}
        </Badge>
        {result.warnings.length > 0 && !isEnriched ? (
          <Badge tone="warning">{`${result.warnings.length} warning${result.warnings.length !== 1 ? "s" : ""}`}</Badge>
        ) : null}
        {result.totalRows > 0 && !result.passed && !isEnriched ? (
          <Badge tone="info">{`${result.totalRows} rows detected — click Fix & Enrich to auto-correct`}</Badge>
        ) : null}
      </InlineStack>

      {/* Header errors: only show before enrichment */}
      {showHeaderErrors && result.headerErrors.map((e) => (
        <Banner key={e} tone="critical">
          <Text as="p">{e}</Text>
          <Text as="p" tone="subdued">
            Click Fix &amp; Enrich to automatically normalize column headers and add missing data.
          </Text>
        </Banner>
      ))}

      {/* Unknown headers — info only, not blocking */}
      {result.unknownHeaders.length > 0 && !isEnriched ? (
        <Banner tone="info">
          <Text as="p">
            <strong>{result.unknownHeaders.length} unrecognized column{result.unknownHeaders.length !== 1 ? "s" : ""}:</strong>{" "}
            {result.unknownHeaders.join(", ")}. These are ignored in the Shopify output.
          </Text>
        </Banner>
      ) : null}

      {/* Row errors — only show pre-enrichment */}
      {result.errors.length > 0 && !isEnriched ? (
        <BlockStack gap="100">
          {result.errors.slice(0, 20).map((e, i) => (
            <Text key={`e-${i}`} as="p" tone="critical">
              Row {e.row} · <strong>{e.column}</strong>: {e.message}
            </Text>
          ))}
          {result.errors.length > 20 ? (
            <Text as="p" tone="subdued">…and {result.errors.length - 20} more. Fix &amp; Enrich will correct all of them.</Text>
          ) : null}
        </BlockStack>
      ) : null}

      {/* Warnings — only show pre-enrichment */}
      {result.warnings.length > 0 && result.errors.length === 0 && !isEnriched ? (
        <BlockStack gap="100">
          {result.warnings.slice(0, 10).map((w, i) => (
            <Text key={`w-${i}`} as="p" tone="caution">
              Row {w.row} · <strong>{w.column}</strong>: {w.message}
            </Text>
          ))}
        </BlockStack>
      ) : null}

      {/* Success state */}
      {(result.passed || isEnriched) && result.totalRows > 0 ? (
        <Banner tone="success">
          <Text as="p">
            {isEnriched
              ? "AI enrichment complete — headers normalized, missing fields filled. Download or push to your store."
              : "Your CSV looks great! Download it or push directly to your store."}
          </Text>
        </Banner>
      ) : null}
    </BlockStack>
  );
}
