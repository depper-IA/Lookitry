import bcrypt from 'bcryptjs';

import crypto from 'crypto';

import * as jwt from 'jsonwebtoken';

import { supabaseAdmin } from '../config/supabase';

import { RegisterBrandDto, LoginDto, AuthResponse, Brand } from '../types';

import { generateToken } from '../utils/jwt';

import { pricingService } from './pricing.service';

import { attachLedgerSnapshotToNotes } from '../utils/paymentLedger';

import { recordTrialEvent } from '../utils/brandLifecycle';

import { redis } from '../config/redis';



// — Constants para lockout ——————————————————————————

const MAX_FAILED_ATTEMPTS = 5;

const LOCKOUT_DURATION_MINUTES = 15;

const LOCKOUT_KEY_PREFIX = 'auth:lockout:';

const FAILED_KEY_PREFIX = 'auth:failed:';



// — Helpers de campaña de trial ———————————————————————â



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



function campaignRequiresTrialPayment(campaign: {

  price_cop?: number | null;

  require_card_verification?: boolean | null;

} | null): boolean {

  if (!campaign) return false;

  if (Number(campaign.price_cop || 0) <= 0) return false;

  return campaign.require_card_verification !== false;

}



async function recordTrialRegistration(brandId: string, ip: string, fingerprint: string | null, campaignId: string) {

  await supabaseAdmin.from('trial_registrations').insert({

  brand_id: brandId,

  ip_address: ip,

  fingerprint: fingerprint || null,

  campaign_id: campaignId,

  });

  }



function createEmailVerificationToken(): string {

  return crypto.randomBytes(32).toString('hex');

}



function validatePasswordComplexity(password: string): { isValid: boolean; message?: string } {

  if (password.length < 8) {

    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };

  }

  

  if (!/[A-Z]/.test(password)) {

    return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };

  }

  

  if (!/[a-z]/.test(password)) {

    return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };

  }

  

  if (!/[0-9]/.test(password)) {

    return { isValid: false, message: 'La contraseña debe contener al menos un número' };

  }

  

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {

    return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };

  }

  

  return { isValid: true };

}



  export class AuthService {

  /**

  * Registro seguro después de un pago confirmado (Wompi o PayPal).

  * Valida que la referencia exista, que el status sea 'paid' y la marca no exista aún.

  */

  async registerPostPayment(data: RegisterBrandDto & { ref: string; fingerprint?: string }): Promise<AuthResponse> {

  const { ref, name, slug, password, contact_name, fingerprint } = data;

  const normalizedReference = String(ref || '').toUpperCase();

  const isTrialReference = normalizedReference.startsWith('TRIAL-') || normalizedReference.startsWith('GUEST-TRIAL-');



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

  let verificationToken: string | undefined;



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

    const isTrial = isTrialReference || (pending.plan || '').toUpperCase() === 'TRIAL';

    const plan = isTrial ? 'TRIAL' : (pending.plan || 'BASIC').toUpperCase();



    const now = new Date();

    let endDate = new Date(now);

    let trialEndDate: string | null = null;

    let trialLimit = 0;



    if (isTrial) {

      const campaign = await getActiveCampaign();

      const trialDays = campaign?.trial_days || 7;

      trialLimit = campaign?.trial_generations_limit || 15;

      const tDate = new Date(now);

      tDate.setDate(tDate.getDate() + trialDays);

      trialEndDate = tDate.toISOString();

      // El endDate de la suscripcion en si puede ser el mismo que trial o null

      endDate = tDate; 

    } else {

      // BUG #7 FIX: Usar +30*months para ser consistente con calculateExpirationDate()

      // Evita discrepancias de 1-3 días en meses con <31 días (ej. febrero).

      endDate = new Date(now.getTime() + 30 * months * 24 * 60 * 60 * 1000);

    }



    if (!existingBrand.email_verified) {

      verificationToken = existingBrand.email_verification_token || createEmailVerificationToken();

    }



    await supabaseAdmin

      .from('brands')

      .update({

        plan,

        subscription_status: 'active',

        subscription_start_date: now.toISOString(),

        subscription_end_date: endDate.toISOString(),

        trial_end_date: trialEndDate,

        trial_generations_limit: trialLimit,

        trial_payment_status: isTrial ? 'active' : null,

        has_landing_page: pending.includes_landing || existingBrand.has_landing_page || false,

        last_payment_date: now.toISOString(),

        email_verification_token: existingBrand.email_verified ? null : verificationToken,

      })

      .eq('id', targetBrandId);



    console.log(`[AuthService] Pago vinculado exitosamente a cuenta existente: ${pending.email}`);

  } else {

    // Si la marca no existe, crearla normalmente

    const { data: existingSlug } = await supabaseAdmin.from('brands').select('id').eq('slug', slug).single();

    if (existingSlug) throw new Error('El slug ya está en uso');



    const hashedPassword = await bcrypt.hash(password, 10);

    const months = pending.months || 1;

    const isTrial = isTrialReference || (pending.plan || '').toUpperCase() === 'TRIAL';

    const plan = isTrial ? 'TRIAL' : (pending.plan || 'BASIC').toUpperCase();



    const now = new Date();

    let endDate = new Date(now);

    let trialEndDate: string | null = null;

    let trialLimit = 0;



    if (isTrial) {

      const campaign = await getActiveCampaign();

      const trialDays = campaign?.trial_days || 7;

      trialLimit = campaign?.trial_generations_limit || 15;

      const tDate = new Date(now);

      tDate.setDate(tDate.getDate() + trialDays);

      trialEndDate = tDate.toISOString();

      endDate = tDate;

    } else {

      // BUG #7 FIX: Usar +30*months para ser consistente con calculateExpirationDate()

      // Evita discrepancias de 1-3 días en meses con <31 días (ej. febrero).

      endDate = new Date(now.getTime() + 30 * months * 24 * 60 * 60 * 1000);

    }



    verificationToken = createEmailVerificationToken();



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

        trial_end_date: trialEndDate,

        trial_generations_limit: trialLimit,

        trial_payment_status: isTrial ? 'active' : null,

        has_landing_page: pending.includes_landing || false,

        email_verified: false,

        email_verification_token: verificationToken,

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

  const recordedAmount = Number(pending.amount || 0) > 0

    ? Number(pending.amount)

    : await pricingService.calculateTotal(

        String(pending.plan || 'BASIC').toUpperCase(),

        Number(pending.months || 1),

        Boolean(pending.includes_landing)

      );



  const paymentPayload = {

    brand_id: targetBrandId,

    amount: recordedAmount,

    currency: 'COP',

    payment_date: new Date().toISOString(),

    payment_method: ref.includes('PAYPAL') ? 'paypal' : 'wompi',

    status: 'completed',

    months_paid: pending.months || 1,

    reference: ref,

    notes: `Activación via registro post-pago. Ref: ${ref}. ID Pago: ${(pending as any).payment_id || 'N/A'}.${pending.includes_landing ? ' Incluye Landing Page.' : ''}`

  };



  const finalBrand = await this.getBrandById(targetBrandId);

  if (!finalBrand) throw new Error('Error al recuperar datos de la marca');



  const paymentPayloadWithSnapshot = {

    ...paymentPayload,

    notes: attachLedgerSnapshotToNotes(paymentPayload.notes, {

      version: 1,

      brandId: targetBrandId,

      brandName: finalBrand?.name || name || null,

      brandEmail: finalBrand?.email || pending.email || null,

      brandSlug: finalBrand?.slug || slug || null,

      planPurchased: String(pending.plan || 'BASIC').toUpperCase(),

      billingType: isTrialReference || String(pending.plan || '').toUpperCase() === 'TRIAL' ? 'trial_activation' : 'subscription',

      includesLanding: Boolean(pending.includes_landing),

      brandPlanBefore: existingBrand?.plan || null,

      brandPlanAfter: finalBrand?.plan || null,

    }),

  };



  let { error: paymentInsertError } = await supabaseAdmin.from('subscription_payments').insert(paymentPayloadWithSnapshot);



  if (paymentInsertError?.message?.toLowerCase().includes('reference')) {

    const { reference, ...fallbackPayload } = paymentPayloadWithSnapshot;

    const retry = await supabaseAdmin.from('subscription_payments').insert(fallbackPayload);

    paymentInsertError = retry.error || null;

  }



  if (paymentInsertError) {

    throw new Error('Error al registrar el pago: ' + paymentInsertError.message);

  }



  if ((isTrialReference || (pending.plan || '').toUpperCase() === 'TRIAL') && finalBrand.trial_end_date) {

    await recordTrialEvent(finalBrand.id, 'trial_started', {

      source: 'post_payment_registration',

      trialEndDate: finalBrand.trial_end_date,

    }).catch(() => {});

  }



  const token = generateToken({ brandId: finalBrand.id, email: finalBrand.email });



  return {

    token,

    brand: {

      id: finalBrand.id,

      email: finalBrand.email,

      name: finalBrand.name,

      slug: finalBrand.slug,

      plan: finalBrand.plan,

      api_key: finalBrand.api_key,

    },

    verificationToken,

    isTrial: isTrialReference || (pending.plan || '').toUpperCase() === 'TRIAL',

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

        plan: trialEndDate ? 'TRIAL' : 'BASIC',

        trial_end_date: trialEndDate ? trialEndDate.toISOString() : null,

        trial_generations_limit: trialEndDate ? (campaign?.trial_generations_limit ?? 15) : 0,

        email_verified: false,

        email_verification_token: crypto.randomBytes(32).toString('hex'),

      })

      .select()

      .single();



    if (error || !newBrand) {

      throw new Error('Error al crear la marca: ' + error?.message);

    }



    // Registrar trial para tracking

    if (campaign && trialEndDate) {

      const ip = data.ip || 'unknown';

      const fingerprint = data.fingerprint || null;

      recordTrialRegistration(newBrand.id, ip, fingerprint, campaign.id).catch(() => {});

      recordTrialEvent(newBrand.id, 'trial_started', {

        trialDays: campaign.trial_days,

        trialGenerationsLimit: campaign.trial_generations_limit,

      }).catch(() => {});

    }



    // Generar token

    const token = generateToken({

      brandId: newBrand.id,

      email: newBrand.email,

    });



    const requiresTrialPayment = campaignRequiresTrialPayment(campaign);



    return {

      token,

      brand: {

        id: newBrand.id,

        email: newBrand.email,

        name: newBrand.name,

        slug: newBrand.slug,

        plan: newBrand.plan,

        api_key: newBrand.api_key,

      },

      verificationToken: newBrand.email_verification_token,

      requiresTrialPayment,

      isTrial: !!trialEndDate,

    };

  }



  // — Lockout helpers (Redis con fallback a DB) ——————————————â



  /**

   * Verifica si una marca está bloqueada (usa Redis, fallback a DB)

   */

  private async isLockedOut(brandId: string): Promise<{ locked: boolean; reason?: string }> {

    const redisKey = `${LOCKOUT_KEY_PREFIX}${brandId}`;



    // 1ï¸â£ Verificar en Redis primero (más rápido)

    try {

      const ttl = await redis.ttl(redisKey);

      if (ttl > 0) {

        const secondsLeft = await redis.ttl(redisKey);

        const minutesLeft = Math.ceil(secondsLeft / 60);

        return {

          locked: true,

          reason: `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minuto(s).`,

        };

      }

    } catch {

      // Redis no disponible, fallback a DB

    }



    // 2ï¸â£ Fallback: verificar en DB directamente

    const { data: brand } = await supabaseAdmin

      .from('brands')

      .select('locked_until')

      .eq('id', brandId)

      .single();



    if (brand?.locked_until) {

      const lockedUntil = new Date(brand.locked_until);

      if (lockedUntil > new Date()) {

        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);

        return {

          locked: true,

          reason: `Cuenta bloqueada. Intenta de nuevo en ${minutesLeft} minuto(s).`,

        };

      }

    }



    return { locked: false };

  }



  /**

   * Registra un intento fallido y aplica lockout si es necesario

   */

  private async recordFailedAttempt(brandId: string, ip: string): Promise<void> {

    const redisKey = `${FAILED_KEY_PREFIX}${brandId}`;



    // 1ï¸â£ Intentar registrar en Redis

    try {

      const attempts = await redis.incr(redisKey);

      await redis.expire(redisKey, LOCKOUT_DURATION_MINUTES * 60);



      if (attempts >= MAX_FAILED_ATTEMPTS) {

        // Bloquear en Redis

        await redis.setex(`${LOCKOUT_KEY_PREFIX}${brandId}`, LOCKOUT_DURATION_MINUTES * 60, '1');

        await redis.del(redisKey); // Limpiar contador

        console.warn(`[Auth] Brand ${brandId} bloqueado por ${LOCKOUT_DURATION_MINUTES} minutos (IP: ${ip})`);

      }

    } catch {

      // Redis no disponible, fallback a DB

      await this.recordFailedAttemptDB(brandId);

    }

  }



  /**

   * Fallback a DB cuando Redis no está disponible

   */

  private async recordFailedAttemptDB(brandId: string): Promise<void> {

    const { data: brand } = await supabaseAdmin

      .from('brands')

      .select('failed_login_attempts')

      .eq('id', brandId)

      .single();



    const currentAttempts = brand?.failed_login_attempts || 0;

    const newAttempts = currentAttempts + 1;



    if (newAttempts >= MAX_FAILED_ATTEMPTS) {

      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);

      await supabaseAdmin

        .from('brands')

        .update({

          failed_login_attempts: 0,

          locked_until: lockedUntil.toISOString(),

        })

        .eq('id', brandId);

    } else {

      await supabaseAdmin

        .from('brands')

        .update({ failed_login_attempts: newAttempts })

        .eq('id', brandId);

    }

  }



  /**

   * Resetea contador de intentos fallidos tras login exitoso

   */

  private async resetFailedAttempts(brandId: string): Promise<void> {

    const redisKey = `${FAILED_KEY_PREFIX}${brandId}`;



    // Limpiar Redis

    try {

      await redis.del(redisKey);

      await redis.del(`${LOCKOUT_KEY_PREFIX}${brandId}`);

    } catch {

      // Ignorar errores de Redis

    }



    // Limpiar DB

    await supabaseAdmin

      .from('brands')

      .update({

        failed_login_attempts: 0,

        locked_until: null,

      })

      .eq('id', brandId);

  }



  // — Login —————————————————————————————————



  async login(data: LoginDto): Promise<AuthResponse> {

    const ip = data.ip || 'unknown';

    const fingerprint = data.fingerprint || null;



    // Buscar marca por email — usar supabaseAdmin para bypassear RLS

    const { data: brand, error } = await supabaseAdmin

      .from('brands')

      .select('*')

      .eq('email', data.email)

      .single();



    if (error || !brand) {

      console.warn(`[Auth] Login fallido - email no encontrado: ${data.email} desde IP: ${ip}`);

      throw new Error('Credenciales inválidas');

    }



    // Verificar si está bloqueada

    const lockCheck = await this.isLockedOut(brand.id);

    if (lockCheck.locked) {

      console.warn(`[Auth] Login bloqueado para brand: ${brand.id} - ${lockCheck.reason}`);

      throw new Error(lockCheck.reason!);

    }



    // Verificar contraseña

    const isPasswordValid = await bcrypt.compare(data.password, brand.password);



    if (!isPasswordValid) {

      console.warn(`[Auth] Login fallido - password inválido para brand: ${brand.id} (${data.email}) desde IP: ${ip}`);

      await this.recordFailedAttempt(brand.id, ip);

      throw new Error('Credenciales inválidas');

    }



    // Login exitoso - resetear contadores

    await this.resetFailedAttempts(brand.id);

    console.info(`[Auth] Login exitoso para brand: ${brand.id} (${data.email}) desde IP: ${ip}`);



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

        api_key: brand.api_key,

        emailVerified: brand.email_verified,

        trialEndDate: brand.trial_end_date ?? null,

        trialPaymentStatus: brand.trial_payment_status ?? null,

      },

    };

  }



  async verifyEmail(token: string): Promise<{ ok: boolean; message: string; brandId?: string }> {

    console.log('[verifyEmail] Token recibido:', token.substring(0, 20) + '...');



    const { data: brand } = await supabaseAdmin

      .from('brands')

      .select('id, email_verified, email')

      .eq('email_verification_token', token)

      .single();



    console.log('[verifyEmail] Brand encontrado:', brand ? { id: brand.id, email: brand.email, email_verified: brand.email_verified } : 'NO');



    if (!brand) {

      return { ok: false, message: 'Token inválido o expirado' };

    }



    if (brand.email_verified) {

      console.log('[verifyEmail] Brand ya estaba verificado:', brand.id);

      return { ok: true, message: 'El correo ya fue verificado anteriormente' };

    }



    console.log('[verifyEmail] Verificando brand:', brand.id);

    const { data: updateResult, error: updateError } = await supabaseAdmin

      .from('brands')

      .update({ email_verified: true, email_verification_token: null })

      .eq('id', brand.id)

      .select('id, email_verified')

      .single();



    console.log('[verifyEmail] Resultado de update:', updateResult, 'Error:', updateError);



    if (updateError) {

      console.error('[verifyEmail] Error en update:', updateError);

      return { ok: false, message: 'Error al actualizar verificación' };

    }



    // Invalida cache de brand config (async, no bloquea respuesta)

    this.invalidateBrandCacheAsync(brand.id).catch((err: unknown) => console.error('[verifyEmail] Error invalidating cache:', err));



    const verifiedBrand = await this.getBrandById(brand.id);

    if (verifiedBrand?.trial_end_date) {

      await recordTrialEvent(brand.id, 'trial_email_verified').catch(() => {});

    }



    console.log('[verifyEmail] Verificación completada para brand:', brand.id);

    return { ok: true, message: 'Correo verificado correctamente', brandId: brand.id };

  }



  private async invalidateBrandCacheAsync(brandId: string): Promise<void> {

    try {

      const { invalidateBrandConfigCache } = await import('../utils/brandConfigCache');

      const { data: brandData } = await supabaseAdmin

        .from('brands')

        .select('slug')

        .eq('id', brandId)

        .single();

      if (brandData?.slug) {

        console.log('[verifyEmail] Invalidando cache para slug:', brandData.slug);

        invalidateBrandConfigCache(brandData.slug);

      }

    } catch (err) {

      console.error('[verifyEmail] Error invalidating brand config cache:', err);

    }

  }



async getBrandById(brandId: string): Promise<Brand | null> {
    if (!brandId) return null;

    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .maybeSingle();

    if (error) {
      console.error('[authService.getBrandById] Error:', error);
      return null;
    }

return data as Brand;
  }

  async getBrandByApiKey(apiKey: string): Promise<Brand | null> {

    if (!apiKey) return null;



    if (apiKey.startsWith('ey')) {

      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {

        try {

          const decoded = jwt.verify(apiKey, jwtSecret) as any;

          if (decoded.brand_id && decoded.type === 'embed_session') {

            return await this.getBrandById(decoded.brand_id);

          }

        } catch (e) {

          console.warn('[AuthService] JWT erróneo/expirado en auth:', (e as Error).message);

          return null;

        }

      }

    }



    const { data, error } = await supabaseAdmin

      .from('brands')

      .select('*')

      .eq('api_key', apiKey)

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



    const complexityCheck = validatePasswordComplexity(newPassword);

    if (!complexityCheck.isValid) {

      throw new Error('PASSWORD_TOO_SHORT');

    }



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



    const complexityCheck = validatePasswordComplexity(newPassword);

    if (!complexityCheck.isValid) {

      throw new Error(complexityCheck.message);

    }



    if (newPassword === currentPassword) throw new Error('La nueva contraseña debe ser diferente a la actual');



    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabaseAdmin

      .from('brands')

      .update({ password: hashedPassword })

      .eq('id', brandId);

  }

}

