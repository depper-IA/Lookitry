import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts — Protección de rutas en el Edge Runtime de Next.js
 *
 * Lee la cookie HTTP-Only `token` que el backend emite en login/register.
 * Si no existe, redirige a /login (para /dashboard) o a /admin/login (para /admin).
 *
 * NOTA: El Edge Runtime no puede ejecutar `jsonwebtoken` (Node.js puro),
 * por lo que solo se verifica la *presencia* de la cookie aquí.
 * La validación criptográfica completa ocurre en el backend al primer request autenticado.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const adminToken = request.cookies.get('adminToken')?.value;

  // ── Proteger rutas del dashboard de marca ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Bloquear iframes en rutas protegidas
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // ── Proteger rutas del panel de admin ─────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // El admin usa su propio token (localStorage del admin panel);
    // como fallback, también aceptamos el token de marca por si el admin
    // está logueado como marca. La validación real siempre la hace el backend.
    if (!adminToken && !token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
