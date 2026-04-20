import { FALLBACK_PRICES, FALLBACK_GENERATIONS, DEFAULT_PRICING } from '@/config/pricing';

export interface DynamicPricing {
  prices: typeof FALLBACK_PRICES;
  generations: typeof FALLBACK_GENERATIONS;
  loaded: boolean;
  error: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch');
}

export async function fetchDynamicPricing(): Promise<DynamicPricing> {
  const fallback: DynamicPricing = {
    prices: { ...FALLBACK_PRICES },
    generations: { ...FALLBACK_GENERATIONS },
    loaded: false,
    error: true,
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

  try {
    // Use backend endpoint to avoid broken anon key
    const response = await fetch(`${apiUrl}/api/pricing-config`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn('[fetchDynamicPricing] Backend returned HTTP', response.status);
      return fallback;
    }

    const result = await response.json();
    const data = result?.data || [];

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[fetchDynamicPricing] No pricing data found, using fallbacks');
      return fallback;
    }

    const prices = { ...FALLBACK_PRICES };
    const gens = { ...FALLBACK_GENERATIONS };

    data.forEach((row: any) => {
      if (row.id === 'basic') {
        prices.BASIC = row.data?.precio_mensual_cop ?? FALLBACK_PRICES.BASIC;
        if (row.data?.generaciones_mensuales || row.data?.generaciones_mes) {
          gens.BASIC = row.data.generaciones_mensuales || row.data.generaciones_mes;
        }
      }
      if (row.id === 'pro') {
        prices.PRO = row.data?.precio_mensual_cop ?? FALLBACK_PRICES.PRO;
        if (row.data?.generaciones_mensuales || row.data?.generaciones_mes) {
          gens.PRO = row.data.generaciones_mensuales || row.data.generaciones_mes;
        }
      }
      if (row.id === 'trial') {
        prices.TRIAL = row.data?.precio_mensual_cop || row.data?.precio_cop ?? FALLBACK_PRICES.TRIAL;
      }
    });

    return { prices, generations: gens, loaded: true, error: false };
  } catch (error) {
    console.error('[fetchDynamicPricing] Error fetching dynamic pricing:', error);
    return fallback;
  }
}

export { DEFAULT_PRICING, FALLBACK_PRICES, FALLBACK_GENERATIONS };