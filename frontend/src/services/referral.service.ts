const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

export interface ReferralData {
  referralCode: string;
  rewardCredits: number;
  referredRewardCredits: number;
  referralCount: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  hasReferredCode: boolean;
  referredCodeStatus: string | null;
  referrerName: string | null;
  recentReferrals: Array<{
    id: string;
    referred_brand_id: string;
    referredName: string | null;
    status: string;
    created_at: string;
    converted_at?: string | null;
  }>;
}

export interface ClaimResult {
  success: boolean;
  message: string;
  referralId?: string;
}

/**
 * Normaliza la URL para evitar duplicación de /api
 */
function getFullUrl(path: string): string {
  const base = (API_URL || '').replace(/\/api$/, '');
  const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
  return `${base}${cleanPath}`;
}

/**
 * apiFetch — wrapper de fetch que siempre envía cookies (credentials: 'include').
 * Esto es necesario para que el backend reciba/envíe la cookie HTTP-Only del JWT.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const fullUrl = getFullUrl(path);

  const res = await fetch(fullUrl, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });

  let data: any = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = { message: await res.text().catch(() => 'Error de respuesta del servidor') };
  }

  if (!res.ok) throw { response: { data, status: res.status }, message: data.message };
  return data as T;
}

class ReferralService {
  /**
   * Obtiene toda la información de referido del usuario autenticado.
   * Incluye código, estadísticas y referidos recientes.
   */
  async getReferralInfo(): Promise<ReferralData> {
    return apiFetch<ReferralData>('/brands/me/referral');
  }

  /**
   * Valida un código de referido sin reclamarlo.
   * Útil para mostrar feedback antes de aplicar.
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; referrerName: string }> {
    return apiFetch<{ valid: boolean; referrerName: string }>('/brands/me/referral/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  /**
   * Reclama un código de referido para el usuario autenticado.
   * Una vez reclamado, el sistema lo asocia y acredita al referido cuando convierta.
   */
  async claimReferralCode(code: string): Promise<ClaimResult> {
    return apiFetch<ClaimResult>('/brands/me/referral/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }
}

export const referralService = new ReferralService();
