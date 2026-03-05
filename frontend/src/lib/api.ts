'use client';

import { shopifyFetch, ShopifyFetchContext } from './authenticatedFetch';

export class EndpointUnavailableError extends Error {
  constructor(endpoint: string) {
    super(`Backend endpoint unavailable: ${endpoint}`);
    this.name = 'EndpointUnavailableError';
  }
}

async function parseOrUnavailable(response: Response, endpoint: string) {
  if (response.status === 404) throw new EndpointUnavailableError(endpoint);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export async function getDisputes(ctx: ShopifyFetchContext) {
  const res = await shopifyFetch('/api/disputes', {}, ctx);
  return parseOrUnavailable(res, '/api/disputes');
}

export async function getDispute(id: string, ctx: ShopifyFetchContext) {
  const res = await shopifyFetch(`/api/disputes/${id}`, {}, ctx);
  return parseOrUnavailable(res, `/api/disputes/${id}`);
}

export async function getTemplates(ctx: ShopifyFetchContext) {
  const res = await shopifyFetch('/api/templates', {}, ctx);
  return parseOrUnavailable(res, '/api/templates');
}

export async function getEvidence(ctx: ShopifyFetchContext) {
  const res = await shopifyFetch('/api/evidence', {}, ctx);
  return parseOrUnavailable(res, '/api/evidence');
}

export async function getBillingStatus(ctx: ShopifyFetchContext) {
  const res = await shopifyFetch('/api/billing/status', {}, ctx);
  return parseOrUnavailable(res, '/api/billing/status');
}
