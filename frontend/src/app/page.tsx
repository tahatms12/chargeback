'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { useSearchParams } from 'next/navigation';
import { EndpointUnavailableError, getDisputes } from '@/lib/api';
import { LoadingState, UnavailableState } from '@/components/PageState';

export default function OverviewPage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ openDisputes: 'Unavailable', lastSync: 'Unavailable', deadlines: 'Unavailable' });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!shop || !host) return;
      try {
        const disputes = await getDisputes({ shop, host });
        setStats({
          openDisputes: String((disputes?.items ?? disputes ?? []).length),
          lastSync: new Date().toLocaleString(),
          deadlines: String((disputes?.items ?? disputes ?? []).filter((d: any) => d.deadline).length)
        });
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? e.message : 'Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [shop, host]);

  const tiles = useMemo(() => [
    ['Active shop', shop || 'Unavailable'],
    ['Last sync', stats.lastSync],
    ['Open disputes', stats.openDisputes],
    ['Upcoming deadlines', stats.deadlines]
  ], [shop, stats]);

  return (
    <EmbeddedAppShell>
      <h2>Overview</h2>
      {loading ? <LoadingState /> : null}
      {error ? <UnavailableState message={error} /> : null}
      <div className="grid">
        {tiles.map(([label, value]) => (
          <section className="card" key={label}>
            <div>{label}</div>
            <h3>{value}</h3>
          </section>
        ))}
      </div>
    </EmbeddedAppShell>
  );
}
