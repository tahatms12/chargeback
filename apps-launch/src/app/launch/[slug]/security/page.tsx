import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function SecurityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-black">Security & Trust</h1>
      <div className="prose prose-gray max-w-none text-gray-700">
        
        <p className="text-lg">At Uplift Technologies Pro, securing merchant and customer data is a foundational engineering requirement, not an afterthought.</p>
        
        <h2>Authentication Model</h2>
        <p>{app.name} utilizes strict, modern authentication standards mandated by Shopify. We do not use legacy third-party cookie verification.</p>
        <ul>
          <li><strong>App Bridge Session Tokens:</strong> The app dashboard verifies identity via short-lived, cryptographically signed JWTs issued directly by Shopify.</li>
          <li><strong>HMAC Webhook Validation:</strong> All incoming data from Shopify (like uninstalls or order events) is verified using SHA-256 HMAC signatures to guarantee authenticity.</li>
        </ul>

        <h2>Infrastructure</h2>
        <p>The application is hosted on isolated cloud infrastructure. Production environments are strictly separated from staging or development databases. API secrets and encryption keys are injected at runtime and never committed to source control.</p>

        <h2>Data Minimization</h2>
        <p>{app.dataHandling}</p>
        <p>We only request the API scopes absolutely necessary for the application to function. We do not warehouse your entire catalog or order history unnecessarily.</p>

        {app.usesProtectedCustomerData && (
          <div className="bg-gray-100 p-6 rounded-lg my-6">
            <h3 className="font-bold text-black mt-0">Protected Customer Data Handling</h3>
            <p className="mb-0">Because this app handles granular personal information, it undergoes dedicated data privacy audits. Access to logs containing PII is heavily restricted and purged frequently to comply with global data protection laws.</p>
          </div>
        )}

      </div>
    </div>
  );
}
