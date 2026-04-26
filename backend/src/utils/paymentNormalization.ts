import { pricingService } from '../services/pricing.service';

import { supabaseAdmin } from '../config/supabase';



const FALLBACK_TRM = 4000;



function sanitizeAmount(raw: unknown): number {

  if (typeof raw === 'number') {

    return Number.isFinite(raw) ? raw : 0;

  }



  if (typeof raw === 'string') {

    const normalized = raw.replace(/,/g, '').trim();

    const parsed = Number.parseFloat(normalized);

    return Number.isFinite(parsed) ? parsed : 0;

  }



  return 0;

}



export function normalizeCurrency(rawCurrency: unknown): string {

  const value = String(rawCurrency || 'COP').trim().toUpperCase();

  return value || 'COP';

}



export async function getReportingTrm(): Promise<number> {

  try {

    const { trm } = await pricingService.getEffectiveTrm();

    return trm > 0 ? trm : FALLBACK_TRM;

  } catch (error) {

    console.error('[paymentNormalization] No se pudo obtener TRM efectiva:', error);

    return FALLBACK_TRM;

  }

}



export function convertPaymentToCop(

  amount: unknown,

  currency: unknown,

  trm: number,

): {

  originalAmount: number;

  currency: string;

  amountCop: number;

  exchangeRateUsed: number | null;

} {

  const originalAmount = sanitizeAmount(amount);

  const normalizedCurrency = normalizeCurrency(currency);



  if (normalizedCurrency === 'USD') {

    const safeTrm = trm > 0 ? trm : FALLBACK_TRM;

    return {

      originalAmount,

      currency: normalizedCurrency,

      amountCop: Math.round(originalAmount * safeTrm),

      exchangeRateUsed: safeTrm,

    };

  }



  return {

    originalAmount,

    currency: normalizedCurrency,

    amountCop: Math.round(originalAmount),

    exchangeRateUsed: normalizedCurrency === 'COP' ? 1 : null,

  };

}



function extractReferenceFromNotes(notes: unknown): string | null {

  if (typeof notes !== 'string') return null;



  const patterns = [

    /Ref[:=]\s*([A-Za-z0-9_-]+)/i,

    /reference[:=]\s*([A-Za-z0-9_-]+)/i,

    /PAYPAL-[A-Za-z0-9_-]+/i,

    /TRIAL-[A-Za-z0-9_-]+/i,

    /GUEST-TRIAL-[A-Za-z0-9_-]+/i,

  ];



  for (const pattern of patterns) {

    const match = notes.match(pattern);

    if (match?.[1]) return match[1];

    if (match?.[0]) return match[0];

  }



  return null;

}



export function extractPaymentReference(payment: {

  reference?: unknown;

  notes?: unknown;

}): string | null {

  if (typeof payment.reference === 'string' && payment.reference.trim()) {

    return payment.reference.trim();

  }



  return extractReferenceFromNotes(payment.notes);

}



export async function getHistoricalTrmForReference(reference: string): Promise<number | null> {

  const { data, error } = await supabaseAdmin

    .from('paypal_orders')

    .select('trm')

    .eq('reference', reference)

    .maybeSingle();



  if (error) {

    console.error(`[paymentNormalization] No se pudo consultar TRM histórica para ${reference}:`, error);

    return null;

  }



  const trm = Number(data?.trm || 0);

  return trm > 0 ? trm : null;

}



export async function normalizePaymentRecordToCop(

  payment: {

    amount?: unknown;

    currency?: unknown;

    reference?: unknown;

    notes?: unknown;

  },

  fallbackTrm: number,

  trmCache?: Map<string, number | null>,

): Promise<{

  originalAmount: number;

  currency: string;

  amountCop: number;

  exchangeRateUsed: number | null;

  referenceUsed: string | null;

}> {

  const reference = extractPaymentReference(payment);

  let trmToUse = fallbackTrm;



  if (normalizeCurrency(payment.currency) === 'USD' && reference) {

    const cached = trmCache?.get(reference);

    const historicalTrm = cached !== undefined

      ? cached

      : await getHistoricalTrmForReference(reference);



    if (trmCache && cached === undefined) {

      trmCache.set(reference, historicalTrm);

    }



    if (historicalTrm && historicalTrm > 0) {

      trmToUse = historicalTrm;

    }

  }



  const normalized = convertPaymentToCop(payment.amount, payment.currency, trmToUse);

  return {

    ...normalized,

    referenceUsed: reference,

  };

}

