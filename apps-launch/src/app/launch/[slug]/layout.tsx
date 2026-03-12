import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function LaunchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getAppData(slug);
  
  if (!app) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white selection:bg-emerald-500 selection:text-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href={`/launch/${app.slug}`} className="relative h-8 w-32 flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src={`/assets/${app.slug}/logo/logo-black.png`} 
              alt={`${app.name} Logo`} 
              fill 
              className="object-contain object-left"
            />
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
            <Link href={`/launch/${app.slug}/help`} className="hover:text-black transition-colors">Setup & Help</Link>
            <Link href={`/launch/${app.slug}/support`} className="hover:text-black transition-colors">Support</Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-12 px-4 md:px-8 mt-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-black mb-4">{app.name}</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              {app.websiteSafe}
            </p>
            <p className="text-xs text-gray-400">
              Built by Uplift Technologies Pro.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href={`/launch/${app.slug}/help`} className="hover:text-black transition-colors">Documentation</Link></li>
              <li><Link href={`/launch/${app.slug}/support`} className="hover:text-black transition-colors">Submit Support Ticket</Link></li>
              <li><Link href={`/launch/${app.slug}/security`} className="hover:text-black transition-colors">Security & Trust</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href={`/launch/${app.slug}/privacy`} className="hover:text-black transition-colors">Privacy Policy</Link></li>
              <li><Link href={`/launch/${app.slug}/terms`} className="hover:text-black transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
