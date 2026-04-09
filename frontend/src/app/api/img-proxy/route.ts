import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de imágenes universal para evitar bloqueos CORS/referrer de WordPress y otros proveedores.
 * Uso: /api/img-proxy?url=https://...
 */

// Dominios permitidos para el proxy (allowlist)
const ALLOWED_HOSTS = [
  'wordpress.com',
  'wp.com',
  'wix.com',
  'wixstatic.com',
  'shopify.com',
  'cdn.shopify.com',
  'myshopify.com',
  'cloudinary.com',
  'res.cloudinary.com',
  'imgur.com',
  'i.imgur.com',
  'amazonaws.com',
  's3.amazonaws.com',
  'storage.googleapis.com',
  'firebaseapp.com',
  'firebasestorage.googleapis.com',
  'facebook.com',
  'fbcdn.net',
  'instagram.com',
  'twimg.com',
  'twitter.com',
  'x.com',
  'pinterest.com',
  'pinimg.com',
  'tiktok.com',
  'bytegoofs.com',
  'wilkiedevs.com',
  'minio.wilkiedevs.com',
  'vkdooutklowctuudjnkl.supabase.co',
  'supabase.co',
];

// Cache persistente en memoria para dominios dinámicos (10 min TTL)
const authorizedDomainsCache = new Map<string, { authorized: boolean; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Verifica si un host está autorizado, ya sea por la lista estática o dinámicamente en la DB.
 */
async function isDomainAuthorized(hostname: string): Promise<boolean> {
  const now = Date.now();
  
  // 1. Verificar caché
  const cached = authorizedDomainsCache.get(hostname);
  if (cached && cached.expires > now) {
    return cached.authorized;
  }

  // 2. Verificar lista estática (Fast track)
  const isStaticallyAllowed = ALLOWED_HOSTS.some(allowed => 
    hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
  if (isStaticallyAllowed) {
    authorizedDomainsCache.set(hostname, { authorized: true, expires: now + CACHE_TTL });
    return true;
  }

  // 3. Consulta dinámica a Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Usamos SERVICE_KEY si está disponible para saltar RLS, si no ANON_KEY
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Img Proxy] Credenciales de Supabase no encontradas para validación dinámica');
      return false;
    }

    // Buscamos en la tabla 'brands' cualquier registro que coincida con el hostname solicitado.
    // Revisamos: website, custom_domain, y campos dentro de social_links (jsonb).
    const query = new URL(`${supabaseUrl}/rest/v1/brands`);
    query.searchParams.set('select', 'id');
    
    // Construimos el filtro OR buscando el hostname en múltiples campos
    // Se incluyen variantes con/sin protocolo para mayor robustez
    const conditions = [
      `website.ilike.*${hostname}*`,
      `custom_domain.eq.${hostname}`,
      `social_links->>website.ilike.*${hostname}*`,
      `social_links->>woo_plugin_store_domain.eq.${hostname}`,
      `social_links->>allowed_origins.ilike.*${hostname}*`
    ];
    query.searchParams.set('or', `(${conditions.join(',')})`);

    const res = await fetch(query.toString(), {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      // @ts-ignore - signal: AbortSignal.timeout is stable in modern Node
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[Img Proxy] Supabase query falló: ${res.status}`);
      return false;
    }

    const data = await res.json();
    const authorized = Array.isArray(data) && data.length > 0;

    // Guardar en caché el resultado (tanto positivos como negativos para evitar DDOS al proxy)
    authorizedDomainsCache.set(hostname, { authorized, expires: now + CACHE_TTL });
    
    if (authorized) {
      console.log(`[Img Proxy] Dominio autorizado dinámicamente via DB: ${hostname}`);
    } else {
      console.warn(`[Img Proxy] Intento de acceso desde dominio no autorizado: ${hostname}`);
    }

    return authorized;
  } catch (err: any) {
    console.error(`[Img Proxy] Error en validación dinámica para ${hostname}:`, err.message);
    return false;
  }
}

// Rangos de IP privados/internos que deben ser bloqueados (prevención SSRF)
function isPrivateOrInternalIP(ip: string): boolean {
  // IPv4 loopback
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;
  // IPv6 loopback
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  // Private ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const secondOctet = parseInt(ip.split('.')[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  // Link-local
  if (ip.startsWith('169.254.')) return true;
  // AWS metadata
  if (ip === '169.254.169.254') return true;
  // localhost variants
  if (ip === 'localhost' || ip === '0.0.0.0') return true;
  return false;
}

async function resolveAndCheckIP(url: URL): Promise<{ ip: string; safe: boolean }> {
  try {
    const dns = await import('dns').then(m => m.promises);
    const addresses = await dns.resolve4(url.hostname);
    const ip = addresses[0];
    return { ip, safe: !isPrivateOrInternalIP(ip) };
  } catch {
    // Si no se puede resolver DNS, verificar si el hostname es claramente interno
    if (isPrivateOrInternalIP(url.hostname)) {
      return { ip: url.hostname, safe: false };
    }
    // Si no se puede resolver, permitir (asumir que el hostname es público)
    return { ip: url.hostname, safe: true };
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new NextResponse('Invalid URL protocol', { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Verificar que el hostname esté autorizado (estático o dinámico)
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAuthorized = await isDomainAuthorized(hostname);

  if (!isAuthorized) {
    return new NextResponse('Dominio no permitido. Registra tu sitio en el perfil de Lookitry.', { status: 403 });
  }

  // Verificar que no apunte a IPs internas (prevención SSRF)
  const { safe } = await resolveAndCheckIP(parsedUrl);
  if (!safe) {
    console.warn(`[Img Proxy] Intento de acceso a IP interna bloqueado: ${parsedUrl.hostname}`);
    return new NextResponse('Acceso denegado', { status: 403 });
  }

  // Lista de User-Agents para evadir bloqueos de seguridad
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': ua,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'es,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
        // @ts-ignore — Node fetch signal timeout
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        console.warn(`[Img Proxy] Falló con UA: ${res.status}`);
        continue;
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      
      // Validar que realmente sea una imagen
      if (!contentType.startsWith('image/')) {
        console.warn(`[Img Proxy] URL no retornó imagen: ${contentType}`);
        break; 
      }

      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
          'Access-Control-Allow-Origin': '*',
          'X-Proxy-Origin': parsedUrl.hostname,
        },
      });
    } catch (err: any) {
      console.warn(`[Img Proxy] Error:`, err.message);
      continue;
    }
  }

  // Todos los intentos fallaron
  console.log(`[Img Proxy] Fallback final: Redirect a ${parsedUrl.toString()}`);
  return NextResponse.redirect(parsedUrl.toString(), { status: 302 });
}
