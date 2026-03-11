import { Banner, Badge, BlockStack, Card, InlineStack, Text } from "@shopify/polaris";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { useI18n } from "~/lib/i18n";

export function ErrorTable({ result }: { result: ValidationResult }) {
  const { t } = useI18n();

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack gap="200">
          <Badge tone={result.passed ? "success" : "critical"}>{result.passed ? t("status.passed") : t("status.errors", { count: result.errors.length })}</Badge>
          {result.warnings.length > 0 ? <Badge tone="warning">{t("status.warnings", { count: result.warnings.length })}</Badge> : null}
        </InlineStack>

        {result.headerErrors.map((e) => <Banner key={e} tone="critical"><Text as="p">{e}</Text></Banner>)}
        {result.unknownHeaders.length ? <Banner tone="warning"><Text as="p">{t("errors.unknownHeaders", { headers: result.unknownHeaders.join(", ") })}</Text></Banner> : null}

        {result.errors.slice(0, 200).map((e, i) => (
          <Text key={`e-${i}`} as="p">{t("errors.rowIssue", { row: e.row, column: e.column, message: e.message, fix: e.fix })}</Text>
        ))}
        {result.warnings.slice(0, 200).map((w, i) => (
          <Text key={`w-${i}`} as="p">{t("errors.rowIssue", { row: w.row, column: w.column, message: w.message, fix: w.fix })}</Text>
        ))}

        <Banner tone="info">
          <Text as="p">{t("errors.outOfScope")}</Text>
        </Banner>
      </BlockStack>
    </Card>
  );
}
