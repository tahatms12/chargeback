import { Banner, Link, Text } from "@shopify/polaris";
import { useI18n } from "~/lib/i18n";

export function UsageBanner({ hasPlan, rowsUsed, rowLimit }: { hasPlan: boolean; rowsUsed: number; rowLimit: number }) {
  const { t } = useI18n();

  if (hasPlan) {
    return <Banner tone="success"><Text as="p">{t("usage.proActive")}</Text></Banner>;
  }
  if (rowsUsed >= rowLimit) {
    return <Banner tone="warning" title={t("usage.limitReachedTitle")} action={{ content: t("upgrade.proPrice"), url: "/app/billing" }}><Text as="p">{t("usage.limitReachedBody", { used: rowsUsed, limit: rowLimit })}</Text></Banner>;
  }
  return <Banner tone="info"><Text as="p">{t("usage.freeTierBody", { used: rowsUsed, limit: rowLimit })} <Link url="/app/billing">{t("upgrade.toPro")}</Link>.</Text></Banner>;
}
