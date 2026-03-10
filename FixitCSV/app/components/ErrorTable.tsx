import { Banner, Badge, BlockStack, Card, InlineStack, Text } from "@shopify/polaris";
import type { ValidationResult } from "~/lib/csv-validator.client";

export function ErrorTable({ result }: { result: ValidationResult }) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack gap="200">
          <Badge tone={result.passed ? "success" : "critical"}>{result.passed ? "Passed" : `${result.errors.length} errors`}</Badge>
          {result.warnings.length > 0 ? <Badge tone="warning">{`${result.warnings.length} warnings`}</Badge> : null}
        </InlineStack>

        {result.headerErrors.map((e) => <Banner key={e} tone="critical"><Text as="p">{e}</Text></Banner>)}
        {result.unknownHeaders.length ? <Banner tone="warning"><Text as="p">Unknown headers: {result.unknownHeaders.join(", ")}</Text></Banner> : null}

        {result.errors.slice(0, 200).map((e, i) => (
          <Text key={`e-${i}`} as="p">Row {e.row} • {e.column} • {e.message} Fix: {e.fix}</Text>
        ))}
        {result.warnings.slice(0, 200).map((w, i) => (
          <Text key={`w-${i}`} as="p">Row {w.row} • {w.column} • {w.message} Fix: {w.fix}</Text>
        ))}

        <Banner tone="info">
          <Text as="p">Out of scope: Shopify server-side import failures, image CDN failures, and API rate limits.</Text>
        </Banner>
      </BlockStack>
    </Card>
  );
}
