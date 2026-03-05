'use client';

import createApp from '@shopify/app-bridge';

let appBridgeApp: ReturnType<typeof createApp> | null = null;
let lastHost = '';

export function getAppBridge(host: string, apiKey: string) {
  if (!host) throw new Error('Missing host for App Bridge initialization');
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_SHOPIFY_API_KEY');

  if (!appBridgeApp || lastHost !== host) {
    appBridgeApp = createApp({
      apiKey,
      host,
      forceRedirect: true
    });
    lastHost = host;
  }

  return appBridgeApp;
}
