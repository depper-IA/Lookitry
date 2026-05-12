import { NextResponse } from 'next/server';

// GET /api/payment-settings/public
// Proxy server-side al backend — evita CORS cuando el frontend llama desde el browser.
// En dev sin backend, devuelve un objeto vacío (fallback) sin romper la página.
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiUrl}/api/payment-settings/public`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      // Cachear en el servidor 5 minutos para no hammear el backend
      next: { revalidate: 300 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({}, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    // Backend no disponible (dev sin backend corriendo) — devuelve objeto vacío
    // para que los componentes no rompan
    return NextResponse.json({}, { status: 200 });
  }
}
