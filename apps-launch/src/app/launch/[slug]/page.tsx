import { getAppData } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';

export default async function AppHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = getAppData(slug);
  
  if (!app) notFound();

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative bg-black text-white py-32 px-4 md:px-8 border-b border-gray-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20 bg-emerald-500 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="mb-8 w-64 h-24 relative opacity-90 hover:opacity-100 transition-opacity">
            <Image 
              src={`/assets/${app.slug}/logo/logo-white.png`} 
              alt={`${app.name} Logo`} 
              fill 
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
            {app.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            {app.positioning}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={`https://apps.shopify.com/placeholder-${app.slug}`} target="_blank" rel="noreferrer" className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Install {app.name}
            </a>
            <Link href={`/launch/${app.slug}/help`} className="bg-gray-900/50 backdrop-blur-md text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition-all border border-gray-700 hover:border-gray-500">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshot Showcase */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto w-full -mt-40 relative z-20">
         <div className="rounded-2xl border border-gray-200/50 shadow-2xl overflow-hidden bg-white/50 backdrop-blur-xl p-2 group hover:shadow-emerald-500/10 transition-shadow duration-500">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-100">
               <Image 
                 src={`/assets/${app.slug}/screenshots/dashboard.png`} 
                 alt={`${app.name} Dashboard Screenshot`} 
                 fill 
                 className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-700 ease-out" 
               />
            </div>
         </div>
      </section>

      {/* Value Prop & Features */}
      <section className="px-4 md:px-8 max-w-6xl mx-auto w-full mt-12">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full mb-6 border border-emerald-100">
              Why {app.name}?
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-6 text-black leading-tight">
              {app.websiteSafe.split('.')[0]}.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {app.websiteSafe.split('.').slice(1).join('.').trim()}
            </p>
            
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Core Problem Solved</h3>
              <p className="text-gray-900 font-medium text-lg mb-8">{app.problem}</p>
              
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Built For</h3>
              <p className="text-gray-900 font-medium text-lg">{app.user}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 border border-gray-200 shadow-inner">
             <h3 className="text-2xl font-bold text-black mb-8">Platform Features</h3>
             <ul className="space-y-6">
               {app.features.map((feature, idx) => (
                 <li key={idx} className="flex gap-4 items-start group">
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-200 group-hover:border-emerald-500 group-hover:text-emerald-500 text-gray-400 transition-colors">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <span className="text-gray-800 font-semibold text-lg pt-0.5">{feature}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 md:px-8 max-w-5xl mx-auto w-full mb-12">
         <div className="bg-black text-white p-12 md:p-16 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full"></div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8 relative z-10">How it works</h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium relative z-10">
              "{app.howItWorks}"
            </p>
         </div>
      </section>
    </div>
  );
}
