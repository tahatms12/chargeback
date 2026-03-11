import { Banner, BlockStack, Button, DropZone, Text } from "@shopify/polaris";
import { useState } from "react";
import type { ValidationResult } from "~/lib/csv-validator.client";
import { useI18n } from "~/lib/i18n";

export function CsvUploader({ rowsUsed, rowLimit, hasPlan, onDone }: { rowsUsed: number; rowLimit: number; hasPlan: boolean; onDone: (res: ValidationResult) => void }) {
  const [paywall, setPaywall] = useState<string | null>(null);
  const { locale, t } = useI18n();

  const onDrop = async (_dropped: File[], accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const text = await file.text();
    const { validateCsv } = await import("~/lib/csv-validator.client");
    const res = validateCsv(text, locale, t);
    if (!hasPlan && rowsUsed + res.totalRows > rowLimit) {
      setPaywall(t("upgrade.paywall", { count: res.totalRows }));
      return;
    }
    setPaywall(null);
    onDone(res);
  };

  return (
    <BlockStack gap="300">
      <DropZone onDrop={onDrop} accept=".csv" type="file">
        <DropZone.FileUpload actionTitle={t("upload.actionTitle")} actionHint={t("upload.actionHint")} />
      </DropZone>
      {paywall ? <Banner tone="warning" title={t("upgrade.required")} action={{ content: t("upgrade.toPro"), url: "/app/billing" }}><Text as="p">{paywall}</Text></Banner> : null}
      <Button url="/app/billing">{t("upgrade.proPrice")}</Button>
    </BlockStack>
  );
}
