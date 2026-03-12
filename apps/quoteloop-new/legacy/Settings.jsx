/**
 * pages/Settings.jsx
 *
 * Settings page.
 * Allows the merchant to configure:
 *   - Follow-up days threshold
 *   - Expiry days threshold
 *   - Follow-up email subject line
 *   - Follow-up email body (with template variable reference)
 *   - Merchant notification email (optional)
 */

import React, { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  Text,
  Toast,
  Frame,
  Spinner,
  BlockStack,
  Box,
  Divider,
  Badge,
  InlineStack,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const TEMPLATE_VARS = [
  { token: "{{customer_name}}",    description: "Customer full name" },
  { token: "{{draft_order_name}}", description: "Draft order number, e.g. #D1001" },
  { token: "{{draft_order_url}}",  description: "Invoice link the customer can open to pay" },
  { token: "{{shop_name}}",        description: "Your shop name" },
];

export default function Settings() {
  const fetchWithAuth = useAuthenticatedFetch();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState([]);
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetchWithAuth("/api/settings");
        const data = await res.json();
        setSettings(data.settings);
      } catch (err) {
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchWithAuth]);

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetchWithAuth("/api/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || [data.error || "Failed to save settings."]);
        return;
      }

      setSettings(data.settings);
      setToast({ message: "Settings saved." });
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  const update = (field) => (value) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <Page title="Settings">
        <Box padding="800" as="div" style={{ display: "flex", justifyContent: "center" }}>
          <Spinner size="large" />
        </Box>
      </Page>
    );
  }

  return (
    <Frame>
      <Page
        title="Settings"
        subtitle="Configure your draft order follow-up and expiry rules"
        primaryAction={{ content: "Save", onAction: handleSave, loading: saving }}
      >
        {errors.length > 0 && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical" title="Please fix the following errors">
              <BlockStack gap="100">
                {errors.map((e, i) => (
                  <Text key={i}>{e}</Text>
                ))}
              </BlockStack>
            </Banner>
          </Box>
        )}

        <Layout>
          {/* Automation Rules */}
          <Layout.AnnotatedSection
            title="Automation rules"
            description="Set the age thresholds that trigger the follow-up email and expiry tagging. The expiry threshold must be greater than the follow-up threshold."
          >
            <Card>
              <FormLayout>
                <TextField
                  label="Send follow-up email after (days)"
                  type="number"
                  min={1}
                  value={String(settings.follow_up_days)}
                  onChange={(v) => update("follow_up_days")(parseInt(v, 10) || 1)}
                  helpText="Draft orders older than this many days will receive a follow-up email."
                  autoComplete="off"
                />
                <TextField
                  label="Mark as expired after (days)"
                  type="number"
                  min={1}
                  value={String(settings.expiry_days)}
                  onChange={(v) => update("expiry_days")(parseInt(v, 10) || 1)}
                  helpText="Draft orders older than this many days will be tagged 'expired' in Shopify."
                  autoComplete="off"
                />
              </FormLayout>
            </Card>
          </Layout.AnnotatedSection>

          {/* Email Template */}
          <Layout.AnnotatedSection
            title="Follow-up email template"
            description="Customise the email sent to customers when their draft order exceeds the follow-up threshold."
          >
            <BlockStack gap="400">
              <Card>
                <FormLayout>
                  <TextField
                    label="Subject line"
                    value={settings.follow_up_email_subject}
                    onChange={update("follow_up_email_subject")}
                    autoComplete="off"
                  />
                  <TextField
                    label="Email body"
                    value={settings.follow_up_email_body}
                    onChange={update("follow_up_email_body")}
                    multiline={10}
                    autoComplete="off"
                    helpText="Plain text. Use the template variables listed below."
                  />
                </FormLayout>
              </Card>

              <Card title="Available template variables">
                <BlockStack gap="200">
                  <Text variant="bodyMd" tone="subdued">
                    Insert these tokens anywhere in the subject or body:
                  </Text>
                  {TEMPLATE_VARS.map(({ token, description }) => (
                    <InlineStack key={token} gap="300" align="start" blockAlign="center">
                      <Badge><code>{token}</code></Badge>
                      <Text variant="bodyMd" tone="subdued">{description}</Text>
                    </InlineStack>
                  ))}
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.AnnotatedSection>

          {/* Merchant Notification */}
          <Layout.AnnotatedSection
            title="Merchant notifications"
            description="Optionally receive an email summary each time draft orders are expired by the automation."
          >
            <Card>
              <FormLayout>
                <TextField
                  label="Notification email address"
                  type="email"
                  value={settings.merchant_notification_email || ""}
                  onChange={update("merchant_notification_email")}
                  placeholder="owner@yourdomain.com"
                  helpText="Leave blank to disable merchant expiry notifications."
                  autoComplete="email"
                />
              </FormLayout>
            </Card>
          </Layout.AnnotatedSection>

          {/* Save button (bottom) */}
          <Layout.Section>
            <Box paddingBlockEnd="800">
              <Button variant="primary" onClick={handleSave} loading={saving} size="large">
                Save settings
              </Button>
            </Box>
          </Layout.Section>
        </Layout>
      </Page>
      {toast && (
        <Toast
          content={toast.message}
          onDismiss={() => setToast(null)}
          duration={3000}
        />
      )}
    </Frame>
  );
}
