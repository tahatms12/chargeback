import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  // Not rendering login(request) on root so we can show the marketing site
  return null;
};

const WORDS = ["Instantly.", "Accurately.", "Effortlessly."];

export default function Index() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans selection:bg-white/20">
      {/* NAV */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-black/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-xl tracking-tight text-white hover:opacity-80 transition cursor-pointer">
            fixitcsv
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
          <button className="bg-white text-black rounded-full px-5 py-2 text-sm font-semibold hover:bg-white/90 transition shadow-lg">
            Fix my CSV →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex flex-col items-center pt-32 pb-24 px-6 max-w-5xl mx-auto text-center overflow-hidden min-h-[85vh] justify-center">
        <div className="inline-block rounded-full border border-white/20 bg-white/5 text-[10px] sm:text-xs uppercase tracking-widest px-4 py-1.5 mb-8">
          AI-powered · Shopify-native
        </div>
        
        <h1 className="text-[clamp(3rem,6vw,6rem)] font-black leading-[1.1] tracking-tight text-white m-0">
          <div className="block">Fix your CSV.</div>
          <div className="block">Upload once.</div>
          <div className="block h-[1.2em] overflow-hidden relative mt-1">
            {WORDS.map((word, idx) => (
              <span
                key={word}
                className={`absolute inset-0 transition-opacity duration-500`}
                style={{
                  opacity: idx === wordIndex ? 1 : 0,
                  transform: idx === wordIndex ? 'translateY(0)' : 'translateY(12px)'
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </h1>

        <p className="max-w-xl mx-auto text-lg text-white/60 mt-8 leading-relaxed">
          Drop a broken product CSV. Get a clean, Shopify-ready file back in seconds — no manual fixing, no formulas, no frustration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <button className="bg-white text-black rounded-full px-8 py-3.5 font-semibold hover:bg-white/90 transition shadow-lg shadow-white/10">
            Fix my CSV free →
          </button>
          <button className="bg-transparent border border-white/20 text-white rounded-full px-8 py-3.5 font-semibold hover:bg-white/5 transition">
            See how it works
          </button>
        </div>

        {/* Hero Visual Output */}
        <div className="mt-20 w-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-[#0f0f15] relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-green-500/10 pointer-events-none" />
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-6 sm:border-r border-white/5">
              <div className="text-xs uppercase tracking-widest text-red-500 mb-4 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Before
              </div>
              <table className="w-full text-left text-sm text-white/40">
                <thead><tr className="border-b border-white/10"><th className="pb-2 font-medium">Handle</th><th className="pb-2 font-medium">Title</th><th className="pb-2 font-medium">Price</th></tr></thead>
                <tbody>
                  <tr className="bg-red-500/10"><td className="py-2.5 line-through">n/a</td><td className="py-2.5 text-white/70">T_Shirt_Blue</td><td className="py-2.5">25,00</td></tr>
                  <tr><td className="py-2.5 border-t border-white/5">t-shirt</td><td className="py-2.5 border-t border-white/5 text-white/70">T-Shirt</td><td className="py-2.5 border-t border-white/5">25.00</td></tr>
                </tbody>
              </table>
            </div>
            <div className="flex-1 p-6 bg-green-500/5">
             <div className="text-xs uppercase tracking-widest text-green-500 mb-4 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> After
              </div>
              <table className="w-full text-left text-sm text-white/80">
                <thead><tr className="border-b border-white/10"><th className="pb-2 font-medium">Handle</th><th className="pb-2 font-medium">Title</th><th className="pb-2 font-medium">Variant Price</th></tr></thead>
                <tbody>
                  <tr><td className="py-2.5 text-green-400">t-shirt-blue</td><td className="py-2.5">T-Shirt Blue</td><td className="py-2.5 text-green-400">25.00</td></tr>
                  <tr><td className="py-2.5 border-t border-white/5">t-shirt</td><td className="py-2.5 border-t border-white/5">T-Shirt</td><td className="py-2.5 border-t border-white/5">25.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="py-12 border-y border-white/5 overflow-hidden">
        <p className="text-xs text-white/30 uppercase tracking-widest text-center mb-8">
          Trusted by Shopify merchants fixing their catalogs daily
        </p>
        <div className="flex relative overflow-hidden whitespace-nowrap">
          <div className="marquee-track">
            {["Fashion Boutique", "Electronics Store", "Home Goods Co.", "Sports Gear", "Pet Supplies", "Beauty Brand"].map((name, i) => (
              <span key={`1-${i}`} className="text-white/40 text-sm font-medium mx-8">{name}</span>
            ))}
            {["Fashion Boutique", "Electronics Store", "Home Goods Co.", "Sports Gear", "Pet Supplies", "Beauty Brand"].map((name, i) => (
              <span key={`2-${i}`} className="text-white/40 text-sm font-medium mx-8">{name}</span>
            ))}
            {["Fashion Boutique", "Electronics Store", "Home Goods Co.", "Sports Gear", "Pet Supplies", "Beauty Brand"].map((name, i) => (
              <span key={`3-${i}`} className="text-white/40 text-sm font-medium mx-8">{name}</span>
            ))}
            {["Fashion Boutique", "Electronics Store", "Home Goods Co.", "Sports Gear", "Pet Supplies", "Beauty Brand"].map((name, i) => (
              <span key={`4-${i}`} className="text-white/40 text-sm font-medium mx-8">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 max-w-6xl mx-auto px-6">
        <div className="text-xs uppercase tracking-widest text-white/30 text-center">How it works</div>
        <h2 className="text-4xl md:text-5xl font-black text-white text-center mt-3 tracking-tight">
          From broken to ready in three steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition duration-300 group">
            <svg className="w-8 h-8 text-white/70 mb-6 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-3">Drop your CSV</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Paste or upload any product export — from Shopify, WooCommerce, spreadsheets, or supplier files.
            </p>
          </div>
          
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition duration-300 group">
             <svg className="w-8 h-8 text-white/70 mb-6 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-3">AI detects and repairs</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Missing handles, malformed variants, wrong column names, duplicate rows — detected and corrected automatically.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 hover:border-white/15 transition duration-300 group">
            <svg className="w-8 h-8 text-white/70 mb-6 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-3">Get a clean file</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Download a Shopify-ready CSV with a full diff report showing every change made.
            </p>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl md:text-6xl font-black text-white">10,000+</div>
            <div className="text-xs md:text-sm text-white/40 mt-3 font-semibold uppercase tracking-widest">CSVs processed</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-white">&lt; 30s</div>
            <div className="text-xs md:text-sm text-white/40 mt-3 font-semibold uppercase tracking-widest">average fix time</div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-white">47 types</div>
            <div className="text-xs md:text-sm text-white/40 mt-3 font-semibold uppercase tracking-widest">of errors auto-corrected</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-center text-white tracking-tight">What merchants say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 md:p-10">
            <p className="text-lg text-white/80 leading-relaxed italic">
              "I used to spend half a day fixing supplier CSVs before every import. Now it takes 30 seconds."
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">OL</div>
              <div>
                <div className="text-sm font-bold text-white">Operations Lead</div>
                <div className="text-xs text-white/40 mt-0.5">Apparel Store</div>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 md:p-10">
            <p className="text-lg text-white/80 leading-relaxed italic">
              "The diff report alone is worth it. I can see exactly what was changed before I upload to Shopify."
            </p>
             <div className="mt-8 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">FB</div>
               <div>
                <div className="text-sm font-bold text-white">Founder</div>
                <div className="text-xs text-white/40 mt-0.5">Home Goods Brand</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-32 px-6 text-center border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
          Your next import is one upload away.
        </h2>
        <div className="mt-10">
          <button className="bg-white text-black rounded-full px-10 py-4 text-lg font-bold hover:bg-white/90 transition shadow-xl shadow-white/10">
            Fix my CSV free →
          </button>
          <p className="text-sm text-white/30 mt-4">No account required. No credit card.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-black text-xl tracking-tight text-white/80">
              fixitcsv
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="#privacy" className="hover:text-white transition">Privacy</a>
              <a href="#terms" className="hover:text-white transition">Terms</a>
              <a href="#contact" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center md:text-left text-xs text-white/20">
            © 2025 FixitCSV. Built for Shopify merchants.
          </div>
        </div>
      </footer>
    </div>
  );
}
