import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Bu sayfalar login gerektirmez
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/pdks/kayit'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public path ise geç
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Static dosyalar ve _next için geç
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Token kontrolü
  const token = req.cookies.get('areena_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('areena_token');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
