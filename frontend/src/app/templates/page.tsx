'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { EndpointUnavailableError, getTemplates } from '@/lib/api';
import { LoadingState, UnavailableState } from '@/components/PageState';

export default function TemplatesPage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!shop || !host) return;
      try {
        const data = await getTemplates({ shop, host });
        const rows = data?.items ?? data ?? [];
        setItems(rows);
        setSelected(rows[0] ?? null);
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? e.message : 'Templates unavailable');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [shop, host]);

  return (
    <EmbeddedAppShell>
      <h2>Templates</h2>
      {loading ? <LoadingState /> : null}
      {error ? <UnavailableState message={error} /> : null}
      <div className="grid">
        <section className="card">
          <strong>Template library</strong>
          <ul>
            {items.map((t) => (
              <li key={t.id}><button className="button" onClick={() => setSelected(t)}>{t.name ?? t.id}</button></li>
            ))}
          </ul>
        </section>
        <section className="card">
          <strong>Template preview</strong>
          <p>{selected?.body ?? 'Select a template to review merchant-facing evidence text.'}</p>
        </section>
      </div>
    </EmbeddedAppShell>
  );
}
