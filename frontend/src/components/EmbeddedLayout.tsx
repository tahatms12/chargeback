'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const links = [
  ['/', 'Overview'],
  ['/disputes', 'Disputes'],
  ['/templates', 'Templates'],
  ['/evidence', 'Evidence'],
  ['/billing', 'Billing'],
  ['/settings', 'Settings'],
  ['/support', 'Support'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms']
];

export function EmbeddedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop') ?? '';
  const host = searchParams.get('host') ?? '';
  const query = new URLSearchParams();
  if (shop) query.set('shop', shop);
  if (host) query.set('host', host);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Chargeback Tracker</h1>
        <nav>
          {links.map(([href, label]) => (
            <Link key={href} href={`${href}${suffix}`} className={pathname === href ? 'active' : ''}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
