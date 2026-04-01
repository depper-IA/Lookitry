'use client';

export interface PublicPlanPrices {
  BASIC: number;
  PRO: number;
}

export interface PublicPaymentSettings {
  manualWhatsapp?: string;
  manualEmail?: string;
  manualInstructions?: string;
  socialInstagram?: string;
  socialTiktok?: string;
  socialFacebook?: string;
  socialYoutube?: string;
}

export const DEFAULT_PUBLIC_PAYMENT_SETTINGS: Required<PublicPaymentSettings> = {
  manualWhatsapp: '573105436281',
  manualEmail: 'info@lookitry.com',
  manualInstructions: '',
  socialInstagram: '@looki.try',
  socialTiktok: '@lookitry',
  socialFacebook: '',
  socialYoutube: '',
};

const PLAN_PRICE_FALLBACK: PublicPlanPrices = {
  BASIC: 180000,
  PRO: 350000,
};

let cachedPlanPrices: PublicPlanPrices | null = null;
let planPricesPromise: Promise<PublicPlanPrices> | null = null;

export async function fetchPublicPlanPrices(): Promise<PublicPlanPrices> {
  if (cachedPlanPrices) return cachedPlanPrices;
  if (planPricesPromise) return planPricesPromise;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return PLAN_PRICE_FALLBACK;

  planPricesPromise = (async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/pricing_config?id=in.(basic,pro)&select=id,data`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) return PLAN_PRICE_FALLBACK;

      const rows = await response.json();
      if (!Array.isArray(rows)) return PLAN_PRICE_FALLBACK;

      const prices = { ...PLAN_PRICE_FALLBACK };

      for (const row of rows) {
        if (row?.id === 'basic' && row?.data?.precio_mensual_cop) {
          prices.BASIC = Number(row.data.precio_mensual_cop);
        }
        if (row?.id === 'pro' && row?.data?.precio_mensual_cop) {
          prices.PRO = Number(row.data.precio_mensual_cop);
        }
      }

      cachedPlanPrices = prices;
      return prices;
    } catch {
      return PLAN_PRICE_FALLBACK;
    } finally {
      planPricesPromise = null;
    }
  })();

  return planPricesPromise;
}

let cachedPaymentSettings: PublicPaymentSettings | null = null;
let paymentSettingsPromise: Promise<PublicPaymentSettings | null> | null = null;

export async function fetchPublicPaymentSettings(): Promise<PublicPaymentSettings | null> {
  if (cachedPaymentSettings) return cachedPaymentSettings;
  if (paymentSettingsPromise) return paymentSettingsPromise;

  paymentSettingsPromise = (async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const response = await fetch(`${apiUrl}/api/payment-settings/public`);
      if (!response.ok) return DEFAULT_PUBLIC_PAYMENT_SETTINGS;
      const data = await response.json();
      cachedPaymentSettings = {
        ...DEFAULT_PUBLIC_PAYMENT_SETTINGS,
        ...data,
      };
      return cachedPaymentSettings;
    } catch {
      return DEFAULT_PUBLIC_PAYMENT_SETTINGS;
    } finally {
      paymentSettingsPromise = null;
    }
  })();

  return paymentSettingsPromise;
}

export function toWhatsAppUrl(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;

  const normalized = rawPhone.replace(/[^\d]/g, '');
  if (!normalized) return null;

  return `https://wa.me/${normalized}`;
}

export function formatWhatsAppDisplay(rawPhone?: string | null): string {
  const normalized = rawPhone?.replace(/[^\d]/g, '') || DEFAULT_PUBLIC_PAYMENT_SETTINGS.manualWhatsapp;
  if (normalized.length === 12 && normalized.startsWith('57')) {
    return `+57 ${normalized.slice(2, 5)} ${normalized.slice(5, 8)} ${normalized.slice(8)}`;
  }
  return rawPhone || `+57 310 543 6281`;
}

export function normalizeSocialUrl(platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube', rawValue?: string | null): string | null {
  const fallbackMap = {
    instagram: DEFAULT_PUBLIC_PAYMENT_SETTINGS.socialInstagram,
    tiktok: DEFAULT_PUBLIC_PAYMENT_SETTINGS.socialTiktok,
    facebook: DEFAULT_PUBLIC_PAYMENT_SETTINGS.socialFacebook,
    youtube: DEFAULT_PUBLIC_PAYMENT_SETTINGS.socialYoutube,
  };

  const value = (rawValue ?? fallbackMap[platform] ?? '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const sanitized = value.replace(/^@/, '').trim();

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${sanitized}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${sanitized}`;
    case 'facebook':
      return `https://facebook.com/${sanitized}`;
    case 'youtube':
      return sanitized.startsWith('channel/') || sanitized.startsWith('@')
        ? `https://youtube.com/${sanitized}`
        : `https://youtube.com/@${sanitized}`;
    default:
      return value;
  }
}
