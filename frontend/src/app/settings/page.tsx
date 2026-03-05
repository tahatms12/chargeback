'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';

export default function SettingsPage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? 'Unavailable';
  const host = params.get('host') ?? 'Unavailable';

  return (
    <EmbeddedAppShell>
      <h2>Settings</h2>
      <section className="card">
        <p>Shop: <strong>{shop}</strong></p>
        <p>Host: <strong>{host}</strong></p>
        <p>Backend base URL: <strong>{process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? 'Unset'}</strong></p>
        <p>
          <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms</Link> · <Link href="/support">Support</Link>
        </p>
      </section>
    </EmbeddedAppShell>
  );
}
