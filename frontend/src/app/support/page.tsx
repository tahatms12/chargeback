'use client';

import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';

export default function SupportPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@example.com';
  const url = process.env.NEXT_PUBLIC_SUPPORT_URL ?? 'https://example.com/support';

  return (
    <EmbeddedAppShell>
      <h2>Support</h2>
      <section className="card">
        <p>Chargeback deadlines can be strict. If you need help with dispute evidence quality, response timing, or audit logs, contact our support team.</p>
        <p>Email: <a href={`mailto:${email}`}>{email}</a></p>
        <p>Portal: <a href={url} target="_blank" rel="noreferrer">{url}</a></p>
        <p>Typical response time: within one business day.</p>
      </section>
    </EmbeddedAppShell>
  );
}
