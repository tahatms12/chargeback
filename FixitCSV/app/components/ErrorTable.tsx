import { Badge, BlockStack, InlineStack, Text, Banner } from "@shopify/polaris";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { useI18n } from "~/lib/i18n";

export function ErrorTable({ result }: { result: ValidationResult }) {
  const { t } = useI18n();

  const hasIssues = result.headerErrors.length > 0 || result.errors.length > 0 || result.warnings.length > 0 || result.unknownHeaders.length > 0;

  return (
    <BlockStack gap="300">
      {/* Status badges */}
      <InlineStack gap="200" align="start">
        <Badge tone={result.passed ? "success" : result.headerErrors.length > 0 ? "critical" : "attention"}>
          {result.passed
            ? `✓ ${result.totalRows} rows ready`
            : result.headerErrors.length > 0
            ? `${result.headerErrors.length} header issue${result.headerErrors.length !== 1 ? "s" : ""}`
            : `${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`}
        </Badge>
        {result.warnings.length > 0 ? (
          <Badge tone="warning">{result.warnings.length} warning{result.warnings.length !== 1 ? "s" : ""}</Badge>
        ) : null}
        {result.totalRows > 0 && !result.passed ? (
          <Badge tone="info">{result.totalRows} rows · click Fix &amp; Enrich to auto-correct</Badge>
        ) : null}
      </InlineStack>

      {/* Header errors */}
      {result.headerErrors.map((e) => (
        <Banner key={e} tone="critical">
          <Text as="p">{e}</Text>
          <Text as="p" tone="subdued">
            Use Fix &amp; Enrich to automatically normalize your column headers and add missing data.
          </Text>
        </Banner>
      ))}

      {/* Unknown headers — now just info, not blocking */}
      {result.unknownHeaders.length > 0 ? (
        <Banner tone="info">
          <Text as="p">
            <strong>{result.unknownHeaders.length} unrecognized column{result.unknownHeaders.length !== 1 ? "s" : ""}:</strong>{" "}
            {result.unknownHeaders.join(", ")}. These will be ignored in the Shopify output.
          </Text>
        </Banner>
      ) : null}

      {/* Row errors */}
      {result.errors.length > 0 ? (
        <BlockStack gap="100">
          {result.errors.slice(0, 20).map((e, i) => (
            <Text key={`e-${i}`} as="p" tone="critical">
              Row {e.row} · <strong>{e.column}</strong>: {e.message}
            </Text>
          ))}
          {result.errors.length > 20 ? (
            <Text as="p" tone="subdued">…and {result.errors.length - 20} more errors. Fix &amp; Enrich will correct all of them.</Text>
          ) : null}
        </BlockStack>
      ) : null}

      {/* Warnings */}
      {result.warnings.length > 0 && result.errors.length === 0 ? (
        <BlockStack gap="100">
          {result.warnings.slice(0, 10).map((w, i) => (
            <Text key={`w-${i}`} as="p" tone="caution">
              Row {w.row} · <strong>{w.column}</strong>: {w.message}
            </Text>
          ))}
        </BlockStack>
      ) : null}

      {/* All clear */}
      {result.passed && result.totalRows > 0 ? (
        <Banner tone="success">
          <Text as="p">Your CSV looks great! Download it or push directly to your store.</Text>
        </Banner>
      ) : null}
    </BlockStack>
  );
}
