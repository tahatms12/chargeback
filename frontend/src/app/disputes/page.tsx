'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmbeddedAppShell } from '@/components/EmbeddedAppShell';
import { EndpointUnavailableError, getDisputes } from '@/lib/api';
import { LoadingState, UnavailableState } from '@/components/PageState';

export default function DisputesPage() {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      if (!shop || !host) return;
      try {
        const data = await getDisputes({ shop, host });
        setItems(data?.items ?? data ?? []);
      } catch (e) {
        setError(e instanceof EndpointUnavailableError ? e.message : 'Disputes could not be loaded');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [shop, host]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = !search || `${item.id ?? ''}${item.order_id ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'all' || item.status === status;
    return matchesSearch && matchesStatus;
  }), [items, search, status]);

  const query = new URLSearchParams();
  if (shop) query.set('shop', shop);
  if (host) query.set('host', host);

  return (
    <EmbeddedAppShell>
      <h2>Disputes</h2>
      <div className="card" style={{ display: 'flex', gap: 8 }}>
        <input className="input" placeholder="Search by dispute/order id" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <UnavailableState message={error} /> : null}
      <div className="card">
        <table className="table">
          <thead><tr><th>Dispute ID</th><th>Order ID</th><th>Reason</th><th>Deadline</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td><Link href={`/disputes/${d.id}?${query.toString()}`}>{d.id ?? 'Unknown'}</Link></td>
                <td>{d.order_id ?? 'Unknown'}</td>
                <td>{d.reason ?? 'Unknown'}</td>
                <td>{d.deadline ?? 'Unknown'}</td>
                <td><span className="badge">{d.status ?? 'Unknown'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EmbeddedAppShell>
  );
}
