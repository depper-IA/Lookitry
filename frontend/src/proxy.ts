import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function normalizeOrigin(raw?: string | null): string | null {
  if (!raw) return null;

  try {
    const value = String(raw).trim();
    if (!value) return null;
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

/**
 * middleware.ts — Protección de rutas en el Edge Runtime de Next.js
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const token = request.cookies.get('token')?.value;
  const adminToken = request.cookies.get('admin_token')?.value;
  const allowDevBypass = process.env.ALLOW_DEV_AUTH_BYPASS === 'true';
  
  // ── Ignorar archivos estáticos y assets comunes ──────────────────────────────
  if (
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.includes('.') // Cualquier archivo con extensión
  ) {
    return NextResponse.next();
  }
  
  // ── Redirigir /pruebalo a /sitio ──────────────────────────────────────────
  if (pathname.startsWith('/pruebalo/')) {
    const slug = pathname.split('/pruebalo/')[1];
    if (slug) {
      return NextResponse.redirect(new URL(`/sitio/${slug}`, request.url), 301);
    }
  }


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

  // Solo verificar mantenimiento en producción — en desarrollo el backend puede no estar
  // corriendo y el fetch bloquea CADA request del middleware esperando el timeout TCP (~20-30s)
  const isProdEnv = process.env.NODE_ENV === 'production';

  if (isProdEnv && !isMaintenancePage && !isAdminPath) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (apiUrl) {
        // Timeout de 3s para no bloquear la navegación si el backend tarda
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        try {
          const res = await fetch(`${apiUrl}/api/payment-settings/public`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const settings = await res.json();
            if (settings.maintenanceMode) {
              return NextResponse.redirect(new URL('/mantenimiento', request.url));
            }
          }
        } catch {
          clearTimeout(timeoutId);
          // Timeout o error de red: continuar sin bloquear
        }
      }
    } catch (error) {
      console.error('[Middleware] Error verificando mantenimiento:', error);
    }
  }

  // ── Proteger rutas del dashboard de marca ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!token && !allowDevBypass) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // ── Proteger /trial-checkout: si ya tiene trial activo o plan pago, redirigir ──
  if (pathname.startsWith('/trial-checkout')) {
    if (token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        if (apiUrl) {
          const res = await fetch(`${apiUrl}/api/brands/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const { data: brand } = await res.json();
            if (brand) {
              const isTrialActive =
                brand.plan === 'TRIAL' &&
                brand.trial_end_date &&
                new Date(brand.trial_end_date) > new Date() &&
                brand.subscription_status !== 'suspended';

              const hasPaidPlan =
                brand.subscription_status === 'active' ||
                brand.subscription_status === 'expiring_soon';

              if (isTrialActive || hasPaidPlan) {
                return NextResponse.redirect(new URL('/dashboard/subscription', request.url));
              }
            }
          }
        }
      } catch (error) {
        console.error('[Middleware] Error verificando trial-checkout:', error);
      }
    }
  }

  // ── Proteger rutas del panel de admin ─────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminToken && !token && !allowDevBypass) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // ── Proteger rutas públicas del Widget (Iframe Whitelist Dinámica) ────────────
  if (
    pathname.startsWith('/embed') || 
    pathname.startsWith('/pruebalo') || 
    pathname.startsWith('/sitio') || 
    pathname.startsWith('/marca')
  ) {
    const response = NextResponse.next();
    let allowedOrigins: string[] = [];

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (apiUrl) {
        const res = await fetch(`${apiUrl}/api/pruebalo/allowed-origins`, {
          next: { revalidate: 60 }
        } as any);

        if (res.ok) {
          const payload = await res.json();
          allowedOrigins = Array.isArray(payload.origins) ? payload.origins : [];
        }
      }
    } catch (e) {
      console.error('[Middleware] Error validando origen del iframe:', e);
    }

    const requestDerivedOrigins = [
      normalizeOrigin(request.headers.get('origin')),
      normalizeOrigin(request.headers.get('referer')),
    ].filter((origin): origin is string => Boolean(origin));

    // Limpiar siempre X-Frame-Options para que nuestro CSP no tenga conflictos
    response.headers.delete('X-Frame-Options');

    const isProd = process.env.NODE_ENV === 'production';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isProd ? [] : ["'unsafe-eval'"]),
      "https://challenges.cloudflare.com",
      "https://checkout.wompi.co",
      "https://accounts.google.com",
      "https://www.google.com",
      "https://apis.google.com",
      "https://www.googletagmanager.com"
    ].join(' ');
    
    const baseCsp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.minio.wilkiedevs.com https://wilkiedevs.com https://*.wilkiedevs.com https://*.lookitry.com https://images.unsplash.com https://*.unsplash.com https://*.cloudflare.com https://*.woocommerce.com https://*.shopify.com https://*.myshopify.com https://www.googletagmanager.com",
      `connect-src 'self' http://localhost:3001 http://100.85.125.102:3001 https://api.lookitry.com https://vkdooutklowctuudjnkl.supabase.co https://checkout.wompi.co https://accounts.google.com https://www.googleapis.com https://www.google.com https://challenges.cloudflare.com https://minio.wilkiedevs.com https://freeipapi.com https://freeipapi.com/api/json/ https://ipapi.com https://ipapi.com/api/json/ https://ipapi.co https://ipapi.co/api/json/`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://challenges.cloudflare.com https://js.wompi.co https://checkout.wompi.co https://accounts.google.com https://www.google.com https://*.wordpress.com https://*.wixsite.com https://*.shopify.com",
      "media-src 'self'"
    ].join('; ');

    const frameAncestors = ["'self'", ...allowedOrigins, ...requestDerivedOrigins]
      .filter((origin, index, array) => array.indexOf(origin) === index)
      .filter(Boolean)
      .join(' ');

    response.headers.set('Content-Security-Policy', `frame-ancestors ${frameAncestors}; ${baseCsp}`);

    // Configurar permisos de HW/SO con la sintaxis moderna — restringidos a self
    response.headers.set('Permissions-Policy', "camera=(self), clipboard-write=(self)");

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
     * - robots.txt, sitemap.xml
     * - icons or common images
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico).*)',
  ],
};
