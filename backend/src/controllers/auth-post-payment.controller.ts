import { Request, Response } from 'express';

import { AuthService } from '../services/auth.service';

import { EmailService } from '../services/email.service';

import { SubscriptionService } from '../services/subscription.service';

import { verifyEmailTemplate } from '../templates/email-templates';

import { supabaseAdmin } from '../config/supabase';

import { wompiService } from '../services/wompi.service';

import { paypalService } from '../services/paypal.service';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth';
import { isTrialLandingBlocked } from '../utils/brandLifecycle';

import { sanitizeError } from '../utils/sanitizeError';


const authService = new AuthService();

const emailService = new EmailService();

const subscriptionService = new SubscriptionService();



const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;



function setCookieToken(res: Response, token: string): void {
  const cookieOptions: any = {

    httpOnly: true,

    secure: IS_PROD,

    sameSite: IS_PROD ? 'none' : 'lax',

    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días

    path: '/',

  };



  if (COOKIE_DOMAIN && IS_PROD) {

    cookieOptions.domain = COOKIE_DOMAIN;

  }



  res.cookie('token', token, cookieOptions);
}

function isVisitorRegistrationReference(reference: string): boolean {
  return /^PAYPAL-visitor_/i.test(reference)
    || /^TRYON-visitor_/i.test(reference)
    || /^FREE-visitor_/i.test(reference)
    || /^GUEST-TRIAL-visitor_/i.test(reference)
    || /^TRIAL-visitor_/i.test(reference);
}

/**
 * Registro exclusivo para el flujo post-pago.
 * Soporta Wompi y PayPal.

 */

export async function registerPostPayment(req: AuthRequest, res: Response) {

  try {

    const { contact_name, name, slug, password, ref: bodyRef, reference, fingerprint, method, orderId, customSuffix } = req.body;

    const ref = bodyRef || reference;



    // 1. Validar que ref esté presente

    if (!ref) {

      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La referencia de pago es requerida' });

    }



    // 2. Validaciones de campos del formulario

    if (!password || !name || !slug) {

      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Todos los campos son requeridos' });

    }



    // 3. Buscar pending_registration por referencia

    const { data: pending, error: pendingError } = await supabaseAdmin

      .from('pending_registrations')

      .select('email, plan, months, includes_landing, status, payment_id') // Añadimos status, payment_id

      .eq('reference', ref)

      .maybeSingle();



    if (pendingError || !pending) {

      return res.status(404).json({ error: 'NOT_FOUND', message: 'Referencia de pago no encontrada' });

    }



    // 4. Verificar estado de la transacción según el método

    const pendingStatus = String(pending.status || '').toLowerCase();

    let paymentConfirmed = pendingStatus === 'paid' || pendingStatus === 'confirmed';
    let finalMethod = method || 'wompi';
    let transactionDetails = pending.payment_id ? `ID guardado: ${pending.payment_id}` : '';
    let paymentAmount = 0; // Guardará el monto total de la pasarela

    if (!paymentConfirmed) {

      if (finalMethod === 'paypal') {
        if (!orderId) {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ID de orden de PayPal requerido' });
        }
        try {
          const order = await paypalService.getOrder(orderId);
          const resolvedReference = paypalService.extractReference(order);
          if (!resolvedReference || resolvedReference !== ref) {
            return res.status(409).json({ error: 'VALIDATION_ERROR', message: 'La orden de PayPal no coincide con la referencia' });
          }

          const trackedOrder = await paypalService.getTrackedOrder(ref);
          if (!trackedOrder) {
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Orden PayPal no encontrada para esta referencia' });
          }

          const orderAmount = paypalService.extractAmountUsd(order);
          if (orderAmount == null || Math.abs(Number(trackedOrder.amount_usd_expected) - orderAmount) > 0.01) {
            return res.status(409).json({ error: 'VALIDATION_ERROR', message: 'El monto de la orden de PayPal no coincide con el esperado' });
          }

          if (order.status === 'APPROVED') {
            const capture = await paypalService.captureOrder(orderId);
            paymentConfirmed = capture.status === 'COMPLETED';
          } else {
            paymentConfirmed = order.status === 'COMPLETED';
          }
          paymentAmount = orderAmount;
          transactionDetails = `PayPal Order: ${orderId}`;
        } catch (err: any) {
          console.error('[PostPayment] PayPal Error:', err.message);
          return res.status(502).json({ error: 'GATEWAY_ERROR', message: 'Error al verificar con PayPal' });
        }
      } else {

        // Por defecto Wompi

        try {

          const transaction = await wompiService.getTransactionByReference(ref);

          paymentConfirmed = transaction?.status === 'APPROVED';

          if (transaction?.amount_in_cents) {

            paymentAmount = (transaction.amount_in_cents || 0) / 100;

          }

          transactionDetails = `Wompi Ref: ${ref}`;

        } catch {

          return res.status(502).json({ error: 'GATEWAY_ERROR', message: 'Error al verificar con Wompi' });

        }

      }

    } else {
       // El estado era "paid" (puede ser un cupón de freeCheckout 100% o validado por webhook en diferido)
       // Tratamos de extraer el monto real si existía un payment_id de Wompi válido
       if (pending.payment_id && pending.payment_id !== 'coupon_100_free_checkout' && finalMethod === 'wompi') {
         try {

           const transaction = await wompiService.getTransactionById(pending.payment_id);

           if (transaction && 'amount_in_cents' in transaction) {

             paymentAmount = ((transaction as any).amount_in_cents || 0) / 100;

           }

         } catch(err) {

           console.error('[PostPayment] Podría no encontrar Wompi ID:', err);
         }
       }
       if (finalMethod === 'paypal') {
         try {
           const trackedOrder = await paypalService.getTrackedOrder(ref);
           if (trackedOrder) {
             paymentAmount = Number(trackedOrder.amount_usd_expected || 0);
             transactionDetails = `PayPal Order: ${trackedOrder.order_id || pending.payment_id || 'N/A'}`;
           }
         } catch (err) {
           console.error('[PostPayment] No se pudo recuperar paypal_orders:', err);
         }
       }
    }


    if (!paymentConfirmed) {

      return res.status(402).json({ error: 'PAYMENT_REQUIRED', message: 'El pago no ha sido confirmado aún' });

    }


    if (pending.includes_landing && String(pending.plan || '').toUpperCase() === 'NONE') {
      return res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
    }


    // 5. Crear la cuenta o Usar la existente si hay sesión

    let result: any;
    let shouldActivateSubscription = true;
    const pendingEmail = String(pending.email || '').trim().toLowerCase();
    const sessionEmail = String(req.brand?.email || '').trim().toLowerCase();
    const hasSessionEmailMismatch = Boolean(req.brand?.id && pendingEmail && sessionEmail && pendingEmail !== sessionEmail);
    const shouldIgnoreExistingSession = isVisitorRegistrationReference(ref) || hasSessionEmailMismatch;
    const existingBrandId = shouldIgnoreExistingSession ? undefined : req.brand?.id;

    if (shouldIgnoreExistingSession && req.brand?.id) {
      console.warn(
        `[PostPayment] Ignorando sesión activa para referencia ${ref}. sessionBrand=${req.brand.id} pendingEmail=${pending.email}`
      );
    }

    if (existingBrandId) {
      // 5.1 Si el usuario ya está logueado, la activación se hace una sola vez en renewSubscription
      const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', existingBrandId).single();
      if (pending.includes_landing && currentBrand && isTrialLandingBlocked(currentBrand) && String(pending.plan || '').toUpperCase() === 'NONE') {
        return res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
      }
      
      result = {
        token: req.headers.authorization?.split(' ')[1] || (req as any).cookies?.token, // Mantener token actual
        brand: {
          id: currentBrand.id,
          email: currentBrand.email,
          name: currentBrand.name,
          slug: currentBrand.slug,
          plan: currentBrand.plan,
          has_landing_page: currentBrand.has_landing_page
        }
      };
      
      console.log(`[PostPayment] Pago vinculado a sesión activa: ${currentBrand.email}`);

    } else {

      // 5.2 Si no hay sesión, crear la cuenta (vía registerPostPayment del servicio que es más robusto)

      // SECURITY: Always use the email from pending_registrations â never allow override.

      // The email was set durante checkout and must match the payment.

      const emailToUse = pending.email;



      // Generar slug único con sufijo personalizado si se proporciona

      let finalSlug: string;

      try {

        finalSlug = await generateUniqueSlug(slug, customSuffix);

      } catch (error: any) {

        console.error('[PostPayment] Error generando slug único:', error);

        return res.status(400).json({ error: 'SLUG_GENERATION_ERROR', message: error.message || 'Error al generar el slug único' });

      }



      result = await authService.registerPostPayment({

        contact_name: contact_name || name,

        name,

        slug: finalSlug,

        email: emailToUse,

        password,

        ref,

        fingerprint: fingerprint || undefined,

      });


      // Email de bienvenida solo para nuevos
      notificationService.sendWelcomeEmail(result.brand as any, true).catch(err => {
        console.error('[PostPayment] Error enviando email de bienvenida:', err);
      });

      // registerPostPayment ya crea la suscripción y registra el pago una vez
      shouldActivateSubscription = false;
    }

    const targetBrandId = result.brand.id;
    // 6. Activar suscripción
    if (shouldActivateSubscription) {
      try {
      await subscriptionService.renewSubscription(
        targetBrandId,
        {
          brand_id: targetBrandId,
          amount: paymentAmount, // Pasamos el monto real que el usuario pagó
          currency: finalMethod === 'paypal' ? 'USD' : 'COP',

          payment_method: finalMethod,

          status: 'completed',

          months_paid: pending.months,

          payment_date: new Date().toISOString(),

          notes: `Activación post-registro. Plan: ${pending.plan}. Meses: ${pending.months}.${pending.includes_landing ? ' Incluye Landing Page.' : ''} ${transactionDetails}`,

          reference: ref,

        },

        pending.months,
        pending.plan
      );

        if (pending.includes_landing) {
          await supabaseAdmin
            .from('brands')
            .update({ has_landing_page: true, landing_suspended_at: null })
            .eq('id', result.brand.id);
          
          // Sincronizar el objeto brand retornado para el frontend
          (result.brand as any).has_landing_page = true;
          (result.brand as any).landing_suspended_at = null;

          // Notificar al cliente que su landing está activa
          notificationService.sendLandingActivatedEmail(result.brand as any).catch(err => {
            console.error('[PostPayment] Error enviando email de activación de landing:', err);
          });
        }

        const { data: updatedBrand } = await supabaseAdmin.from('brands').select('*').eq('id', result.brand.id).single();
        if (updatedBrand) {
          result.brand = {
            ...result.brand,
            id: updatedBrand.id,
            email: updatedBrand.email,
            name: updatedBrand.name,
            slug: updatedBrand.slug,
            plan: updatedBrand.plan,
            has_landing_page: updatedBrand.has_landing_page,
          };
        }
      } catch (subError) {
        console.error('[PostPayment] Error activando suscripción:', subError);
      }
    }


    // 7. Email de verificación

    if (result.verificationToken) {

      const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://lookitry.com');

      const verifyUrl = `${frontendUrl}/auth/verify?token=${result.verificationToken}`;

      emailService.sendEmail({

        to: pending.email,

        subject: 'Confirma tu correo â Lookitry',

        html: verifyEmailTemplate({ name: result.brand.name, email: pending.email }, verifyUrl),

      }).catch(err => console.error('[PostPayment] Error enviando email:', err));

    }



    if (result.token) {

      setCookieToken(res, result.token);

    }



    return res.status(201).json(result);

  } catch (error: any) {

    console.error('[PostPayment] Error en registro:', error);

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al crear la cuenta') });

  }

}



function normalizeSlugPart(part: string): string {

  return part

    .toLowerCase()

    .replace(/\s+/g, '-')

    .replace(/[^a-z0-9-]/g, '')

    .replace(/-+/g, '-')

    .replace(/^-|-$/g, '');

}



function ensureSlugLength(slug: string, maxLength: number = 50): string {

  if (slug.length <= maxLength) return slug;

  // Truncar manteniendo la parte más importante (inicio) y eliminando desde el final

  // Pero también debemos asegurar que no termine con guion

  let truncated = slug.substring(0, maxLength);

  // Si el último carácter es guion, eliminarlo

  if (truncated.endsWith('-')) {

    truncated = truncated.substring(0, truncated.length - 1);

  }

  return truncated;

}



async function generateUniqueSlug(baseSlug: string, customSuffix?: string): Promise<string> {

  // Normalizar baseSlug y limitar longitud base para dejar espacio para sufijos

  let normalizedBase = normalizeSlugPart(baseSlug);

  if (!normalizedBase) {

    throw new Error('Slug base inválido');

  }

  // Truncar base a 30 caracteres para dejar espacio para sufijos (max total 50)

  normalizedBase = ensureSlugLength(normalizedBase, 30);



  let candidate = normalizedBase;

  

  // Aplicar sufijo personalizado si existe

  if (customSuffix && customSuffix.trim() !== '') {

    let normalizedSuffix = normalizeSlugPart(customSuffix.trim());

    if (normalizedSuffix) {

      // Limitar sufijo a 15 caracteres

      normalizedSuffix = ensureSlugLength(normalizedSuffix, 15);

      candidate = `${normalizedBase}-${normalizedSuffix}`;

    }

  }



  // Asegurar longitud máxima total de 50 antes de verificar existencia

  candidate = ensureSlugLength(candidate, 50);



  // Función auxiliar para verificar existencia de slug

  async function slugExists(slug: string): Promise<boolean> {

    const { data } = await supabaseAdmin

      .from('brands')

      .select('id')

      .eq('slug', slug)

      .maybeSingle();

    return !!data;

  }



  // Verificar si el candidato ya existe

  if (!(await slugExists(candidate))) {

    return candidate;

  }



  // Si existe, agregar número aleatorio 100-999

  const randomSuffix = Math.floor(100 + Math.random() * 900);

  let candidateWithRandom = `${candidate}-${randomSuffix}`;

  candidateWithRandom = ensureSlugLength(candidateWithRandom, 50);

  

  if (!(await slugExists(candidateWithRandom))) {

    return candidateWithRandom;

  }



  // Si aún existe (colisión extrema), agregar timestamp de 6 dígitos

  const timestamp = Date.now().toString().slice(-6);

  let candidateWithTimestamp = `${candidateWithRandom}-${timestamp}`;

  candidateWithTimestamp = ensureSlugLength(candidateWithTimestamp, 50);

  

  // Si después del timestamp sigue existiendo (casi imposible), devolver con timestamp único

  return candidateWithTimestamp;

}



/**

 * Consulta los datos de la cuenta pendiente por su referencia.

 */

export async function getPendingRegistration(req: Request, res: Response) {

  try {

    const { ref } = req.params;

    if (!ref) {

      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La referencia de pago es requerida' });

    }



    const { data: pending, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('email, brand_name, plan, months, includes_landing, status')
      .eq('reference', ref)
      .maybeSingle();


    if (error || !pending) {

      return res.status(404).json({ error: 'NOT_FOUND', message: 'Referencia de pago no encontrada' });

    }



    let resolvedPending = pending;
    const currentStatus = String(pending.status || '').toLowerCase();

    // Autocuración: si Wompi ya aprobó el pago pero el webhook todavía no actualizó
    // pending_registrations, resolvemos el desfase al consultar por referencia.
    if (
      currentStatus !== 'paid' &&
      currentStatus !== 'confirmed' &&
      currentStatus !== 'used' &&
      (ref.startsWith('TRYON-') || ref.startsWith('TRIAL-'))
    ) {
      try {
        const transaction = await wompiService.getTransactionByReference(ref);
        if (transaction?.status === 'APPROVED') {
          const { error: syncError } = await supabaseAdmin
            .from('pending_registrations')
            .update({
              status: 'paid',
              payment_id: transaction.id,
              updated_at: new Date().toISOString(),
            })
            .eq('reference', ref);

          if (syncError) {
            console.error('[PostPayment] No se pudo sincronizar referencia pagada:', syncError);
          } else {
            resolvedPending = {
              ...pending,
              status: 'paid',
            } as typeof pending;
          }
        }
      } catch (syncErr) {
        console.error('[PostPayment] Error autocorrigiendo estado pendiente:', syncErr);
      }
    }

    // Compat: normalizar estado legacy "confirmed" a "paid" para el frontend
    const normalized = {
      ...resolvedPending,
      reference: ref,
      normalized_reference: ref,
    } as any;
    if (String(normalized.status || '').toLowerCase() === 'confirmed') {

      normalized.status = 'paid';

    }



    return res.status(200).json(normalized);

  } catch (err: any) {

    console.error('[PostPayment] Error obteniendo referencia:', err);

    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor' });

  }

}

