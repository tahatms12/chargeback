import { InlineStack, Select } from "@shopify/polaris";
import type { Locale } from "~/lib/i18n";
import { useI18n } from "~/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <InlineStack align="end">
      <Select
        label={t("lang.label")}
        labelHidden
        options={[
          { label: t("lang.english"), value: "en" },
          { label: t("lang.german"), value: "de" },
          { label: t("lang.turkish"), value: "tr" },
          { label: t("lang.french"), value: "fr" },
        ]}
        value={locale}
        onChange={(value) => setLocale(value as Locale)}
      />
    </InlineStack>
  );
}
