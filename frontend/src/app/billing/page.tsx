'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { EndpointUnavailableError, getBillingStatus } from '@/lib/api';
import { shopifyFetch } from '@/lib/authenticatedFetch';
import { UnavailableState } from '@/components/PageState';

export default function BillingPage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [status, setStatus] = useState<any>({ plan: 'Unavailable' });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!shop || !host) return;
      try {
        setStatus(await getBillingStatus({ shop, host }));
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? e.message : 'Billing status unavailable');
      }
    };
    void load();
  }, [shop, host]);

  const onManage = async () => {
    try {
      const res = await shopifyFetch('/api/billing/manage', { method: 'POST' }, { shop, host });
      const data = await res.json();
      if (data?.redirect_url) window.top!.location.href = data.redirect_url;
    } catch {
      setError('Manage billing endpoint unavailable');
    }
  };

  return (
    <EmbeddedAppShell>
      <h2>Billing</h2>
      {error ? <UnavailableState message={error} /> : null}
      <section className="card">
        <p>Plan status: <strong>{status.plan ?? 'Unavailable'}</strong></p>
        <button className="button" onClick={onManage}>Manage billing</button>
      </section>
    </EmbeddedAppShell>
  );
}
