import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function PrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-black">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none text-gray-700">
        <p><strong>Last Updated:</strong> March 2026</p>
        
        <h2>1. Data Collection from Shopify</h2>
        <p>When you install {app.name}, we are granted specific permissions via Shopify's OAuth architecture. Our guiding principle is absolute data minimization.</p>
        
        {app.usesProtectedCustomerData && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
            <h3 className="text-amber-800 m-0 text-lg font-bold">Protected Customer Data Usage</h3>
            <p className="text-amber-900 mt-2">
              This application requires access to Protected Customer Data strictly for the operational requirements of the feature set ({app.dataHandling}). 
              We do not sell this data. It is never used for marketing purposes by our team.
            </p>
          </div>
        )}

        <h2>2. Data Handling Practices</h2>
        <p>{app.dataHandling}</p>

        {app.hasTrackingCookies ? (
           <>
           <h2>3. Cookies and Analytics</h2>
           <p>This app utilizes essential session cookies and performance telemetry to maintain security and monitor application health. No third-party ad tracking is injected into your merchant administration or storefront.</p>
           </>
        ) : (
           <>
           <h2>3. Cookies and Analytics</h2>
           <p>We do not use tracking cookies or third-party analytics pixels within the embedded application. App Bridge session tokens manage authorization.</p>
           </>
        )}

        <h2>4. Retention and Deletion</h2>
        <p>When you uninstall the app, we receive a compliance webhook from Shopify (<code>app/uninstalled</code>). We delete all merchant-specific data associated with your store within 48 hours of receiving this payload, retaining only anonymized operational logs for up to 30 days for security and debugging as required by engineering policies.</p>
        <p>If you require immediate manual deletion or a data export pursuant to GDPR, please review our Data Deletion policy or contact support.</p>

        <h2>5. Jurisdiction</h2>
        <p>Data is stored in isolated US-based cloud infrastructure governed by standard US commercial practices.</p>

        <h2>6. Contact</h2>
        <p>Privacy-related inquiries can be directed to support via the <a href={`/launch/${app.slug}/support`} className="text-black font-medium underline">Support Page</a>.</p>
      </div>
    </div>
  );
}
