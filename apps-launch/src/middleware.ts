import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Allowed App Slugs
  const slugs = ['craftline', 'fixitcsv', 'stagewise', 'customsready', 'poref', 'quoteloop'];
  
  // Find which slug this hostname is targeting
  const matchedSlug = slugs.find(s => hostname.includes(s));

  // Bypass if static, api, or direct internal call
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.includes('.') ||
    url.pathname.startsWith('/launch') // Prevent recursion
  ) {
    return NextResponse.next();
  }

  // Rewrite to internal structure /launch/[slug]/...
  if (matchedSlug) {
    url.pathname = `/launch/${matchedSlug}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
