/**
 * Capa de datos para configuración dinámica de precios.
 * Lee desde Supabase pricing_config con ISR (revalidate en el Server Component que la llame).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PlanConfig {
  precio_mensual_cop: number;
  precio_original_cop?: number;
  descuento_porcentaje?: number;
  productos_max: number;
  generaciones_mensuales: number;
  subtitulo: string;
  boton_texto: string;
  boton_texto_sin_trial?: string;
  features: string[];
  features_excluidas?: string[];
}

export interface MiniLandingConfig {
  precio_unico_cop: number;
  precio_original_cop: number;
  descuento_porcentaje: number;
  subtitulo: string;
  boton_texto: string;
  features: string[];
}

export interface MetaConfig {
  /** Gastos personales/de vida mensuales (alquiler, comida, servicios, etc.) */
  gastos_personales_cop: number;
  /** Meta de ingreso bruto mensual del negocio (lo que quieres facturar en total) */
  meta_ingreso_cop: number;
  trm_referencia: number;
  trm_auto: boolean;
}

export interface CostsConfig {
  costo_vps_cop: number;
  costo_dominio_cop_mensual: number;
  costo_openrouter_por_gen_cop: number;
  notas?: string;
}

export interface DescuentosDuracionConfig {
  meses_1: number;
  meses_3: number;
  meses_6: number;
  meses_12: number;
}

export interface PricingConfig {
  basic: PlanConfig;
  pro: PlanConfig;
  mini_landing: MiniLandingConfig;
  meta: MetaConfig;
  costs: CostsConfig;
  descuentos_duracion: DescuentosDuracionConfig;
}

// ── Defaults (fallback si Supabase falla) ─────────────────────────────────────

const DEFAULTS: PricingConfig = {
  basic: {
    precio_mensual_cop: 150000,
    productos_max: 5,
    generaciones_mensuales: 400,
    subtitulo: 'Para marcas pequeñas en Instagram y WhatsApp',
    boton_texto: 'Empezar gratis — 7 días',
    boton_texto_sin_trial: 'Contratar Básico',
    features: [
      '5 productos en el probador',
      '400 generaciones por mes',
      'Logo y colores de marca',
      'Template Bare (widget limpio)',
      'Widget embebible (iframe)',
      'Analytics de uso',
    ],
    features_excluidas: [
      'Templates Minimal, Modern y Bold',
      'Texto del botón personalizado',
      'Mensaje de bienvenida en widget',
      'Modificación del slug del probador',
      'Integración con sistemas externos',
      'Soporte prioritario',
    ],
  },
  pro: {
    precio_mensual_cop: 250000,
    productos_max: 15,
    generaciones_mensuales: 1200,
    subtitulo: 'Para tiendas online con mayor volumen',
    boton_texto: 'Contratar Pro',
    features: [
      '15 productos en el probador',
      '1.200 generaciones por mes',
      'Logo y colores de marca',
      'Template Bare (widget limpio)',
      'Widget embebible (iframe)',
      'Analytics de uso',
      'Templates Minimal, Modern y Bold',
      'Texto del botón personalizado',
      'Mensaje de bienvenida en widget',
      'Modificación del slug del probador',
      'Integración con sistemas externos',
      'Soporte prioritario',
    ],
    features_excluidas: [],
  },
  mini_landing: {
    precio_unico_cop: 650000,
    precio_original_cop: 850000,
    descuento_porcentaje: 23,
    subtitulo: 'Tu página de venta lista en horas',
    boton_texto: 'Quiero mi mini-landing',
    features: [
      'Página pública activa',
      'Probador IA integrado',
      '3 templates a elegir',
      'WhatsApp flotante',
      'Dominio personalizable',
      'Entrega en 48 horas',
    ],
  },
  meta: {
    gastos_personales_cop: 1400000,
    meta_ingreso_cop: 2000000,
    trm_referencia: 3700,
    trm_auto: true,
  },
  costs: {
    costo_vps_cop: 37000,
    costo_dominio_cop_mensual: 5000,
    costo_openrouter_por_gen_cop: 25,
  },
  descuentos_duracion: {
    meses_1: 0,
    meses_3: 5,
    meses_6: 10,
    meses_12: 15,
  },
};

// ── Price Override (promoción temporal por plan) ──────────────────────────────

export interface PlanPriceOverride {
  plan: 'BASIC' | 'PRO';
  override_price: number;       // precio especial
  original_price: number;       // precio tachado
  ends_at?: string;             // ISO — cuándo expira
  label?: string;               // ej: "Oferta de lanzamiento"
}

// ── Fetch principal ───────────────────────────────────────────────────────────

/**
 * Obtiene la configuración completa de precios desde Supabase.
 * Usar en Server Components con revalidate corto.
 * Incluye fallback a DEFAULTS si la consulta falla.
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    // 1. Obtener configuración base y promociones en paralelo
    const [configRes, promosRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 300, tags: ['pricing'] },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/promotions?active=eq.true&select=type,config`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        next: { revalidate: 300, tags: ['pricing'] },
      })
    ]);

    if (!configRes.ok) throw new Error(`Supabase error: ${configRes.status}`);

    const rows: { id: string; data: Record<string, unknown> }[] = await configRes.json();
    const promos: { type: string; config: any }[] = promosRes.ok ? await promosRes.json() : [];

    const config = { ...DEFAULTS };
    for (const row of rows) {
      if (row.id in config) {
        (config as Record<string, unknown>)[row.id] = row.data;
      }
    }

    // 2. Aplicar descuentos de promociones globales (launch_offer, modal_timer) si existen
    const globalDiscountPct = promos.reduce((max, p) => {
      if (['launch_offer', 'modal_timer'].includes(p.type) && p.config?.discount_pct) {
        return Math.max(max, Number(p.config.discount_pct));
      }
      return max;
    }, 0);

    if (globalDiscountPct > 0) {
      const factor = 1 - globalDiscountPct / 100;
      config.basic.precio_mensual_cop = Math.ceil(config.basic.precio_mensual_cop * factor);
      config.pro.precio_mensual_cop = Math.ceil(config.pro.precio_mensual_cop * factor);
      // Opcional: podrías aplicar también a mini_landing si lo deseas
    }

    return config;
  } catch (err) {
    console.error('[pricing] Error cargando config, usando defaults:', err);
    return DEFAULTS;
  }
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

/** Precio mensual con descuento por duración aplicado */
export function precioConDescuento(
  precioBase: number,
  meses: number,
  descuentos: DescuentosDuracionConfig
): number {
  const pct =
    meses === 12 ? descuentos.meses_12 :
    meses === 6  ? descuentos.meses_6  :
    meses === 3  ? descuentos.meses_3  :
    descuentos.meses_1;
  return Math.ceil(precioBase * (1 - pct / 100));
}

/** Cuántos clientes de un plan se necesitan para cubrir la meta */
export function clientesParaMeta(metaCop: number, precioPlan: number): number {
  return Math.ceil(metaCop / precioPlan);
}

/** Margen estimado por cliente (precio - costo IA - fracción costos fijos) */
export function margenPorCliente(
  precioPlan: number,
  generacionesPlan: number,
  costoGenCop: number,
  costosFijosMensuales: number,
  clientesEstimados: number
): number {
  const costoIA = generacionesPlan * costoGenCop;
  const costoFijoProrrateado = clientesEstimados > 0 ? costosFijosMensuales / clientesEstimados : 0;
  return precioPlan - costoIA - costoFijoProrrateado;
}

/** Precio en USD usando TRM */
export function precioEnUSD(precioCop: number, trm: number): number {
  return Math.ceil(precioCop / trm);
}

/**
 * Obtiene overrides de precio activos desde la tabla promotions.
 * Usar en Server Components con revalidate corto (ej: 300s).
 */
export async function getPriceOverrides(): Promise<PlanPriceOverride[]> {
  try {
    const now = new Date().toISOString();
    const url =
      `${SUPABASE_URL}/rest/v1/promotions` +
      `?type=eq.plan_override` +
      `&active=eq.true` +
      `&or=(starts_at.is.null,starts_at.lte.${now})` +
      `&or=(ends_at.is.null,ends_at.gte.${now})` +
      `&select=config,ends_at`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const rows: { config: PlanPriceOverride; ends_at?: string }[] = await res.json();
    return rows.map(r => ({ ...r.config, ends_at: r.config.ends_at ?? r.ends_at }));
  } catch {
    return [];
  }
}
