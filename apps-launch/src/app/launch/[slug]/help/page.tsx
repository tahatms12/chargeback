import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function HelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-black">Setup & Documentation</h1>
      <div className="prose prose-gray max-w-none text-gray-700">
        
        <h2>Installation</h2>
        <p>Installing {app.name} requires merchant admin privileges on your Shopify store.</p>
        <ol>
          <li>Navigate to the Shopify App Store listing.</li>
          <li>Click <strong>Install</strong>.</li>
          <li>Review the permission scopes required for {app.name} to operate.</li>
          <li>Confirm installation to be redirected to the app dashboard.</li>
        </ol>
        
        {app.onlineStoreRequired && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
            <h3 className="text-blue-800 m-0 text-lg font-bold">Online Store Channel Required</h3>
            <p className="text-blue-900 mt-2">
              Because this app connects to customer-facing frontend experiences, you must have the Online Store sales channel active on your Shopify plan.
            </p>
          </div>
        )}

        <h2>Prerequisites & Setup</h2>
        <p><strong>Required setup steps:</strong> {app.setupRequirements}</p>
        <p><strong>System prerequisites:</strong> {app.installPrereqs}</p>
        
        <h2>Uninstallation</h2>
        <p>If you choose to uninstall the app, you may do so directly from your Shopify Admin &gt; Settings &gt; Apps and Sales Channels. Uninstalling will immediately revoke our API access. Background syncs and jobs will halt. No manual theme code removal is required for modern App Blocks, though you should visually confirm any Theme Editor blocks are deactivated if they were placed manually.</p>

        <h2>Common Issues</h2>
        <p>If you encounter issues during setup, it is often due to missing prerequisites or cached browser sessions. Try clearing your browser cache or opening the app in an incognito window. If the issue persists, review the <a href={`/launch/${app.slug}/support`} className="text-black font-medium underline">Support Page</a>.</p>

      </div>
    </div>
  );
}
