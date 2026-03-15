import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas — la validación real del token ocurre en los componentes
  // (localStorage no es accesible en Edge Runtime)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    // Bloquear iframes en rutas protegidas
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
