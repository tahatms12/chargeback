import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Shopify App Platform",
  description: "Accelerate your store operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased scroll-smooth">
      <body className={`${inter.className} bg-white text-gray-900 selection:bg-black selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
