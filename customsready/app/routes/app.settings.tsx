// app/routes/app.settings.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form, useNavigate } from "@remix-run/react";
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
  const navigate = useNavigate();

  return (
    <div className="cr-dashboard animate-fade-in-up">
      <header style={{ marginBottom: '32px' }}>
        <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/app')} style={{ paddingLeft: 0, marginBottom: '8px' }}>
          &larr; Back to Dashboard
        </button>
        <h1 className="cr-hero-title" style={{ fontSize: '2rem' }}>Settings</h1>
      </header>

      {actionData?.ok === true && (
        <div className="animate-fade-in" style={{ padding: '16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--cr-success)', borderRadius: '12px', marginBottom: '24px', color: 'var(--cr-success)', fontWeight: 500 }}>
          Settings saved successfully
        </div>
      )}

      {actionData?.ok === false && (
        <div className="animate-fade-in" style={{ padding: '16px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid var(--cr-error)', borderRadius: '12px', marginBottom: '24px', color: 'var(--cr-error)', fontWeight: 500 }}>
          Please fix the errors below
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="cr-card">
            <h2 className="cr-card-title">Seller Information</h2>
            <p className="cr-body-text" style={{ fontSize: '0.85rem' }}>This information appears as the shipper/exporter on generated commercial invoices and CN forms. Ensure this matches your legal entity details.</p>
          </div>
          
          <div className="cr-card" style={{ background: 'rgba(79, 110, 247, 0.05)', borderColor: 'rgba(79, 110, 247, 0.2)' }}>
            <h2 className="cr-card-title" style={{ color: '#818CF8' }}>Disclaimer</h2>
            <p className="cr-body-text" style={{ fontSize: '0.8rem' }}>
              CustomsReady identifies potential customs data gaps and generates commercial invoices from your order data. It does not provide customs clearance services, legal advice, or regulatory compliance guarantees.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="cr-card">
          <Form method="post" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ marginBottom: '8px' }}>
              <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Business Name</label>
              <input
                type="text"
                className="cr-input"
                name="sellerName"
                defaultValue={config?.sellerName ?? ""}
                autoComplete="organization"
                style={actionData?.errors?.sellerName?.[0] ? { borderColor: 'var(--cr-error)' } : {}}
              />
              {actionData?.errors?.sellerName?.[0] && <span style={{ color: 'var(--cr-error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{actionData.errors.sellerName[0]}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Address Line 1</label>
                <input type="text" className="cr-input" name="sellerAddressLine1" defaultValue={config?.sellerAddressLine1 ?? ""} autoComplete="address-line1" />
              </div>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Address Line 2 <span style={{ color: 'var(--cr-text-muted)' }}>(Optional)</span></label>
                <input type="text" className="cr-input" name="sellerAddressLine2" defaultValue={config?.sellerAddressLine2 ?? ""} autoComplete="address-line2" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>City</label>
                <input type="text" className="cr-input" name="sellerCity" defaultValue={config?.sellerCity ?? ""} autoComplete="address-level2" />
              </div>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>State / Province</label>
                <input type="text" className="cr-input" name="sellerStateProvince" defaultValue={config?.sellerStateProvince ?? ""} autoComplete="address-level1" />
              </div>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Postal Code</label>
                <input type="text" className="cr-input" name="sellerPostalCode" defaultValue={config?.sellerPostalCode ?? ""} autoComplete="postal-code" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Country</label>
                <select className="cr-input" name="sellerCountryCode" defaultValue={config?.sellerCountryCode ?? ""}>
                  {COUNTRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Contact Email</label>
                <input type="email" className="cr-input" name="sellerContactEmail" defaultValue={config?.sellerContactEmail ?? ""} autoComplete="email" 
                  style={actionData?.errors?.sellerContactEmail?.[0] ? { borderColor: 'var(--cr-error)' } : {}}
                />
                {actionData?.errors?.sellerContactEmail?.[0] && <span style={{ color: 'var(--cr-error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{actionData.errors.sellerContactEmail[0]}</span>}
              </div>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Contact Phone</label>
                <input type="tel" className="cr-input" name="sellerContactPhone" defaultValue={config?.sellerContactPhone ?? ""} autoComplete="tel" />
              </div>
            </div>

            <hr className="cr-divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Home Country <span style={{ color: 'var(--cr-text-muted)' }}>(identifies intl. orders)</span></label>
                <select className="cr-input" name="homeCountry" defaultValue={config?.homeCountry ?? "US"}>
                  {COUNTRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="cr-body-text" style={{ display: 'block', marginBottom: '8px', color: '#fff', fontWeight: 500 }}>Default Currency</label>
                <select className="cr-input" name="defaultCurrency" defaultValue={config?.defaultCurrency ?? "USD"}>
                  {CURRENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            <hr className="cr-divider" />

            <div>
              <h3 className="cr-card-title" style={{ marginBottom: '4px' }}>Exempt Tags</h3>
              <p className="cr-body-text" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Products with these tags will be excluded from customs audits (e.g. digital, giftcard).</p>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {exemptTags.map(tag => (
                  <span key={tag} className="cr-tag cr-tag--default" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    {tag} 
                    <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '6px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>&times;</button>
                  </span>
                ))}
                {exemptTags.length === 0 && <span className="cr-body-text" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No exempt tags added.</span>}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  className="cr-input"
                  placeholder="e.g. digital, giftcard"
                  value={exemptTagInput}
                  onChange={(e) => setExemptTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button type="button" className="cr-btn cr-btn--secondary" onClick={addTag}>Add Tag</button>
              </div>
              
              <input type="hidden" name="exemptTagsRaw" value={exemptTags.join(",")} />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="cr-btn cr-btn--primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </Form>
        </div>
      </div>
    </div>
  );
}
