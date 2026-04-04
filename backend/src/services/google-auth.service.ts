import { supabaseAdmin } from '../config/supabase';
import { GOOGLE_CONFIG } from '../config/google';
import { generateToken } from '../utils/jwt';

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
 * Verifica el JWT de Google con la API de Google
 */
async function verifyGoogleToken(token: string): Promise<GoogleTokenPayload> {
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

  const { data: newBrand, error } = await supabaseAdmin
    .from('brands')
    .insert({
      email: payload.email.toLowerCase(),
      password: null,
      name: contactName,
      slug: null, // Se completará en onboarding
      contact_name: contactName,
      google_id: payload.sub,
      auth_provider: 'google',
      email_verified: true,
      needs_onboarding: true,
      plan: 'TRIAL',
      subscription_status: 'trial',
      primary_color: '#000000',
      secondary_color: '#ffffff',
    })
    .select()
    .single();

  if (error) {
    console.error('[GoogleAuth] Error creando marca:', error);
    throw new Error('GOOGLE_BRAND_CREATE_FAILED');
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
