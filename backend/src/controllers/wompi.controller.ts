import { Request, Response } from 'express';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import { verifyEmailTemplate } from '../templates/email-templates';
import { supabaseAdmin } from '../config/supabase';

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
        // Verificar si existe en pending_registrations
        const { data: pending } = await supabaseAdmin
          .from('pending_registrations')
          .select('id')
          .eq('reference', reference)
          .maybeSingle();

        if (pending) {
          console.log('[Wompi] Pending sin marca, ignorando activación:', reference);
        } else {
          console.warn('[Wompi] Referencia visitor_ sin pending conocido:', reference);
        }
        res.status(200).json({ received: true });
        return;
      }

      // Extraer meses y plan de la referencia
      const { months, plan } = wompiService.extractMetaFromReference(reference);

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
        // (no se envió en el registro para evitar la brecha de seguridad)
        if (updatedBrand && !updatedBrand.email_verified && updatedBrand.email_verification_token) {
          const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
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
        // Determinar si incluye activación de landing (plan LANDING en referencia legacy)
        // En el nuevo formato, plan ya viene como BASIC o PRO (el subPlan del checkout)
        // La activación de landing se detecta por el monto: landing_price + sub_price
        // Por simplicidad, si el plan en la referencia es LANDING, activar landing + BASIC
        const effectivePlan = plan === 'LANDING' ? 'BASIC' : plan;
        const activateLanding = plan === 'LANDING';

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
            notes: `Pago automático Wompi. Plan: ${effectivePlan}. Meses: ${months}. Ref: ${reference}. ID: ${transaction.id}`,
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
          console.log(`[Wompi] Mini-landing activada para brand ${brandId}`);
        }

        console.log(`[Wompi] Suscripción renovada para brand ${brandId} — Plan: ${effectivePlan}, Meses: ${months}`);

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
   * GET /api/payments/wompi/config
   *
   * Retorna la configuración pública del widget de Wompi para el frontend.
   */
  async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { plan, amount, months } = req.query;

      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const planAmounts: Record<string, number> = { BASIC: 150000, PRO: 250000 };
      const amountCOP = amount
        ? parseInt(amount as string, 10)
        : planAmounts[planStr] ?? 150000;

      const brandId = brand?.id ?? `visitor_${Date.now()}`;
      // Pasar months y plan para que la referencia los incluya y el webhook los pueda extraer
      const config = await wompiService.getWidgetConfig(brandId, amountCOP, monthsNum, planStr);
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
      const { amount, months, plan } = req.query;
      const email = req.query.email as string | undefined;

      const amountCOP = amount ? parseInt(amount as string, 10) : 250000;
      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const isLandingPurchase = (req.query.includes_landing as string) === 'true';

      const brandId = brand?.id ?? `visitor_${Date.now()}`;

      // Generar la referencia antes de llamar al servicio para poder guardarla en pending_registrations
      const reference = wompiService.generateReference(brandId, monthsNum, planStr);

      const frontendUrl = process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com';
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
