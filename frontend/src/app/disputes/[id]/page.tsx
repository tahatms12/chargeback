'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { EndpointUnavailableError, getDispute } from '@/lib/api';
import { LoadingState, UnavailableState } from '@/components/PageState';

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id || !shop || !host) return;
      try {
        setItem(await getDispute(id, { shop, host }));
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? e.message : 'Dispute details unavailable');
      }
    };
    void load();
  }, [id, shop, host]);

  return (
    <EmbeddedAppShell>
      <h2>Dispute {id}</h2>
      {!item && !error ? <LoadingState /> : null}
      {error ? <UnavailableState message={error} /> : null}
      {item ? (
        <>
          <section className="card">
            <strong>Deadline banner</strong>
            <p>Respond by: {item.deadline ?? 'Unavailable'}</p>
          </section>
          <section className="card">
            <strong>Evidence checklist</strong>
            <ul>
              <li>Order timeline</li>
              <li>Delivery confirmation</li>
              <li>Communication records</li>
            </ul>
          </section>
          <section className="card">
            <strong>Timeline / Events</strong>
            <p>{item.timeline ?? 'No event timeline returned by backend.'}</p>
          </section>
        </>
      ) : null}
    </EmbeddedAppShell>
  );
}
