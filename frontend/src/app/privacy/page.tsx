'use client';

import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';

export default function PrivacyPage() {
  return (
    <EmbeddedAppShell>
      <h2>Privacy Policy</h2>
      <section className="card">
        <p>Chargeback Tracker processes only the data needed to monitor dispute deadlines and build evidence packets.</p>
        <p>We store dispute metadata, order references, and uploaded evidence artifacts for workflow management and legal record-keeping.</p>
        <p>We do not sell merchant data. Access is restricted by role, encrypted in transit, and retained only for required compliance periods.</p>
      </section>
    </EmbeddedAppShell>
  );
}
