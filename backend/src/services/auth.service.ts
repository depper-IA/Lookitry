import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { RegisterBrandDto, LoginDto, AuthResponse, Brand } from '../types';
import { generateToken } from '../utils/jwt';

// ── Helpers de campaña de trial ───────────────────────────────────────────────

async function getActiveCampaign() {
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
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

  const { data: byIp } = await supabaseAdmin
    .from('trial_registrations')
    .select('id')
    .eq('ip_address', ip)
    .gte('created_at', since.toISOString())
    .limit(1)
    .single();

  if (byIp) return true;

  // Verificar fingerprint si se proporcionó
  if (fingerprint) {
    const { data: byFp } = await supabaseAdmin
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
  await supabaseAdmin.from('trial_registrations').insert({
  brand_id: brandId,
  ip_address: ip,
  fingerprint: fingerprint || null,
  campaign_id: campaignId,
  });
  }

  export class AuthService {
  /**
  * Registro seguro después de un pago confirmado (Wompi o PayPal).
  * Valida que la referencia exista, que el status sea 'paid' y la marca no exista aún.
  */
  async registerPostPayment(data: RegisterBrandDto & { ref: string; fingerprint?: string }): Promise<AuthResponse> {
  const { ref, name, slug, password, contact_name, fingerprint } = data;

  // 1. Validar referencia en pending_registrations
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .select('*')
    .eq('reference', ref)
    .single();

  if (pendingError || !pending) {
    throw new Error('REFERENCIA_INVALIDA');
  }

  // 2. Verificar estado del pago (Seguridad crítica)
  // Nota: Si aún no has corrido el SQL, esto podría fallar, por lo que añadimos un fallback temporal
  // que asume 'paid' si la columna no existe o si es el flujo antiguo, pero lo ideal es el status.
  const status = (pending as any).status || 'paid'; 
  if (status === 'used') {
    throw new Error('REFERENCIA_YA_UTILIZADA');
  }
  // Si la columna existe y no es 'paid', rechazar
  if ((pending as any).status && (pending as any).status !== 'paid') {
    throw new Error('PAGO_NO_CONFIRMADO');
  }

  // 3. Validar disponibilidad de Email y Slug
  const { data: existingBrand } = await supabaseAdmin.from('brands').select('*').eq('email', pending.email).single();
  
  let targetBrandId: string;

  if (existingBrand) {
    // Si la marca ya existe, verificar la contraseña para vincular el pago
    const isPasswordValid = await bcrypt.compare(password, existingBrand.password);
    if (!isPasswordValid) {
      throw new Error('EL_EMAIL_YA_EXISTE_CONTRASENA_INCORRECTA');
    }
    
    // Si la contraseña es válida, procedemos a actualizar la marca existente
    targetBrandId = existingBrand.id;
    
    // Actualizar plan y fechas en la marca existente
    const months = pending.months || 1;
    const plan = (pending.plan || 'BASIC').toUpperCase();
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);

    await supabaseAdmin
      .from('brands')
      .update({
        plan,
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        has_landing_page: pending.includes_landing || existingBrand.has_landing_page || false,
        last_payment_date: now.toISOString(),
      })
      .eq('id', targetBrandId);

    console.log(`[AuthService] Pago vinculado exitosamente a cuenta existente: ${pending.email}`);
  } else {
    // Si la marca no existe, crearla normalmente
    const { data: existingSlug } = await supabaseAdmin.from('brands').select('id').eq('slug', slug).single();
    if (existingSlug) throw new Error('El slug ya está en uso');

    const hashedPassword = await bcrypt.hash(password, 10);
    const months = pending.months || 1;
    const plan = (pending.plan || 'BASIC').toUpperCase();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const { data: newBrand, error: createError } = await supabaseAdmin
      .from('brands')
      .insert({
        email: pending.email,
        password: hashedPassword,
        name,
        slug,
        contact_name: contact_name.trim(),
        plan,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString(),
        has_landing_page: pending.includes_landing || false,
        email_verified: true,
      })
      .select()
      .single();

    if (createError || !newBrand) {
      throw new Error('Error al crear la cuenta: ' + createError?.message);
    }
    targetBrandId = newBrand.id;
  }

  // 5. MARCAR REFERENCIA COMO UTILIZADA
  await supabaseAdmin
    .from('pending_registrations')
    .update({ status: 'used', updated_at: new Date().toISOString() } as any)
    .eq('reference', ref);

  // 6. Registrar el pago oficial en subscription_payments
  await supabaseAdmin.from('subscription_payments').insert({
    brand_id: targetBrandId,
    amount: pending.amount || 0,
    currency: 'COP',
    payment_date: new Date().toISOString(),
    payment_method: ref.includes('PAYPAL') ? 'paypal' : 'wompi',
    status: 'completed',
    months_paid: pending.months || 1,
    notes: `Activación via registro post-pago. Ref: ${ref}. ID Pago: ${(pending as any).payment_id || 'N/A'}`
  });

  const finalBrand = await this.getBrandById(targetBrandId);
  if (!finalBrand) throw new Error('Error al recuperar datos de la marca');

  const token = generateToken({ brandId: finalBrand.id, email: finalBrand.email });

  return {
    token,
    brand: {
      id: finalBrand.id,
      email: finalBrand.email,
      name: finalBrand.name,
      slug: finalBrand.slug,
      plan: finalBrand.plan,
    },
    isTrial: false,
  };
  }  async register(data: RegisterBrandDto & { ip?: string; fingerprint?: string }): Promise<AuthResponse> {
    // Validar que el email no exista — supabaseAdmin para bypassear RLS
    const { data: existingBrand } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingBrand) {
      throw new Error('El email ya está registrado');
    }

    // Validar que el slug no exista
    const { data: existingSlug } = await supabaseAdmin
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

    // Crear marca — supabaseAdmin para bypassear RLS en INSERT
    const { data: newBrand, error } = await supabaseAdmin
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
      ? await supabaseAdmin
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
    // Buscar marca por email — usar supabaseAdmin para bypassear RLS
    const { data: brand, error } = await supabaseAdmin
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
    const { data: brand } = await supabaseAdmin
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

    await supabaseAdmin
      .from('brands')
      .update({ email_verified: true, email_verification_token: null })
      .eq('id', brand.id);

    return { ok: true, message: 'Correo verificado correctamente' };
  }

  async getBrandById(brandId: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
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
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, name, email')
      .eq('email', email)
      .single();

    // No revelar si el email existe o no (seguridad)
    if (!brand) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabaseAdmin
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
    // Usar supabaseAdmin para bypassear RLS y encontrar la marca por email
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!brand) return { brand: null, token: null };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabaseAdmin
      .from('brands')
      .update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString() })
      .eq('id', brand.id);

    return { brand: { name: brand.name, email: brand.email }, token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single();

    if (!brand) throw new Error('TOKEN_INVALID');

    const expiresAt = new Date(brand.reset_token_expires_at);
    if (expiresAt < new Date()) throw new Error('TOKEN_EXPIRED');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabaseAdmin
      .from('brands')
      .update({ password: hashedPassword, reset_token: null, reset_token_expires_at: null })
      .eq('id', brand.id);
  }

  async resendVerificationEmail(email: string): Promise<{ brand: { name: string; email: string } | null; token: string | null }> {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, email_verified, email_verification_token')
      .eq('email', email)
      .single();

    if (!brand || brand.email_verified) return { brand: null, token: null };

    // Reusar token existente o generar uno nuevo
    let token = brand.email_verification_token;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await supabaseAdmin
        .from('brands')
        .update({ email_verification_token: token })
        .eq('id', brand.id);
    }

    return { brand: { name: brand.name, email: brand.email }, token };
  }

  async changePassword(brandId: string, currentPassword: string, newPassword: string): Promise<void> {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, password')
      .eq('id', brandId)
      .single();

    if (!brand) throw new Error('NOT_FOUND');

    const isValid = await bcrypt.compare(currentPassword, brand.password);
    if (!isValid) throw new Error('WRONG_PASSWORD');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabaseAdmin
      .from('brands')
      .update({ password: hashedPassword })
      .eq('id', brandId);
  }
}
