'use client';

import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';

export default function TermsPage() {
  return (
    <EmbeddedAppShell>
      <h2>Terms of Service</h2>
      <section className="card">
        <p>Chargeback Tracker is provided to help merchants prepare and submit evidence for payment disputes.</p>
        <p>Merchants remain responsible for reviewing generated evidence and meeting card-network response deadlines.</p>
        <p>Service availability may depend on Shopify platform access and connected payment processors.</p>
      </section>
    </EmbeddedAppShell>
  );
}
