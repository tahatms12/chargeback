import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Terms of Service - FixitCSV" }];
};

export default function TermsOfService() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Terms of Service</h1>
      <p>Last updated: March 20, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By installing and using FixitCSV ("the App"), you agree to these Terms of Service. If you do not agree, do not use the App.</p>

      <h2>2. Description of Service</h2>
      <p>The App provides tools to export your Shopify order and customer data into formatted CSV files.</p>

      <h2>3. User Responsibilities</h2>
      <p>You are responsible for ensuring that the data exported is handled safely and complies with local privacy laws and regulations.</p>

      <h2>4. Liability</h2>
      <p>FixitCSV is provided "as is". We are not liable for any data loss, formatting inconsistencies, or business interruptions resulting from the use of our exports.</p>

      <h2>5. Billing</h2>
      <p>Any applicable charges for using the App are billed directly through the Shopify Billing API. You agree to pay all charges associated with your selected plan.</p>

      <h2>6. Contact Us</h2>
      <p>If you have any questions about these Terms, please contact <strong>support@uplifttechnologies.pro</strong>.</p>
    </div>
  );
}
