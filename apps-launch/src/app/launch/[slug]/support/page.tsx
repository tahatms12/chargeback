import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function SupportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-black">Support</h1>
      <div className="prose prose-gray max-w-none text-gray-700">
        
        <h2>How to get help</h2>
        <p>If you are experiencing issues with {app.name}, please contact our engineering support team directly at <strong>support@uplifttechnologies.pro</strong>.</p>
        
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg my-8">
          <h3 className="text-lg font-bold text-black mt-0">Support Scope</h3>
          <p className="mb-0">Our team is ready to assist with:</p>
          <ul className="mb-0">
            <li>Onboarding and installation troubleshooting</li>
            <li>Dashboard and settings configuration</li>
            <li>Bug reports and unintended behavior</li>
            <li>{app.supportThemes}</li>
          </ul>
        </div>

        <h2>Expected Workflow</h2>
        <p>When submitting an issue, please include:</p>
        <ol>
          <li>Your `myshopify.com` store domain.</li>
          <li>A brief description of exactly what went wrong.</li>
          <li>Steps to reproduce the issue.</li>
          <li>Any available screenshots of the error or misbehavior.</li>
        </ol>
        <p>We typically reply to support inquiries within 1-2 business days, triaged based on severity affecting live store operations.</p>

        <h2>Documentation</h2>
        <p>Before emailing, you may find your answer in our <a href={`/launch/${app.slug}/help`} className="text-black font-medium underline">Setup & Help Guide</a>.</p>

      </div>
    </div>
  );
}
