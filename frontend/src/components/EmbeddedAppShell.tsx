'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmbeddedLayout } from './EmbeddedLayout';
import { getAppBridge } from '@/lib/shopifyAppBridge';

export function EmbeddedAppShell({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const shop = params.get('shop') ?? '';
  const host = params.get('host') ?? '';
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? '';

  const error = useMemo(() => {
    if (!shop) return 'Missing shop parameter';
    if (!apiKey) return 'Missing NEXT_PUBLIC_SHOPIFY_API_KEY';
    return null;
  }, [shop, apiKey]);

  if (error) {
    return (
      <div className="main">
        <h2>{error}</h2>
        <p>This app must be opened from Shopify Admin.</p>
      </div>
    );
  }

  if (!host) {
    if (typeof window !== 'undefined') {
      window.top!.location.href = `https://${shop}/admin/apps/${apiKey}`;
    }
    return (
      <div className="main">
        <h2>Re-opening in Shopify Admin…</h2>
      </div>
    );
  }

  getAppBridge(host, apiKey);
  return <EmbeddedLayout>{children}</EmbeddedLayout>;
}
