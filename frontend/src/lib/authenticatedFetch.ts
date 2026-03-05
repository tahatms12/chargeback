'use client';

import { getSessionToken } from '@shopify/app-bridge/utilities';
import { getAppBridge } from './shopifyAppBridge';

export type ShopifyFetchContext = {
  shop: string;
  host: string;
};

export async function shopifyFetch(path: string, options: RequestInit = {}, ctx: ShopifyFetchContext) {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

  if (!backendBase) throw new Error('Missing NEXT_PUBLIC_BACKEND_BASE_URL');
  if (!ctx.shop) throw new Error('Missing shop');
  if (!ctx.host) throw new Error('Missing host');

  const app = getAppBridge(ctx.host, apiKey ?? '');
  const token = await getSessionToken(app);

  const url = `${backendBase}${path}`;
  const headers = new Headers(options.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    window.location.href = `${backendBase}/api/auth/install?shop=${encodeURIComponent(ctx.shop)}`;
    throw new Error('Unauthorized - redirecting to OAuth install');
  }

  return response;
}
