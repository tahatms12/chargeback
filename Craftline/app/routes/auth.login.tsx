import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useNavigation, Form } from '@remix-run/react';
import { login } from '../shopify.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get('shop')) {
    throw await login(request);
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const shop = formData.get('shop') as string;
  if (!shop) return { error: 'Please enter your store domain.' };
  const url = new URL(request.url);
  url.searchParams.set('shop', shop);
  throw await login(new Request(url.toString(), request));
};

export default function AuthLogin() {
  const data = useActionData<typeof action>();
  const nav = useNavigation();
  const isLoading = nav.state !== 'idle';
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Maker Queue</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Enter your Shopify store domain to install.</p>
      <Form method='post'>
        <input name='shop' type='text' placeholder='your-store.myshopify.com' required
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1',
            borderRadius: 6, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }} />
        {data?.error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{data.error}</p>}
        <button type='submit' disabled={isLoading}
          style={{ width: '100%', padding: '10px 14px', background: '#0f172a', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer' }}>
          {isLoading ? 'Redirecting…' : 'Install app'}
        </button>
      </Form>
    </div>
  );
}
