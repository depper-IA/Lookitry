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
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const token = request.cookies.get('token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const isDev = process.env.NODE_ENV === 'development';

  // ── Resolución de Dominios Personalizados ─────────────────────────────────────
  // Solo si no estamos en una ruta de sistema (dashboard, admin, login, etc)
  // y el host no es el dominio base.
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
  const isBaseDomain = host === baseDomain || host.includes('localhost') || host.endsWith('.vercel.app');

  if (!isBaseDomain && !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin') && pathname === '/') {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (!apiUrl) return NextResponse.next();
      const res = await fetch(`${apiUrl}/api/pruebalo/resolve-domain?host=${host}`);
      if (res.ok) {
        const { slug } = await res.json();
        if (slug) {
          // Rewrite interno a la mini-landing de la marca
          return NextResponse.rewrite(new URL(`/sitio/${slug}`, request.url));
        }
      }
    } catch (error) {
      console.error('[Middleware] Error resolviendo dominio:', error);
    }
  }

  // ── Modo Mantenimiento ──────────────────────────────────────────────────────
  // Solo verificar si no estamos en una ruta exceptuada (ya filtradas por matcher)
  // y si no estamos ya en la página de mantenimiento o en el panel admin.
  const isMaintenancePage = pathname === '/mantenimiento';
  const isAdminPath = pathname.startsWith('/admin') || !!adminToken;

  if (!isMaintenancePage && !isAdminPath) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (!apiUrl) return NextResponse.next();
      // Cachear internamente en el edge si es posible o simplemente fetch
      const res = await fetch(`${apiUrl}/api/payment-settings/public`, {
        next: { revalidate: 60 } // Intentar revalidar cada minuto si el runtime lo soporta
      } as any);
      
      if (res.ok) {
        const settings = await res.json();
        if (settings.maintenanceMode) {
          return NextResponse.redirect(new URL('/mantenimiento', request.url));
        }
      }
    } catch (error) {
      console.error('[Middleware] Error verificando mantenimiento:', error);
    }
  }

  // ── Proteger rutas del dashboard de marca ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!token && !isDev) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // ── Proteger rutas del panel de admin ─────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminToken && !token && !isDev) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.svg, etc (root assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};
