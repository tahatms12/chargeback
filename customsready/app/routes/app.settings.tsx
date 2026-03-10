// app/routes/app.settings.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  BlockStack,
  Text,
  Tag,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────────────────────

const ConfigSchema = z.object({
  sellerName: z.string().min(1, "Seller name is required"),
  sellerAddressLine1: z.string().optional(),
  sellerAddressLine2: z.string().optional(),
  sellerCity: z.string().optional(),
  sellerStateProvince: z.string().optional(),
  sellerPostalCode: z.string().optional(),
  sellerCountryCode: z.string().optional(),
  sellerContactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  sellerContactPhone: z.string().optional(),
  homeCountry: z.string().optional(),
  defaultCurrency: z.string().optional(),
  exemptTagsRaw: z.string().optional(),
});

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;

  await billing.require({
    plans: ["CustomsReady Lite Monthly"],
    onFailure: async () =>
      billing.request({ plan: "CustomsReady Lite Monthly", isTest: process.env.NODE_ENV !== "production" }),
  });

  const config = await db.configuration.findUnique({ where: { shopDomain } });

  return json({ config });
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();

  const raw = {
    sellerName: formData.get("sellerName") as string,
    sellerAddressLine1: formData.get("sellerAddressLine1") as string,
    sellerAddressLine2: formData.get("sellerAddressLine2") as string,
    sellerCity: formData.get("sellerCity") as string,
    sellerStateProvince: formData.get("sellerStateProvince") as string,
    sellerPostalCode: formData.get("sellerPostalCode") as string,
    sellerCountryCode: formData.get("sellerCountryCode") as string,
    sellerContactEmail: formData.get("sellerContactEmail") as string,
    sellerContactPhone: formData.get("sellerContactPhone") as string,
    homeCountry: formData.get("homeCountry") as string,
    defaultCurrency: formData.get("defaultCurrency") as string,
    exemptTagsRaw: formData.get("exemptTagsRaw") as string,
  };

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    return json(
      { ok: false, errors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const exemptTags = raw.exemptTagsRaw
    ? raw.exemptTagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  await db.configuration.upsert({
    where: { shopDomain },
    create: {
      shopDomain,
      ...result.data,
      exemptTags,
    },
    update: {
      ...result.data,
      exemptTags,
    },
  });

  return json({ ok: true, errors: {} });
};

// ─── Component ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { label: "Select a country", value: "" },
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Netherlands", value: "NL" },
  { label: "China", value: "CN" },
  { label: "Japan", value: "JP" },
  { label: "Other", value: "OTHER" },
];

const CURRENCY_OPTIONS = [
  { label: "USD — US Dollar", value: "USD" },
  { label: "EUR — Euro", value: "EUR" },
  { label: "GBP — British Pound", value: "GBP" },
  { label: "CAD — Canadian Dollar", value: "CAD" },
  { label: "AUD — Australian Dollar", value: "AUD" },
  { label: "JPY — Japanese Yen", value: "JPY" },
];

export default function Settings() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [exemptTagInput, setExemptTagInput] = useState("");
  const [exemptTags, setExemptTags] = useState<string[]>(
    config?.exemptTags ?? []
  );

  const addTag = () => {
    const tag = exemptTagInput.trim();
    if (tag && !exemptTags.includes(tag)) {
      setExemptTags([...exemptTags, tag]);
      setExemptTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setExemptTags(exemptTags.filter((t) => t !== tag));
  };

  return (
    <Page
      title="Settings"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        {actionData?.ok === true && (
          <Layout.Section>
            <Banner tone="success" title="Settings saved" />
          </Layout.Section>
        )}

        {actionData?.ok === false && (
          <Layout.Section>
            <Banner tone="critical" title="Please fix the errors below" />
          </Layout.Section>
        )}

        <Layout.AnnotatedSection
          title="Seller Information"
          description="This information appears as the shipper/exporter on generated commercial invoices."
        >
          <Card>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Business Name"
                  name="sellerName"
                  defaultValue={config?.sellerName ?? ""}
                  error={actionData?.errors?.sellerName?.[0]}
                  autoComplete="organization"
                />
                <TextField
                  label="Address Line 1"
                  name="sellerAddressLine1"
                  defaultValue={config?.sellerAddressLine1 ?? ""}
                  autoComplete="address-line1"
                />
                <TextField
                  label="Address Line 2"
                  name="sellerAddressLine2"
                  defaultValue={config?.sellerAddressLine2 ?? ""}
                  autoComplete="address-line2"
                />
                <FormLayout.Group>
                  <TextField
                    label="City"
                    name="sellerCity"
                    defaultValue={config?.sellerCity ?? ""}
                    autoComplete="address-level2"
                  />
                  <TextField
                    label="State / Province"
                    name="sellerStateProvince"
                    defaultValue={config?.sellerStateProvince ?? ""}
                    autoComplete="address-level1"
                  />
                  <TextField
                    label="Postal Code"
                    name="sellerPostalCode"
                    defaultValue={config?.sellerPostalCode ?? ""}
                    autoComplete="postal-code"
                  />
                </FormLayout.Group>
                <Select
                  label="Country"
                  name="sellerCountryCode"
                  options={COUNTRY_OPTIONS}
                  value={config?.sellerCountryCode ?? ""}
                  onChange={() => {}}
                />
                <FormLayout.Group>
                  <TextField
                    label="Contact Email"
                    name="sellerContactEmail"
                    type="email"
                    defaultValue={config?.sellerContactEmail ?? ""}
                    error={actionData?.errors?.sellerContactEmail?.[0]}
                    autoComplete="email"
                  />
                  <TextField
                    label="Contact Phone"
                    name="sellerContactPhone"
                    type="tel"
                    defaultValue={config?.sellerContactPhone ?? ""}
                    autoComplete="tel"
                  />
                </FormLayout.Group>

                <Divider />

                <Select
                  label="Home Country (used to identify international orders)"
                  name="homeCountry"
                  options={COUNTRY_OPTIONS}
                  value={config?.homeCountry ?? "US"}
                  onChange={() => {}}
                />
                <Select
                  label="Default Currency"
                  name="defaultCurrency"
                  options={CURRENCY_OPTIONS}
                  value={config?.defaultCurrency ?? "USD"}
                  onChange={() => {}}
                />

                <Divider />

                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    Exempt Tags
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Products with these tags will be excluded from the customs
                    audit. Use this for digital products, gift cards, etc.
                  </Text>
                  <InlineStack gap="200" wrap>
                    {exemptTags.map((tag) => (
                      <Tag key={tag} onRemove={() => removeTag(tag)}>
                        {tag}
                      </Tag>
                    ))}
                  </InlineStack>
                  <InlineStack gap="200">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        labelHidden
                        placeholder="e.g. digital, giftcard"
                        value={exemptTagInput}
                        onChange={setExemptTagInput}
                        autoComplete="off"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={addTag}>Add Tag</Button>
                  </InlineStack>
                  {/* Hidden field carries current exempt tags */}
                  <input
                    type="hidden"
                    name="exemptTagsRaw"
                    value={exemptTags.join(",")}
                  />
                </BlockStack>

                <Button
                  variant="primary"
                  submit
                  loading={isSaving}
                >
                  Save Settings
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.AnnotatedSection>

        <Layout.AnnotatedSection
          title="Compliance Notice"
          description=""
        >
          <Card>
            <Text variant="bodySm" tone="subdued" as="p">
              CustomsReady Lite identifies potential customs data gaps in your
              Shopify catalog and generates commercial invoices from your order
              data. It does not provide customs clearance services, legal
              advice, or regulatory compliance guarantees. Always verify
              generated documents with your licensed customs broker or freight
              forwarder before filing.
            </Text>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>
    </Page>
  );
}
