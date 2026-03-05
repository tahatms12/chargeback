'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { EndpointUnavailableError, getEvidence } from '@/lib/api';
import { LoadingState, UnavailableState } from '@/components/PageState';

export default function EvidencePage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!shop || !host) return;
      try {
        const data = await getEvidence({ shop, host });
        setItems(data?.items ?? data ?? []);
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? 'Uploads disabled: backend endpoint unavailable.' : 'Evidence library unavailable');
      }
    };
    void load();
  }, [shop, host]);

  return (
    <EmbeddedAppShell>
      <h2>Evidence Library</h2>
      {!items.length && !error ? <LoadingState /> : null}
      {error ? <UnavailableState message={error} /> : null}
      <section className="card">
        <strong>Document types</strong>
        <ul>
          {(items.length ? items : [{ type: 'Proof of delivery' }, { type: 'Order confirmation' }]).map((e, idx) => (
            <li key={idx}>{e.type ?? e.document_type ?? 'Document'}</li>
          ))}
        </ul>
        <button className="button" disabled>Uploads disabled</button>
      </section>
    </EmbeddedAppShell>
  );
}
