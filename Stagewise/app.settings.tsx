// app/routes/app.settings.tsx
// Email settings page.
// Source requirement: customer email notifications when order moves stages.
// Implementation choice: merchant-provided SMTP configuration. See email.server.ts.

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField,
  Select,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";
import { testSmtpConnection } from "../email.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.emailSettings.findUnique({
    where: { shopDomain: session.shop },
  });
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "save") {
    const data = {
      smtpHost: (form.get("smtpHost") as string) || "",
      smtpPort: Number(form.get("smtpPort") || 587),
      smtpUser: (form.get("smtpUser") as string) || "",
      smtpPass: (form.get("smtpPass") as string) || "",
      fromEmail: (form.get("fromEmail") as string) || "",
      fromName: (form.get("fromName") as string) || "Order Update",
    };

    await db.emailSettings.upsert({
      where: { shopDomain },
      update: data,
      create: { shopDomain, ...data },
    });

    return json({ ok: true, saved: true });
  }

  if (intent === "test") {
    const result = await testSmtpConnection(shopDomain);
    return json({ ok: result.ok, testResult: result });
  }

  return json({ error: "Unknown intent." }, { status: 400 });
};

const PORT_OPTIONS = [
  { label: "587 (STARTTLS — recommended)", value: "587" },
  { label: "465 (SSL/TLS)", value: "465" },
  { label: "25 (plain — not recommended)", value: "25" },
];

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{
    ok?: boolean;
    saved?: boolean;
    testResult?: { ok: boolean; error?: string };
    error?: string;
  }>();

  const [form, setForm] = useState({
    smtpHost: settings?.smtpHost ?? "",
    smtpPort: String(settings?.smtpPort ?? 587),
    smtpUser: settings?.smtpUser ?? "",
    smtpPass: settings?.smtpPass ?? "",
    fromEmail: settings?.fromEmail ?? "",
    fromName: settings?.fromName ?? "Order Update",
  });

  const isSaving = fetcher.state === "submitting" && fetcher.formData?.get("intent") === "save";
  const isTesting = fetcher.state === "submitting" && fetcher.formData?.get("intent") === "test";

  const [savedBanner, setSavedBanner] = useState(false);
  useEffect(() => {
    if (fetcher.data?.saved) {
      setSavedBanner(true);
      const t = setTimeout(() => setSavedBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [fetcher.data]);

  const handleSave = () => {
    fetcher.submit({ intent: "save", ...form }, { method: "POST" });
  };

  const handleTest = () => {
    fetcher.submit({ intent: "test" }, { method: "POST" });
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (v: string) => setForm((f) => ({ ...f, [key]: v })),
    autoComplete: "off" as const,
  });

  return (
    <Page
      title="Settings"
      subtitle="Configure outbound email for customer stage notifications."
    >
      <Layout>
        {savedBanner && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSavedBanner(false)}>
              Settings saved.
            </Banner>
          </Layout.Section>
        )}

        {fetcher.data?.testResult && (
          <Layout.Section>
            <Banner
              tone={fetcher.data.testResult.ok ? "success" : "critical"}
              onDismiss={() => {}}
            >
              {fetcher.data.testResult.ok
                ? "SMTP connection successful."
                : `SMTP test failed: ${fetcher.data.testResult.error}`}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                SMTP Configuration
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Emails are sent from your own SMTP server. Common providers:
                Gmail (smtp.gmail.com:587), Mailgun, SendGrid, Postmark. Use an
                app password or API key, not your account password.
              </Text>

              <FormLayout>
                <FormLayout.Group>
                  <TextField label="SMTP host" placeholder="smtp.gmail.com" {...field("smtpHost")} />
                  <Select
                    label="SMTP port"
                    options={PORT_OPTIONS}
                    value={form.smtpPort}
                    onChange={(v) => setForm((f) => ({ ...f, smtpPort: v }))}
                  />
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField label="SMTP username" placeholder="you@yourdomain.com" {...field("smtpUser")} />
                  <TextField
                    label="SMTP password / app key"
                    type="password"
                    placeholder="••••••••"
                    {...field("smtpPass")}
                  />
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField
                    label="From email address"
                    type="email"
                    placeholder="orders@yourstudio.com"
                    {...field("fromEmail")}
                  />
                  <TextField
                    label="From display name"
                    placeholder="Your Studio Orders"
                    {...field("fromName")}
                  />
                </FormLayout.Group>
              </FormLayout>

              <InlineStack gap="300">
                <Button variant="primary" loading={isSaving} onClick={handleSave}>
                  Save
                </Button>
                <Button loading={isTesting} onClick={handleTest}>
                  Test connection
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Email queue status
              </Text>
              <EmailQueueStatus />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Shows pending / failed email count from the queue endpoint
function EmailQueueStatus() {
  const fetcher = useFetcher<{
    pending: number;
    failed: number;
    sent: number;
  }>();

  useEffect(() => {
    fetcher.load("/api/email-queue?stats=1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!fetcher.data) {
    return <Text as="p" tone="subdued">Loading…</Text>;
  }

  return (
    <BlockStack gap="100">
      <Text as="p" variant="bodySm">
        Pending: {fetcher.data.pending} · Sent: {fetcher.data.sent} · Failed:{" "}
        {fetcher.data.failed}
      </Text>
      {fetcher.data.failed > 0 && (
        <Text as="p" variant="bodySm" tone="critical">
          Some emails failed to send. Check your SMTP configuration and use
          "Test connection" above.
        </Text>
      )}
    </BlockStack>
  );
}
