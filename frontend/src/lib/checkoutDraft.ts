'use client';

export type CheckoutStep = 1 | 2 | 3 | 4;
export type CheckoutCurrency = 'COP' | 'USD';
export type CheckoutPaymentMethod = 'wompi' | 'paypal';

export interface CheckoutDraft {
  plan?: string;
  months?: number;
  includesLanding?: boolean;
  email?: string;
  brandName?: string;
  paymentMethod?: CheckoutPaymentMethod;
  currency?: CheckoutCurrency;
  trm?: number;
}

export function loadCheckoutDraft(key: string): CheckoutDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function saveCheckoutDraft(key: string, draft: CheckoutDraft): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // noop
  }
}

export function clearCheckoutDraft(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // noop
  }
}
