import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const NON_HTML_PREFIXES = ['/api', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (NON_HTML_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.delete('X-Frame-Options');

  const shop = searchParams.get('shop');
  if (shop) {
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors https://${shop} https://admin.shopify.com;`
    );
  } else if (pathname === '/privacy' || pathname === '/terms' || pathname === '/support') {
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none';");
  }

  return response;
}

export const config = {
  matcher: ['/((?!.*\\.).*)']
};
