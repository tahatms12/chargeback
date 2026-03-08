import { Banner, BlockStack, Button, DropZone, Text } from "@shopify/polaris";
import { useState } from "react";
import type { ValidationResult } from "~/lib/csv-validator.client";

export function CsvUploader({ rowsUsed, rowLimit, hasPlan, onDone }: { rowsUsed: number; rowLimit: number; hasPlan: boolean; onDone: (res: ValidationResult) => void }) {
  const [paywall, setPaywall] = useState<string | null>(null);

  const onDrop = async (_dropped: File[], accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const text = await file.text();
    const { validateCsv } = await import("~/lib/csv-validator.client");
    const res = validateCsv(text);
    if (!hasPlan && rowsUsed + res.totalRows > rowLimit) {
      setPaywall(`This file has ${res.totalRows} rows and exceeds your remaining free-tier quota.`);
      return;
    }
    setPaywall(null);
    onDone(res);
  };

  return (
    <BlockStack gap="300">
      <DropZone onDrop={onDrop} accept=".csv" type="file">
        <DropZone.FileUpload actionTitle="Upload CSV" actionHint="Client-side validation only; file is not uploaded to server" />
      </DropZone>
      {paywall ? <Banner tone="warning" title="Upgrade required" action={{ content: "Upgrade to Pro", url: "/app/billing" }}><Text as="p">{paywall}</Text></Banner> : null}
      <Button url="/app/billing">Upgrade to Pro ($7/month)</Button>
    </BlockStack>
  );
}
