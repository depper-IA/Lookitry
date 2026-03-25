import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts — Protección de rutas en el Edge Runtime de Next.js
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const token = request.cookies.get('token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const isDev = process.env.NODE_ENV === 'development';

  // ── Resolución de Dominios Personalizados ─────────────────────────────────────
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
          return NextResponse.rewrite(new URL(`/sitio/${slug}`, request.url));
        }
      }
    } catch (error) {
      console.error('[Middleware] Error resolviendo dominio:', error);
    }
  }

  // ── Modo Mantenimiento ──────────────────────────────────────────────────────
  const isMaintenancePage = pathname === '/mantenimiento';
  const isAdminPath = pathname.startsWith('/admin') || !!adminToken;

  if (!isMaintenancePage && !isAdminPath) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (!apiUrl) return NextResponse.next();
      const res = await fetch(`${apiUrl}/api/payment-settings/public`, {
        next: { revalidate: 60 }
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

  // ── Proteger rutas públicas del Widget (Iframe Whitelist Dinámica) ────────────
  if (pathname.startsWith('/embed') || pathname.startsWith('/pruebalo')) {
    const response = NextResponse.next();
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    
    let isAllowed = false;
    let originUrl = '';

    try {
      if (origin) {
        const url = new URL(origin);
        originUrl = url.origin;
        
        // Obtener lista blanca dinámica con caché de 60 segundos
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/pruebalo/allowed-origins`, {
            next: { revalidate: 60 }
          } as any);
          
          if (res.ok) {
            const { origins } = await res.json();
            isAllowed = origins.includes(originUrl);
          }
        }
      }
    } catch (e) {
      console.error('[Middleware] Error validando origen del iframe:', e);
    }

    // Limpiar siempre X-Frame-Options para que nuestro CSP no tenga conflictos
    response.headers.delete('X-Frame-Options');

    const baseCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src * data: blob: 'self'; connect-src 'self' https://api.lookitry.com https://vkdooutklowctuudjnkl.supabase.co; font-src 'self' https://fonts.gstatic.com; media-src 'self';";

    // ✅ FIX: Permitir siempre que el widget sea embebido (frame-ancestors *)
    // Esto resuelve el problema de "frame-ancestors 'self'" que bloqueaba el plugin de WordPress
    response.headers.set('Content-Security-Policy', `frame-ancestors *; ${baseCsp}`);

    // Configurar permisos de HW/SO con la sintaxis moderna
    response.headers.set('Permissions-Policy', 'camera=*, clipboard-write=*');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};
