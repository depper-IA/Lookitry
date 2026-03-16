import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { RegisterBrandDto, LoginDto, AuthResponse, Brand } from '../types';
import { generateToken } from '../utils/jwt';

// ── Helpers de campaña de trial ───────────────────────────────────────────────

async function getActiveCampaign() {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('trial_campaigns')
    .select('id, trial_days')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as { id: string; trial_days: number } | null;
}

async function isTrialAbuse(ip: string, fingerprint: string | null): Promise<boolean> {
  // Verificar si la IP ya tiene un trial registrado en los últimos 30 días
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: byIp } = await supabase
    .from('trial_registrations')
    .select('id')
    .eq('ip_address', ip)
    .gte('created_at', since.toISOString())
    .limit(1)
    .single();

  if (byIp) return true;

  // Verificar fingerprint si se proporcionó
  if (fingerprint) {
    const { data: byFp } = await supabase
      .from('trial_registrations')
      .select('id')
      .eq('fingerprint', fingerprint)
      .gte('created_at', since.toISOString())
      .limit(1)
      .single();

    if (byFp) return true;
  }

  return false;
}

async function recordTrialRegistration(brandId: string, ip: string, fingerprint: string | null, campaignId: string) {
  await supabase.from('trial_registrations').insert({
    brand_id: brandId,
    ip_address: ip,
    fingerprint: fingerprint || null,
    campaign_id: campaignId,
  });
}

export class AuthService {
  async register(data: RegisterBrandDto & { ip?: string; fingerprint?: string }): Promise<AuthResponse> {
    // Validar que el email no exista
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingBrand) {
      throw new Error('El email ya está registrado');
    }

    // Validar que el slug no exista
    const { data: existingSlug } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existingSlug) {
      throw new Error('El slug ya está en uso');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Verificar si hay campaña de trial activa
    const campaign = await getActiveCampaign();
    let trialEndDate: Date | null = null;

    if (campaign) {
      // Verificar abuso de IP/fingerprint solo si hay campaña activa
      const ip = data.ip || 'unknown';
      const fingerprint = data.fingerprint || null;
      const isAbuse = await isTrialAbuse(ip, fingerprint);

      if (isAbuse) {
        throw new Error('TRIAL_ABUSE');
      }

      trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + campaign.trial_days);
    }

    // Crear marca
    const { data: newBrand, error } = await supabase
      .from('brands')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        slug: data.slug,
        plan: 'BASIC',
        trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
        trial_generations_limit: trialEndDate ? 30 : 0,
        email_verified: false,
        email_verification_token: crypto.randomBytes(32).toString('hex'),
      })
      .select()
      .single();

    if (error || !newBrand) {
      throw new Error('Error al crear la marca: ' + error?.message);
    }

    // Registrar IP/fingerprint para evitar abuso futuro (solo si hubo trial)
    if (campaign && trialEndDate) {
      const ip = data.ip || 'unknown';
      const fingerprint = data.fingerprint || null;
      recordTrialRegistration(newBrand.id, ip, fingerprint, campaign.id).catch(() => {});
    }

    // Generar token
    const token = generateToken({
      brandId: newBrand.id,
      email: newBrand.email,
    });

    return {
      token,
      brand: {
        id: newBrand.id,
        email: newBrand.email,
        name: newBrand.name,
        slug: newBrand.slug,
        plan: newBrand.plan,
      },
      verificationToken: newBrand.email_verification_token,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Buscar marca por email
    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('email', data.email)
      .single();

    if (error || !brand) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, brand.password);

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Bloquear acceso si el email no está verificado
    if (!brand.email_verified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    // Generar token
    const token = generateToken({
      brandId: brand.id,
      email: brand.email,
    });

    return {
      token,
      brand: {
        id: brand.id,
        email: brand.email,
        name: brand.name,
        slug: brand.slug,
        plan: brand.plan,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ ok: boolean; message: string }> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, email_verified')
      .eq('email_verification_token', token)
      .single();

    if (!brand) {
      return { ok: false, message: 'Token inválido o expirado' };
    }

    if (brand.email_verified) {
      return { ok: true, message: 'El correo ya fue verificado anteriormente' };
    }

    await supabase
      .from('brands')
      .update({ email_verified: true, email_verification_token: null })
      .eq('id', brand.id);

    return { ok: true, message: 'Correo verificado correctamente' };
  }

  async getBrandById(brandId: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Brand;
  }
}
