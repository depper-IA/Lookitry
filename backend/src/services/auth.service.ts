import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase, supabaseAdmin } from '../config/supabase';
import { RegisterBrandDto, LoginDto, AuthResponse, Brand } from '../types';
import { generateToken } from '../utils/jwt';

// ── Helpers de campaña de trial ───────────────────────────────────────────────

async function getActiveCampaign() {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('trial_campaigns')
    .select('id, trial_days, trial_generations_limit')
    .eq('active', true)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as { id: string; trial_days: number; trial_generations_limit: number } | null;
}

async function isTrialAbuse(ip: string, fingerprint: string | null): Promise<boolean> {
  // Verificar bypass y whitelist en payment_settings
  const { data: psData } = await supabaseAdmin
    .from('payment_settings')
    .select('bypass_ip_protection, ip_whitelist')
    .eq('id', 1)
    .single();

  if (psData?.bypass_ip_protection === true) {
    return false;
  }

  // Verificar si la IP está en la whitelist
  if (psData?.ip_whitelist) {
    const whitelist = psData.ip_whitelist.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (whitelist.includes(ip)) {
      return false;
    }
  }

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
        contact_name: data.contact_name.trim(),
        phone: data.phone?.trim() || null,
        plan: 'BASIC',
        trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,
        trial_generations_limit: trialEndDate ? (campaign?.trial_generations_limit ?? 50) : 0,
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

    // Verificar si la campaña activa requiere verificación de tarjeta
    const { data: campaignFull } = campaign
      ? await supabase
          .from('trial_campaigns')
          .select('require_card_verification')
          .eq('id', campaign.id)
          .single()
      : { data: null };

    const requireCardVerification = campaignFull?.require_card_verification === true;

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
      requireCardVerification,
      isTrial: !!trialEndDate,
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
        emailVerified: brand.email_verified,
        trialEndDate: brand.trial_end_date ?? null,
        trialPaymentStatus: brand.trial_payment_status ?? null,
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

  async requestPasswordReset(email: string): Promise<void> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, email')
      .eq('email', email)
      .single();

    // No revelar si el email existe o no (seguridad)
    if (!brand) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabase
      .from('brands')
      .update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString() })
      .eq('id', brand.id);

    // El caller se encarga de enviar el email
    (brand as any)._resetToken = token;
    (brand as any)._resetExpires = expiresAt;

    // Guardar en el objeto para que el controller lo use
    Object.assign(brand, { _resetToken: token });
  }

  async requestPasswordResetGetToken(email: string): Promise<{ brand: { name: string; email: string } | null; token: string | null }> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!brand) return { brand: null, token: null };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabase
      .from('brands')
      .update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString() })
      .eq('id', brand.id);

    return { brand: { name: brand.name, email: brand.email }, token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single();

    if (!brand) throw new Error('TOKEN_INVALID');

    const expiresAt = new Date(brand.reset_token_expires_at);
    if (expiresAt < new Date()) throw new Error('TOKEN_EXPIRED');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('brands')
      .update({ password: hashedPassword, reset_token: null, reset_token_expires_at: null })
      .eq('id', brand.id);
  }

  async resendVerificationEmail(email: string): Promise<{ brand: { name: string; email: string } | null; token: string | null }> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name, email, email_verified, email_verification_token')
      .eq('email', email)
      .single();

    if (!brand || brand.email_verified) return { brand: null, token: null };

    // Reusar token existente o generar uno nuevo
    let token = brand.email_verification_token;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await supabase
        .from('brands')
        .update({ email_verification_token: token })
        .eq('id', brand.id);
    }

    return { brand: { name: brand.name, email: brand.email }, token };
  }

  async changePassword(brandId: string, currentPassword: string, newPassword: string): Promise<void> {
    const { data: brand } = await supabase
      .from('brands')
      .select('id, password')
      .eq('id', brandId)
      .single();

    if (!brand) throw new Error('NOT_FOUND');

    const isValid = await bcrypt.compare(currentPassword, brand.password);
    if (!isValid) throw new Error('WRONG_PASSWORD');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase
      .from('brands')
      .update({ password: hashedPassword })
      .eq('id', brandId);
  }
}
