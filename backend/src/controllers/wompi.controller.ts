import { Request, Response } from 'express';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate } from '../templates/email-templates';
import { supabaseAdmin } from '../config/supabase';

import { pricingService } from '../services/pricing.service';

const subscriptionService = new SubscriptionService();
const notificationService = new NotificationService();
const emailService = new EmailService();

/**
 * WompiController
 *
 * Maneja los webhooks de Wompi y la generación de datos para el widget.
 */
export class WompiController {
  /**
   * POST /api/payments/wompi/webhook
   *
   * Recibe eventos de Wompi (transaction.updated, etc.).
   * Wompi envía el header: x-event-checksum
   *
   * IMPORTANTE: Este endpoint NO requiere autenticación de marca,
   * ya que es llamado directamente por Wompi.
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const checksum = req.headers['x-event-checksum'] as string;

      // El body puede llegar como Buffer (raw) o como objeto (json parseado)
      // app.ts registra express.raw() antes de express.json() para esta ruta
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);

      // Verificar firma HMAC antes de procesar nada
      const firmaValida = await wompiService.verifyWebhookSignature(rawBody, checksum);
      if (!checksum || !firmaValida) {
        // Log detallado para debug
        try {
          const bodyParsed = JSON.parse(rawBody);
          const tx = bodyParsed?.data?.transaction;
          if (tx) {
            console.warn(`[Wompi] Firma inválida. Recibido: ${checksum} | tx.id=${tx.id} tx.status=${tx.status} tx.amount=${tx.amount_in_cents} tx.currency=${tx.currency}`);
          } else {
            console.warn('[Wompi] Firma inválida o ausente. Checksum recibido:', checksum);
          }
        } catch {
          console.warn('[Wompi] Firma inválida o ausente. Checksum recibido:', checksum);
        }
        res.status(401).json({ error: 'Firma inválida' });
        return;
      }

      const event = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;

      // Solo procesar transacciones aprobadas
      if (
        event?.event !== 'transaction.updated' ||
        event?.data?.transaction?.status !== 'APPROVED'
      ) {
        res.status(200).json({ received: true });
        return;
      }

      const transaction = event.data.transaction;
      const reference: string = transaction.reference;
      const amountInCents: number = transaction.amount_in_cents;

      // Extraer brandId de la referencia
      const brandId = wompiService.extractBrandIdFromReference(reference);
      if (!brandId) {
        console.error('[Wompi] Referencia inválida:', reference);
        res.status(200).json({ received: true });
        return;
      }

      // Si el brandId empieza con 'visitor_', es un usuario nuevo sin cuenta aún
      if (brandId.startsWith('visitor_')) {
        // MARCAR REGISTRO COMO PAGADO DE FORMA SEGURA
        const { error: updateError } = await supabaseAdmin
          .from('pending_registrations')
          .update({ 
            status: 'paid', 
            payment_id: transaction.id,
            updated_at: new Date().toISOString()
          })
          .eq('reference', reference);

        if (updateError) {
          console.error('[Wompi] Error al marcar registro como pagado:', updateError.message);
        } else {
          console.log(`[Wompi] Pago de visitante VERIFICADO vía Webhook: ${reference}`);
        }
        res.status(200).json({ received: true });
        return;
      }

      // Extraer meses, plan e incluye_landing de la referencia
      const { months, plan, includesLanding } = wompiService.extractMetaFromReference(reference);

      // Renovar suscripción o activar trial según el monto
      if (amountInCents === 100) {
        // Pago de tokenización de trial (100 COP) — confirmar y enviar email de verificación
        const { data: updatedBrand } = await supabaseAdmin
          .from('brands')
          .update({ trial_payment_status: 'active' })
          .eq('id', brandId)
          .select('id, email, name, email_verification_token, email_verified')
          .single();

        console.log(`[Wompi] Trial activado para brand ${brandId}`);

        // Enviar email de verificación ahora que el pago fue confirmado
        if (updatedBrand && !updatedBrand.email_verified && updatedBrand.email_verification_token) {
          const frontendUrl = (process.env.NODE_ENV === 'development' || !process.env.FRONTEND_URL) ? 'http://localhost:3000' : process.env.FRONTEND_URL;
          const verifyUrl = `${frontendUrl}/auth/verify?token=${updatedBrand.email_verification_token}`;
          emailService.sendEmail({
            to: updatedBrand.email,
            subject: 'Confirma tu correo — Lookitry',
            html: verifyEmailTemplate(
              { name: updatedBrand.name, email: updatedBrand.email },
              verifyUrl
            ),
          }).catch(err => console.error('[Wompi] Error enviando email de verificación post-trial:', err));
        }
      } else {
        const effectivePlan = (plan === 'LANDING' ? 'BASIC' : plan).toUpperCase();
        const activateLanding = plan === 'LANDING' || includesLanding;

        // Si es SOLO compra de landing page (plan='NONE'), no tocamos la suscripción actual
        if (plan === 'NONE') {
          await supabaseAdmin.from('subscription_payments').insert({
            brand_id: brandId,
            amount: amountInCents / 100,
            currency: 'COP',
            payment_date: new Date().toISOString(),
            payment_method: 'wompi',
            status: 'completed',
            months_paid: 0,
            notes: `Pago automático Wompi. SOLO Landing Page. Ref: ${reference}. ID: ${transaction.id}`
          });
          
          if (activateLanding) {
            await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
            console.log(`[Wompi] Mini-landing activada (pago único) para brand ${brandId}`);
          }
        } else {
          // Renovar suscripción normal con meses y plan extraídos de la referencia
          // Si el plan cambió respecto al actual → es un upgrade, resetear fecha desde hoy
          const { data: currentBrand } = await supabaseAdmin
            .from('brands')
            .select('plan')
            .eq('id', brandId)
            .single();

          const isUpgrade = currentBrand?.plan !== effectivePlan;

          await subscriptionService.renewSubscription(
            brandId,
            {
              brand_id: brandId,
              amount: amountInCents / 100,
              currency: 'COP',
              payment_date: new Date().toISOString(),
              payment_method: 'wompi',
              status: 'completed',
              months_paid: months,
              notes: `Pago automático Wompi. Plan: ${effectivePlan}. Meses: ${months}.${activateLanding ? ' Incluye Landing Page.' : ''} Ref: ${reference}. ID: ${transaction.id}`,
            },
            months,
            effectivePlan,
            isUpgrade
          );

          // Si el pago incluía landing, activarla
          if (activateLanding) {
            await supabaseAdmin
              .from('brands')
              .update({ has_landing_page: true, landing_suspended_at: null })
              .eq('id', brandId);
            console.log(`[Wompi] Mini-landing activada junto con plan para brand ${brandId}`);
          }

          console.log(`[Wompi] Suscripción renovada para brand ${brandId} — Plan: ${effectivePlan}, Meses: ${months}`);
        }

        // Enviar email de confirmación de compra
        const { data: updatedBrandForEmail } = await supabaseAdmin
          .from('brands')
          .select('id, email, name, plan, subscription_end_date')
          .eq('id', brandId)
          .single();

        if (updatedBrandForEmail) {
          notificationService.sendRenewalConfirmation(updatedBrandForEmail as any)
            .catch(err => console.error('[Wompi] Error enviando email de confirmación de compra:', err));
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Wompi] Error procesando webhook:', error);
      // Siempre responder 200 a Wompi para evitar reintentos innecesarios
      res.status(200).json({ received: true, error: 'Error interno' });
    }
  }

  /**
   * GET /api/payments/wompi/upgrade-preview
   *
   * Calcula el prorrateo de un upgrade antes de que el usuario pague.
   * Requiere auth (JWT de marca con suscripción activa).
   *
   * Query params: newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotal
   */
  async getUpgradePreview(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'Autenticación requerida' });
        return;
      }

      const { newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotal } = req.query;

      if (!newPlan || !newMonths || !newPlanPricePerMonth || !currentPlanPriceTotal) {
        res.status(400).json({ error: 'Parámetros requeridos: newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotal' });
        return;
      }

      const preview = await subscriptionService.calculateUpgradeProration(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        parseInt(newPlanPricePerMonth as string, 10),
        parseInt(currentPlanPriceTotal as string, 10)
      );

      res.json(preview);
    } catch (error) {
      console.error('[Wompi] Error calculando upgrade preview:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * POST /api/payments/wompi/apply-free-upgrade
   *
   * Aplica un upgrade gratuito cuando el crédito cubre el costo total del nuevo plan.
   * Requiere auth (JWT de marca).
   *
   * Body: { newPlan, newMonths, creditAmount, newPlanTotal }
   */
  async applyFreeUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'Autenticación requerida' });
        return;
      }

      const { newPlan, newMonths, creditAmount, newPlanTotal } = req.body;

      if (!newPlan || !newMonths || creditAmount === undefined || newPlanTotal === undefined) {
        res.status(400).json({ error: 'Parámetros requeridos: newPlan, newMonths, creditAmount, newPlanTotal' });
        return;
      }

      // Re-calcular para verificar que efectivamente es gratuito (evitar manipulación)
      const preview = await subscriptionService.calculateUpgradeProration(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        Math.round(parseInt(newPlanTotal as string, 10) / parseInt(newMonths as string, 10)),
        parseInt(creditAmount as string, 10) + parseInt(newPlanTotal as string, 10) // reconstruir currentPlanPriceTotal
      );

      if (!preview.isFree) {
        res.status(400).json({ error: 'Este upgrade requiere pago', amountToPay: preview.amountToPay });
        return;
      }

      const reference = wompiService.generateReference(brand.id, parseInt(newMonths as string, 10), newPlan as string);
      const updatedBrand = await subscriptionService.applyFreeUpgrade(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        parseInt(creditAmount as string, 10),
        parseInt(newPlanTotal as string, 10),
        reference
      );

      res.json({ success: true, brand: updatedBrand });
    } catch (error) {
      console.error('[Wompi] Error aplicando free upgrade:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * POST /api/payments/wompi/free-checkout
   *
   * Activa servicios directamente cuando el total es $0 (cupón del 100%).
   * Auth opcional: si hay JWT aplica a la marca, sino crea pending_registration.
   */
  async freeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { plan, months, includes_landing, reference, email } = req.body;

      if (!plan || months === undefined) {
        res.status(400).json({ error: 'Parámetros plan y months son requeridos' });
        return;
      }

      const effectivePlan = plan === 'LANDING' ? 'BASIC' : plan;
      const activateLanding = plan === 'LANDING' || includes_landing === true;

      // ── FLUJO VISITANTE SIN SESIÓN (NUEVO) ──────────────────────────────
      if (!brand?.id) {
        if (!email) {
          res.status(400).json({ error: 'Email requerido para usar cupón sin cuenta' });
          return;
        }

        const visitorBrandId = `visitor_${Date.now()}`;
        const newRef = reference || wompiService.generateReference(visitorBrandId, months, effectivePlan);

        const { error: insertError } = await supabaseAdmin
          .from('pending_registrations')
          .insert({
            email,
            reference: newRef,
            plan: effectivePlan,
            months: months,
            includes_landing: activateLanding,
            status: 'paid', // Marcamos de una vez como 'pagado' porque es 100% cupón
            payment_id: 'coupon_100_free_checkout',
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('[FreeCheckout] Error guardando registro pendiente:', insertError);
          res.status(500).json({ error: 'Error interno al generar registro temporal' });
          return;
        }

        console.log(`[FreeCheckout] Visitante con 100% descuento registrado. Ref: ${newRef}`);
        res.json({ success: true, isVisitor: true, reference: newRef });
        return;
      }

      // ── FLUJO USUARIO CON SESIÓN ACTIVA ──────────────────────────────────
      const brandId = brand.id;
      console.log(`[FreeCheckout] Activando servicios gratuitos para brand ${brandId}. Plan: ${effectivePlan}, Meses: ${months}, Landing: ${activateLanding}`);

      if (effectivePlan !== 'NONE') {
        const { data: currentBrand } = await supabaseAdmin
          .from('brands')
          .select('plan')
          .eq('id', brandId)
          .single();

        const isUpgrade = currentBrand?.plan !== effectivePlan.toUpperCase();

        await subscriptionService.renewSubscription(
          brandId,
          {
            brand_id: brandId,
            amount: 0,
            currency: 'COP',
            payment_date: new Date().toISOString(),
            payment_method: 'coupon_100',
            status: 'completed',
            months_paid: months,
            notes: `Activación gratuita (Cupón 100%). Plan: ${effectivePlan}. Ref: ${reference || 'FREE-' + Date.now()}`,
          },
          months,
          effectivePlan.toUpperCase(),
          isUpgrade
        );
      } else {
        // Solo landing gratuita
        await supabaseAdmin.from('subscription_payments').insert({
          brand_id: brandId,
          amount: 0,
          currency: 'COP',
          payment_date: new Date().toISOString(),
          payment_method: 'coupon_100',
          status: 'completed',
          months_paid: 0,
          notes: `Activación gratuita (Cupón 100%). SOLO Landing Page. Ref: ${reference || 'FREE-' + Date.now()}`
        });
      }

      if (activateLanding) {
        await supabaseAdmin
          .from('brands')
          .update({ has_landing_page: true, landing_suspended_at: null })
          .eq('id', brandId);
      }

      // Enviar email de confirmación
      const { data: updatedBrand } = await supabaseAdmin
        .from('brands')
        .select('id, email, name, plan, subscription_end_date')
        .eq('id', brandId)
        .single();

      if (updatedBrand) {
        notificationService.sendRenewalConfirmation(updatedBrand as any).catch(() => {});
      }

      res.json({ success: true, message: 'Servicios activados correctamente' });
    } catch (error: any) {
      console.error('[FreeCheckout] Error:', error);
      res.status(500).json({ error: error.message || 'Error al procesar la activación gratuita' });
    }
  }

  /**
   * GET /api/payments/wompi/config
   *
   * Retorna la configuración pública del widget de Wompi para el frontend.
   */
  async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { plan, months } = req.query;

      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const isLandingPurchase = (req.query.includes_landing as string) === 'true';

      // RECALCULAR MONTO EN BACKEND (SEGURIDAD)
      const amountCOP = await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase);

      const brandId = brand?.id ?? `visitor_${Date.now()}`;

      // Pasar months y plan para que la referencia los incluya y el webhook los pueda extraer
      const config = await wompiService.getWidgetConfig(brandId, amountCOP, monthsNum, planStr, isLandingPurchase);
      const signature = await wompiService.generateIntegritySignature(
        config.reference,
        config.amountInCents,
        config.currency
      );

      res.json({ ...config, signature });
    } catch (error) {
      console.error('[Wompi] Error generando config:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * GET /api/payments/wompi/transaction/:id
   * 
   * Retorna la información de una transacción (como la referencia) por su ID.
   */
  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'ID requerido' });
        return;
      }
      const tx = await wompiService.getTransactionById(id as string);
      if (!tx) {
        res.status(404).json({ error: 'Transacción no encontrada' });
        return;
      }
      res.json(tx);
    } catch (error) {
      console.error('[Wompi] Error en getTransaction:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  /**
   * GET /api/payments/wompi/checkout-url
   *
   * Genera y retorna la URL del checkout hosted de Wompi.
   * El frontend redirige al usuario a esa URL — Wompi maneja todo el flujo.
   * Auth opcional: si hay token válido se usa el brandId real, si no se usa un ID temporal.
   *
   * Query params: amount, months, plan, email (opcional, solo para usuarios sin sesión)
   */
  async getCheckoutUrl(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { months, plan } = req.query;
      const email = req.query.email as string | undefined;

      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const isLandingPurchase = (req.query.includes_landing as string) === 'true';

      // RECALCULAR MONTO EN BACKEND (SEGURIDAD)
      const amountCOP = await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase);

      const brandId = brand?.id ?? `visitor_${Date.now()}`;

      // Generar la referencia antes de llamar al servicio para poder guardarla en pending_registrations
      const reference = wompiService.generateReference(brandId, monthsNum, planStr, isLandingPurchase);

      const frontendUrl = (process.env.NODE_ENV === 'development' || !process.env.FRONTEND_URL) ? 'http://localhost:3000' : process.env.FRONTEND_URL;
      let successPath: string;

      if (!brand?.id && email) {
        // Usuario sin sesión con email → guardar pending_registration
        const { error: insertError } = await supabaseAdmin
          .from('pending_registrations')
          .insert({ email, reference, plan: planStr, months: monthsNum, includes_landing: isLandingPurchase });

        if (insertError) {
          console.error('[Wompi] Error al guardar pending_registration:', insertError);
          res.status(500).json({ error: 'Error al guardar el registro pendiente' });
          return;
        }

        // Incluir la referencia en la URL de redirect para que /registro-pro la reciba
        successPath = `/registro-pro?ref=${reference}`;
      } else if (!brand?.id) {
        // Usuario sin sesión sin email → flujo legacy
        successPath = `/registro-pro?plan=${planStr}&months=${monthsNum}`;
      } else {
        // Usuario con sesión → flujo actual
        successPath = `/pago-exitoso?plan=${planStr}&months=${monthsNum}`;
      }

      const redirectUrl = `${frontendUrl}${successPath}`;

      // Pasar la referencia pre-generada para que la URL de Wompi use la misma referencia
      const checkoutUrl = await wompiService.getCheckoutUrl(brandId, amountCOP, redirectUrl, false, monthsNum, planStr, reference);

      res.json({ checkoutUrl });
    } catch (error) {
      console.error('[Wompi] Error generando checkout URL:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
