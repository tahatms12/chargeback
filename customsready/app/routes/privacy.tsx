import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Privacy Policy - CustomsReady Lite" }];
};

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: March 20, 2026</p>
      
      <h2>1. Information We Collect</h2>
      <p>CustomsReady Lite collects the following data necessary to provide customs document generation (such as commercial invoices and CN22/CN23 forms):</p>
      <ul>
        <li><strong>Order Data:</strong> Line items, product details, prices, and quantities from orders you select for document generation.</li>
        <li><strong>Customer Information:</strong> Shipping addresses, customer names, and contact information strictly to populate shipping documents.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>Your data is used exclusively to generate international shipping documents (Commercial Invoices, CN22, CN23). We do not use customer or order data for marketing purposes.</p>

      <h2>3. Data Retention and Storage</h2>
      <p>We retain transaction logs for PDF generation temporarily to ensure service delivery. Raw customer PII is not stored long-term and is deleted continuously upon Shopify's mandatory GDPR redaction requests.</p>

      <h2>4. Third-Party Sharing</h2>
      <p>We do not sell, rent, or share your store's data or your customers' data with any third parties, except as required to provide the core app functionality.</p>

      <h2>5. Your Rights (GDPR & CCPA)</h2>
      <p>You have the right to request access to or deletion of your data. Shopify automatically manages customer data redaction and shop redaction requests, which our app fulfills within mandatory timeframes.</p>

      <h2>6. Contact Us</h2>
      <p>For privacy inquiries or data requests, contact us at <strong>support@uplifttechnologies.pro</strong>.</p>
    </div>
  );
}
