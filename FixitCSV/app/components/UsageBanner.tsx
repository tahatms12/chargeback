import { Banner, Text, Link } from "@shopify/polaris";

export function UsageBanner({ hasPlan, rowsUsed, rowLimit }: { hasPlan: boolean; rowsUsed: number; rowLimit: number }) {
  if (hasPlan) {
    return <Banner tone="success"><Text as="p">FixitCSV Pro active. Unlimited validations.</Text></Banner>;
  }
  if (rowsUsed >= rowLimit) {
    return <Banner tone="warning" title="Free-tier limit reached" action={{ content: "Upgrade to Pro ($7/month)", url: "/app/billing" }}><Text as="p">You have used {rowsUsed}/{rowLimit} rows this month.</Text></Banner>;
  }
  return <Banner tone="info"><Text as="p">Free tier: {rowsUsed}/{rowLimit} rows used this month. <Link url="/app/billing">Upgrade to Pro</Link>.</Text></Banner>;
}
