import { supabaseAdmin } from '../config/supabase';
import { GOOGLE_CONFIG } from '../config/google';
import { generateToken } from '../utils/jwt';
import { recordTrialEvent } from '../utils/brandLifecycle';

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthResult {
  token: string;
  brand: any;
  needsOnboarding: boolean;
  isNewBrand: boolean;
  accountLinked: boolean;
}

/**
 * Verifica un access token de Google consultando userinfo desde el backend.
 * Evita confiar en email/googleId enviados por el cliente.
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    console.error('[GoogleAuth] Error verifying access token:', response.status, response.statusText, errorText);
    throw new Error('GOOGLE_ACCESS_TOKEN_INVALID');
  }

  const data = await response.json() as Record<string, any>;

  if (!data.sub || !data.email) {
    throw new Error('GOOGLE_NO_EMAIL');
  }

  return {
    sub: data.sub,
    email: String(data.email).toLowerCase(),
    email_verified: data.email_verified === true || data.email_verified === 'true',
    name: data.name || String(data.email).split('@')[0],
    picture: data.picture,
    given_name: data.given_name,
    family_name: data.family_name,
  };
}

/**
 * Verifica el JWT de Google con la API de Google
 */
export async function verifyGoogleToken(token: string): Promise<GoogleTokenPayload> {
  const response = await fetch(
    `${GOOGLE_CONFIG.tokenInfoUrl}?id_token=${encodeURIComponent(token)}`
  );

  if (!response.ok) {
    throw new Error('GOOGLE_TOKEN_INVALID');
  }

  const data = await response.json() as Record<string, any>;

  if (data.aud !== GOOGLE_CONFIG.clientId) {
    throw new Error('GOOGLE_AUDIENCE_MISMATCH');
  }

  if (!data.email) {
    throw new Error('GOOGLE_NO_EMAIL');
  }

  return {
    sub: data.sub,
    email: data.email,
    email_verified: data.email_verified === true || data.email_verified === 'true',
    name: data.name || data.email.split('@')[0],
    picture: data.picture,
    given_name: data.given_name,
    family_name: data.family_name,
  };
}

async function getActiveCampaign() {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from('trial_campaigns')
    .select('id, trial_days, trial_generations_limit, price_cop, require_card_verification')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as { id: string; trial_days: number; trial_generations_limit: number; price_cop: number; require_card_verification: boolean } | null;
}

/**
 * Busca o crea una marca a partir de datos de Google
 * - Si existe por google_id → login directo
 * - Si existe por email → vincula google_id y login
 * - Si no existe → crea marca con needs_onboarding=true
 */
export async function findOrCreateBrandFromGoogle(
  payload: GoogleTokenPayload
): Promise<GoogleAuthResult> {
  // 1. Buscar por google_id primero
  const { data: brandByGoogleId } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('google_id', payload.sub)
    .maybeSingle();

  if (brandByGoogleId) {
    const token = generateToken({ brandId: brandByGoogleId.id, email: brandByGoogleId.email });
    return {
      token,
      brand: brandByGoogleId,
      needsOnboarding: false,
      isNewBrand: false,
      accountLinked: false,
    };
  }

  // 2. Buscar por email (vinculación automática)
  const { data: brandByEmail } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('email', payload.email.toLowerCase())
    .maybeSingle();

  if (brandByEmail) {
    // Vincular google_id si no lo tiene
    if (!brandByEmail.google_id) {
      await supabaseAdmin
        .from('brands')
        .update({
          google_id: payload.sub,
          auth_provider: 'google',
        })
        .eq('id', brandByEmail.id);
    }

    const token = generateToken({ brandId: brandByEmail.id, email: brandByEmail.email });
    return {
      token,
      brand: brandByEmail,
      needsOnboarding: false,
      isNewBrand: false,
      accountLinked: true,
    };
  }

  // 3. Crear nueva marca (necesitará completar onboarding)
  const contactName = [payload.given_name, payload.family_name]
    .filter(Boolean)
    .join(' ') || payload.name;

  const temporarySlug = `google-${payload.sub.substring(0, 8)}-${Date.now()}`;

  const campaign = await getActiveCampaign();
  let trialEndDate: string | null = null;
  let trialGenerationsLimit = 0;
  let trialPaymentStatus: string | null = null;
  let campaignTrialDays = 0;

  if (campaign) {
    const requiresPayment = (campaign.price_cop ?? 0) > 0 && campaign.require_card_verification !== false;
    if (!requiresPayment) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + campaign.trial_days);
      trialEndDate = endDate.toISOString();
      trialGenerationsLimit = campaign.trial_generations_limit ?? 15;
      trialPaymentStatus = 'active';
      campaignTrialDays = campaign.trial_days;
    }
  }

  const { data: newBrand, error } = await supabaseAdmin
    .from('brands')
    .insert({
      email: payload.email.toLowerCase(),
      password: null,
      name: contactName,
      slug: temporarySlug, // Se actualiza en onboarding
      contact_name: contactName,
      google_id: payload.sub,
      auth_provider: 'google',
      email_verified: true,
      needs_onboarding: true,
      plan: trialEndDate ? 'TRIAL' : 'BASIC',
      subscription_status: trialEndDate ? 'trial' : 'active',
      trial_end_date: trialEndDate,
      trial_generations_limit: trialGenerationsLimit,
      trial_payment_status: trialPaymentStatus,
      primary_color: '#000000',
      secondary_color: '#ffffff',
    })
    .select()
    .single();

  if (error) {
    console.error('[GoogleAuth] Error creando marca:', error);
    throw new Error('GOOGLE_BRAND_CREATE_FAILED');
  }

  if (trialEndDate) {
    await recordTrialEvent(newBrand.id, 'trial_started', {
      source: 'google_signup',
      trialDays: campaignTrialDays,
      trialGenerationsLimit,
    }).catch(() => {});
  }

  const token = generateToken({ brandId: newBrand.id, email: newBrand.email });

  return {
    token,
    brand: newBrand,
    needsOnboarding: true,
    isNewBrand: true,
    accountLinked: false,
  };
}

/**
 * Endpoint principal: recibe credential de Google, verifica y retorna sesión
 */
export async function loginWithGoogle(googleCredential: string): Promise<GoogleAuthResult> {
  if (!GOOGLE_CONFIG.clientId) {
    throw new Error('GOOGLE_NOT_CONFIGURED');
  }

  const payload = await verifyGoogleToken(googleCredential);
  return findOrCreateBrandFromGoogle(payload);
}
