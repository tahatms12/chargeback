import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  Text,
  Banner,
  Divider,
  Box,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import { sendTestEmail } from "~/lib/email.server";
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await prisma.shopSettings.findUnique({ where: { shop } });

  return json({
    settings: settings ?? {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      smtpFrom: "",
      smtpFromName: "",
    },
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const data = {
      smtpHost: formData.get("smtpHost")?.toString() ?? "",
      smtpPort: parseInt(formData.get("smtpPort")?.toString() ?? "587", 10),
      smtpUser: formData.get("smtpUser")?.toString() ?? "",
      smtpPass: formData.get("smtpPass")?.toString() ?? "",
      smtpFrom: formData.get("smtpFrom")?.toString() ?? "",
      smtpFromName: formData.get("smtpFromName")?.toString() ?? "",
    };

    await prisma.shopSettings.upsert({
      where: { shop },
      create: { shop, ...data },
      update: data,
    });

    return json({ ok: true, saved: true });
  }

  if (intent === "test") {
    const settings = await prisma.shopSettings.findUnique({ where: { shop } });
    const testAddress = formData.get("testEmail")?.toString();

    if (!testAddress) {
      return json({ ok: false, error: "Enter an email address for the test." });
    }

    const result = await sendTestEmail(settings, testAddress);

    if (result.ok) {
      return json({ ok: true, testSent: true });
    } else {
      return json({ ok: false, error: result.error });
    }
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";

  const [form, setForm] = useState({
    smtpHost: settings.smtpHost,
    smtpPort: String(settings.smtpPort),
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom,
    smtpFromName: settings.smtpFromName,
  });
  const [testEmail, setTestEmail] = useState("");

  const setField = useCallback((field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const fd = new FormData();
    fd.set("intent", "save");
    Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    submit(fd, { method: "post" });
  }, [form, submit]);

  const handleTest = useCallback(() => {
    const fd = new FormData();
    fd.set("intent", "test");
    fd.set("testEmail", testEmail);
    submit(fd, { method: "post" });
  }, [testEmail, submit]);

  const portOptions = [
    { label: "587 (STARTTLS)", value: "587" },
    { label: "465 (SSL)", value: "465" },
    { label: "25 (unencrypted)", value: "25" },
  ];

  return (
    <Page
      title="Email Settings"
      subtitle="Configure SMTP to send production stage emails to customers."
      backAction={{ content: "Queue", url: "/app" }}
    >
      <BlockStack gap="400">
        {actionData?.saved && (
          <Banner tone="success" title="Settings saved." />
        )}
        {actionData?.testSent && (
          <Banner tone="success" title="Test email sent." />
        )}
        {actionData?.error && (
          <Banner tone="critical" title={actionData.error} />
        )}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">SMTP configuration</Text>
            <Text variant="bodySm" tone="subdued">
              Use any SMTP provider: Gmail (app password), SendGrid, Mailgun, Postmark, etc.
              Credentials are stored encrypted in your database.
            </Text>
            <Divider />

            <TextField
              label="SMTP host"
              value={form.smtpHost}
              onChange={setField("smtpHost")}
              placeholder="smtp.gmail.com"
              autoComplete="off"
            />

            <Select
              label="SMTP port"
              options={portOptions}
              value={form.smtpPort}
              onChange={setField("smtpPort")}
            />

            <TextField
              label="SMTP username"
              value={form.smtpUser}
              onChange={setField("smtpUser")}
              placeholder="you@yourdomain.com"
              autoComplete="off"
            />

            <TextField
              label="SMTP password / app password"
              value={form.smtpPass}
              onChange={setField("smtpPass")}
              type="password"
              autoComplete="new-password"
            />

            <Divider />

            <TextField
              label="From email address"
              value={form.smtpFrom}
              onChange={setField("smtpFrom")}
              placeholder="orders@yourdomain.com"
              autoComplete="off"
              helpText="Shown to customers as the sender. Leave blank to use SMTP username."
            />

            <TextField
              label="From name"
              value={form.smtpFromName}
              onChange={setField("smtpFromName")}
              placeholder="Your Shop Name"
              autoComplete="off"
              helpText="Display name shown in customer inboxes."
            />

            <Button
              variant="primary"
              onClick={handleSave}
              loading={isBusy && navigation.formData?.get("intent") === "save"}
            >
              Save settings
            </Button>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Send test email</Text>
            <Text variant="bodySm" tone="subdued">
              Verify your SMTP settings by sending a test email.
            </Text>
            <InlineStack gap="200" blockAlign="end">
              <Box minWidth="250px">
                <TextField
                  label="Test recipient"
                  value={testEmail}
                  onChange={setTestEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  type="email"
                />
              </Box>
              <Button
                onClick={handleTest}
                disabled={!testEmail || isBusy}
                loading={isBusy && navigation.formData?.get("intent") === "test"}
              >
                Send test
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
