import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function TermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-black">Terms of Service</h1>
      <div className="prose prose-gray max-w-none text-gray-700">
        <p><strong>Last Updated:</strong> March 2026</p>
        
        <h2>1. Scope of Service</h2>
        <p>The {app.name} application ("App") is an add-on service for Shopify merchants. {app.positioning} The App is provided "as is" and intended to function seamlessly with supported Shopify tier plans.</p>

        {app.hasBilling && (
           <>
           <h2>2. Billing and Payments</h2>
           <p>All billing goes through the Shopify App Store Billing API. Charges are applied directly to your Shopify invoice. We do not process or store credit card information. Full subscription terms are presented during the Shopify authorization flow.</p>
           </>
        )}

        <h2>3. Acceptable Use</h2>
        <p>You agree to use {app.name} strictly for its intended purpose and in compliance with your own Shopify Terms of Service. Attempting to reverse-engineer, overload, or bypass security mechanics of the App is prohibited and will result in immediate termination.</p>

        <h2>4. Limitations regarding Store Performance</h2>
        <p>{app.limitations}</p>

        <h2>5. Termination and Uninstall</h2>
        <p>You may terminate your usage of {app.name} at any time by uninstalling the application from your Shopify Admin panel. Upon uninstallation, scheduled background jobs associated with your store will be halted, and data deletion workflows will commence per our Privacy Policy.</p>

        <h2>6. Limitation of Liability</h2>
        <p>Uplift Technologies Pro is not liable for indirect, incidental, or consequential damages resulting from the use or inability to use the application, including but not limited to lost profit margins or data corruption within your Shopify instance beyond our direct control.</p>

      </div>
    </div>
  );
}
