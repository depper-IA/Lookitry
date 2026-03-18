/**
 * API route: GET /api/pricing/trm
 * Obtiene la TRM oficial (COP/USD) desde la Superintendencia Financiera de Colombia.
 * Fuente: datos.gov.co — API pública del gobierno, sin key, sin costo.
 * Caché de 24h en el servidor (Next.js fetch cache).
 */
import { NextResponse } from 'next/server';

const SUPERFINANCIERA_URL =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde DESC';

interface SuperfinRow {
  valor: string;
  unidad: string;
  vigenciadesde: string;
  vigenciahasta: string;
}

export async function GET() {
  try {
    const res = await fetch(SUPERFINANCIERA_URL, {
      headers: {
        Accept: 'application/json',
        'X-App-Token': '', // sin token: límite generoso para uso interno
      },
      next: { revalidate: 86400 }, // caché 24 horas
    });

    if (!res.ok) throw new Error(`Superfinanciera HTTP ${res.status}`);

    const rows: SuperfinRow[] = await res.json();
    if (!rows.length) throw new Error('Sin datos de TRM');

    const row = rows[0];
    const trm = parseFloat(row.valor);
    if (isNaN(trm) || trm < 1000) throw new Error(`TRM inválida: ${row.valor}`);

    return NextResponse.json({
      ok: true,
      trm,
      fecha: row.vigenciadesde?.split('T')[0] ?? null,
      fuente: 'Superintendencia Financiera de Colombia',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[TRM] Error obteniendo TRM:', msg);
    // Fallback: retornar valor de referencia para no romper el panel
    return NextResponse.json(
      { ok: false, error: msg, trm: 3700, fallback: true },
      { status: 200 } // 200 para que el cliente siempre tenga un valor usable
    );
  }
}
