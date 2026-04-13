import { Request, Response } from 'express';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import { pricingService } from '../services/pricing.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { addonCreditsService } from '../services/addonCredits.service';
import { planChangeService } from '../services/planChange.service';
import { supabaseAdmin } from '../config/supabase';
import { verifyEmailTemplate } from '../templates/email-templates';
import { hasActivePaidSubscription, isTrialLandingBlocked } from '../utils/brandLifecycle';

const subscriptionService = new SubscriptionService();
const emailService = new EmailService();
const notificationService = new NotificationService();

export class WompiController {
  /**
   * Helper para insertar logs de pago
   */
  private async insertPaymentLog(params: {
    eventType: string;
    reference: string;
    brandId?: string | null;
    transactionId?: string | null;
    amountCents?: number | null;
    status: string;
    payload?: Record<string, unknown>;
    errorMessage?: string | null;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await supabaseAdmin.from('payment_logs').insert({
        event_type: params.eventType,
        gateway: 'wompi',
        reference: params.reference,
        brand_id: params.brandId || null,
        transaction_id: params.transactionId || null,
        amount_cents: params.amountCents || null,
        currency: 'COP',
        status: params.status,
        payload: params.payload || null,
        processed_at: new Date().toISOString(),
        error_message: params.errorMessage || null,
        ip_address: params.ipAddress || null,
      });
    } catch (logError) {
      console.warn('[Wompi] Error insertando payment_log:', logError);
    }
  }

  /**
   * POST /api/payments/wompi/webhook
   * Recibe eventos de Wompi (transaction.updated, etc.).
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || null;
    
    try {
      const checksum = req.headers['x-event-checksum'] as string;
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : (typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body));

      console.log(`[Wompi Webhook] Recibido. Checksum: ${checksum || 'NINGUNO'}. Body length: ${rawBody.length}`);

      // Intentar parsear para logging inicial (antes de validar firma)
      let eventData: Record<string, unknown> = {};
      try {
        eventData = JSON.parse(rawBody);
      } catch {}

      // Log evento recibido (sin firma validada aún)
      const referenceForLog = (eventData as any)?.data?.transaction?.reference || 'UNKNOWN';
      await this.insertPaymentLog({
        eventType: 'webhook_received',
        reference: referenceForLog,
        status: 'received',
        payload: {
          event: (eventData as any)?.event,
          checksumPresent: !!checksum,
          bodyLength: rawBody.length,
          signatureStatus: 'pending_validation',
        },
        ipAddress,
      });

      const firmaValida = await wompiService.verifyWebhookSignature(rawBody, checksum);

      if (!checksum || !firmaValida) {
        console.warn(`[Wompi] Firma inválida detectada para checksum: ${checksum}`);
        await this.insertPaymentLog({
          eventType: 'webhook_received',
          reference: referenceForLog,
          status: 'signature_invalid',
          payload: { checksumPresent: !!checksum },
          errorMessage: 'Firma HMAC inválida',
          ipAddress,
        });
        res.status(401).json({ error: 'Firma inválida' });
        return;
      }

      const event = (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) ? req.body : JSON.parse(rawBody);

      if (event?.event !== 'transaction.updated' || event?.data?.transaction?.status !== 'APPROVED') {
        // Log evento ignorado (no es APPROVED)
        await this.insertPaymentLog({
          eventType: 'webhook_ignored',
          reference: (event as any)?.data?.transaction?.reference || 'UNKNOWN',
          status: 'ignored',
          payload: {
            event: event?.event,
            transactionStatus: (event as any)?.data?.transaction?.status,
          },
          ipAddress,
        });
        res.status(200).json({ received: true });
        return;
      }

      const transaction = event.data.transaction;
      const reference: string = transaction.reference;
      const amountInCents: number = transaction.amount_in_cents;

      // ── VALIDACIÓN DE MONTO CONTRA BD ──────────────────────────────────────────
      // Verificar que el monto pagado coincida con el monto esperado (tolerancia 2%)
      if (!addonCreditsService.isAddonReference(reference)) {
        const { data: pendingRegistration } = await supabaseAdmin
          .from('pending_registrations')
          .select('amount, plan')
          .eq('reference', reference)
          .maybeSingle();

        if (pendingRegistration?.amount) {
          const expectedAmountCents = Number(pendingRegistration.amount) * 100;
          const tolerance = Math.max(expectedAmountCents * 0.02, 50); // 2% o min 50 centavos
          if (Math.abs(amountInCents - expectedAmountCents) > tolerance) {
            console.error('[Wompi] Monto no coincide:', { expected: expectedAmountCents, received: amountInCents });
            await this.insertPaymentLog({
              eventType: 'payment_approved',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              status: 'failed',
              errorMessage: `Monto no coincide: esperado=${expectedAmountCents} recibido=${amountInCents}`,
              ipAddress,
            });
            res.status(200).json({ received: true });
            return;
          }
        }
      }

      // Log transacción APPROVED recibida
      await this.insertPaymentLog({
        eventType: 'payment_approved',
        reference,
        transactionId: transaction.id,
        amountCents: amountInCents,
        status: 'processing',
        payload: {
          event: event.event,
          transactionStatus: transaction.status,
          paymentMethod: (transaction as any).payment_method,
          paymentMethodType: (transaction as any).payment_method_type,
        },
        ipAddress,
      });

      if (addonCreditsService.isAddonReference(reference)) {
        await addonCreditsService.applyPurchasedCredits(
          reference,
          'wompi',
          amountInCents / 100,
          String(transaction.id)
        );
        await this.insertPaymentLog({
          eventType: 'addon_credits_applied',
          reference,
          transactionId: transaction.id,
          amountCents: amountInCents,
          status: 'completed',
          ipAddress,
        });
        res.status(200).json({ received: true });
        return;
      }

      const brandId = wompiService.extractBrandIdFromReference(reference);
      if (!brandId) {
        console.error('[Wompi] Referencia inválida:', reference);
        await this.insertPaymentLog({
          eventType: 'payment_approved',
          reference,
          transactionId: transaction.id,
          amountCents: amountInCents,
          status: 'failed',
          errorMessage: 'Referencia inválida - no se pudo extraer brandId',
          ipAddress,
        });
        res.status(200).json({ received: true });
        return;
      }

      // ── BLOQUE DE IDEMPOTENCIA ──────────────────────────────────────────────
      // Check temprano: si ya procesamos este pago, responder 200 sin re-procesar.
      // Cubre: subscription_payments completadas, TRIAL activo, plan_changes completados.
      const idempotency = await wompiService.checkIdempotency(reference, brandId);
      if (idempotency.alreadyProcessed) {
        console.log(`[Wompi] Idempotencia: pago ya procesado (${idempotency.reason}). Ref=${reference}`);
        await this.insertPaymentLog({
          eventType: 'idempotency_detected',
          reference,
          transactionId: transaction.id,
          amountCents: amountInCents,
          brandId,
          status: 'ignored',
          payload: { reason: idempotency.reason, existingPaymentId: idempotency.existingPaymentId },
          ipAddress,
        });
        res.status(200).json({ received: true });
        return;
      }
      // ── FIN BLOQUE IDEMPOTENCIA ──────────────────────────────────────────────

      if (brandId.startsWith('visitor_') || brandId.startsWith('GUEST') || brandId.startsWith('FREE')) {
        const { data: pendingRegistration } = await supabaseAdmin
          .from('pending_registrations')
          .select('email, reference, plan, amount, status')
          .eq('reference', reference)
          .maybeSingle();

        const wasPending = pendingRegistration?.status === 'pending';

        const { error: updateError } = await supabaseAdmin
          .from('pending_registrations')
          .update({ 
            status: 'paid', 
            payment_id: transaction.id,
            updated_at: new Date().toISOString()
          })
          .eq('reference', reference);

        if (updateError) {
          console.error('[Wompi] Error al marcar registro:', updateError.message);
          await this.insertPaymentLog({
            eventType: 'visitor_registration_update_failed',
            reference,
            transactionId: transaction.id,
            amountCents: amountInCents,
            status: 'failed',
            errorMessage: updateError.message,
            ipAddress,
          });
        }

        if (!updateError && wasPending && pendingRegistration?.email && ['BASIC', 'PRO'].includes((pendingRegistration.plan || '').toUpperCase())) {
          notificationService.sendCompleteRegistrationEmail({
            email: pendingRegistration.email,
            reference: pendingRegistration.reference,
            plan: pendingRegistration.plan,
            amount: pendingRegistration.amount,
          }).catch(err => console.error('[Wompi] Error email registro pendiente:', err));
        }

        await this.insertPaymentLog({
          eventType: wasPending ? 'visitor_registration_completed' : 'visitor_registration_already_paid',
          reference,
          transactionId: transaction.id,
          amountCents: amountInCents,
          brandId,
          status: 'completed',
          payload: {
            email: pendingRegistration?.email,
            plan: pendingRegistration?.plan,
            wasPending,
          },
          ipAddress,
        });

        res.status(200).json({ received: true });
        return;
      }

      const { months, plan, includesLanding } = wompiService.extractMetaFromReference(reference);

      if (reference.startsWith('TRIAL-')) {
        const { data: updatedBrand, error: updateError } = await supabaseAdmin
          .from('brands')
          .update({ plan: 'TRIAL', trial_payment_status: 'active' })
          .eq('id', brandId)
          .select('id, email, name, email_verification_token, email_verified')
          .single();

        if (updateError) {
          console.error('[Wompi] Error activando trial:', updateError);
          await this.insertPaymentLog({
            eventType: 'trial_activation_failed',
            reference,
            transactionId: transaction.id,
            amountCents: amountInCents,
            brandId,
            status: 'failed',
            errorMessage: updateError.message,
            ipAddress,
          });
          throw updateError;
        }

        if (updatedBrand) {
          await this.insertPaymentLog({
            eventType: 'trial_activated',
            reference,
            transactionId: transaction.id,
            amountCents: amountInCents,
            brandId,
            status: 'completed',
            payload: {
              plan: 'TRIAL',
              email: updatedBrand.email,
              emailVerified: updatedBrand.email_verified,
            },
            ipAddress,
          });

          notificationService.sendWelcomeEmail(updatedBrand as any, true)
            .catch(err => console.error('[Wompi] Error email bienvenida trial:', err));

          if (!updatedBrand.email_verified && updatedBrand.email_verification_token) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verifyUrl = `${frontendUrl}/auth/verify?token=${updatedBrand.email_verification_token}`;
            emailService.sendEmail({
              to: updatedBrand.email,
              subject: 'Confirma tu correo — Lookitry',
              html: verifyEmailTemplate({ name: updatedBrand.name, email: updatedBrand.email }, verifyUrl),
            }).catch(err => console.error('[Wompi] Error email verificacion trial:', err));
          }
        }
      } else {
        const effectivePlan = (plan === 'LANDING' ? 'BASIC' : plan).toUpperCase();
        const activateLanding = plan === 'LANDING' || includesLanding;

        if (plan === 'NONE') {
          const { data: existingLandingPayment } = await supabaseAdmin
            .from('subscription_payments')
            .select('id')
            .eq('reference', reference)
            .limit(1)
            .maybeSingle();

          if (!existingLandingPayment) {
            await supabaseAdmin.from('subscription_payments').insert({
              brand_id: brandId,
              amount: amountInCents / 100,
              currency: 'COP',
              payment_date: new Date().toISOString(),
              payment_method: 'wompi',
              status: 'completed',
              months_paid: 0,
              reference,
              notes: `Pago automático Wompi. SOLO Landing Page. Ref: ${reference}. ID: ${transaction.id}`
            });
            await this.insertPaymentLog({
              eventType: 'landing_payment_recorded',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              brandId,
              status: 'completed',
              payload: { plan: 'NONE', activateLanding },
              ipAddress,
            });
          } else {
            await this.insertPaymentLog({
              eventType: 'landing_payment_duplicate',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              brandId,
              status: 'ignored',
              payload: { plan: 'NONE', existingPaymentId: existingLandingPayment.id },
              ipAddress,
            });
          }

          if (activateLanding) {
            await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
            await this.insertPaymentLog({
              eventType: 'landing_activated',
              reference,
              transactionId: transaction.id,
              brandId,
              status: 'completed',
              payload: { plan: 'NONE' },
              ipAddress,
            });
          }
        } else {
          const { data: currentBrand } = await supabaseAdmin.from('brands').select('plan, name, subscription_status, trial_end_date').eq('id', brandId).single();
          const isActualUpgrade =
            hasActivePaidSubscription(currentBrand) &&
            currentBrand?.plan === 'BASIC' &&
            effectivePlan === 'PRO';

          if (isActualUpgrade) {
            await this.insertPaymentLog({
              eventType: 'upgrade_processing_started',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              brandId,
              status: 'processing',
              payload: { fromPlan: 'BASIC', toPlan: effectivePlan, months, isActualUpgrade },
              ipAddress,
            });
          }

          try {
            if (isActualUpgrade) {
              await planChangeService.markProcessing(reference, amountInCents / 100);
            }

            await this.insertPaymentLog({
              eventType: 'subscription_renewal_starting',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              brandId,
              status: 'processing',
              payload: { plan: effectivePlan, months, isActualUpgrade, activateLanding },
              ipAddress,
            });

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
                notes: `Pago automático Wompi. Ref: ${reference}. ID: ${transaction.id}.${activateLanding ? ' Incluye Landing Page.' : ''}`,
                reference,
              },
              months,
              effectivePlan,
              isActualUpgrade
            );

            await this.insertPaymentLog({
              eventType: 'subscription_renewal_completed',
              reference,
              transactionId: transaction.id,
              amountCents: amountInCents,
              brandId,
              status: 'completed',
              payload: { plan: effectivePlan, months, isActualUpgrade },
              ipAddress,
            });

            if (isActualUpgrade) {
              await planChangeService.markCompleted(reference, amountInCents / 100);
              await this.insertPaymentLog({
                eventType: 'upgrade_completed',
                reference,
                transactionId: transaction.id,
                amountCents: amountInCents,
                brandId,
                status: 'completed',
                payload: { fromPlan: 'BASIC', toPlan: effectivePlan, months },
                ipAddress,
              });
            }
          } catch (error) {
            if (isActualUpgrade) {
              await planChangeService.markFailed(reference, (error as Error)?.message || 'Error procesando upgrade Wompi');
              await this.insertPaymentLog({
                eventType: 'upgrade_failed',
                reference,
                transactionId: transaction.id,
                amountCents: amountInCents,
                brandId,
                status: 'failed',
                errorMessage: (error as Error)?.message || 'Error procesando upgrade Wompi',
                payload: { fromPlan: 'BASIC', toPlan: effectivePlan, months },
                ipAddress,
              });
            }
            throw error;
          }

          if (activateLanding) {
            await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
            await this.insertPaymentLog({
              eventType: 'landing_activated_with_subscription',
              reference,
              transactionId: transaction.id,
              brandId,
              status: 'completed',
              payload: { plan: effectivePlan },
              ipAddress,
            });
          }
        }

        const { data: updatedBrandForEmail } = await supabaseAdmin.from('brands').select('id, email, name, plan, subscription_end_date').eq('id', brandId).single();
        if (updatedBrandForEmail) {
          await this.insertPaymentLog({
            eventType: 'confirmation_email_triggered',
            reference,
            transactionId: transaction.id,
            brandId,
            status: 'completed',
            payload: { email: updatedBrandForEmail.email, plan: updatedBrandForEmail.plan },
            ipAddress,
          });
          notificationService.sendRenewalConfirmation(updatedBrandForEmail as any).catch(err => console.error('[Wompi] Error confirmación email:', err));
        } else {
          await this.insertPaymentLog({
            eventType: 'confirmation_email_skipped',
            reference,
            transactionId: transaction.id,
            brandId,
            status: 'ignored',
            payload: { reason: 'brand_not_found_for_email' },
            ipAddress,
          });
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Wompi] Error procesando webhook:', error);
      try {
        await supabaseAdmin.from('admin_notifications').insert({
          type: 'webhook_error',
          title: '⚠️ Error en webhook de Wompi',
          message: `Fallo al procesar webhook. Error: ${(error as Error)?.message || 'Desconocido'}. Verificar si hay pagos aprobados sin activar.`,
          severity: 'error',
          metadata: { error: (error as Error)?.message },
        });
      } catch (notifError) {
        console.error('[Wompi] No se pudo registrar notificación de error:', notifError);
      }
      // Retornar 500 para que Wompi reintente el webhook
      res.status(500).json({ error: 'Error interno procesando webhook' });
    }
  }

  async getUpgradePreview(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const {
        newPlan,
        newMonths,
        newPlanTotal,
        newPlanPricePerMonth,
        currentPlanPriceTotalFallback,
        currentPlanPriceTotal,
      } = req.query;
      const resolvedNewPlanTotal = parseInt((newPlanTotal as string) || (newPlanPricePerMonth as string), 10);
      const resolvedCurrentPlanFallback = parseInt(
        (currentPlanPriceTotal as string) || (currentPlanPriceTotalFallback as string),
        10
      ) || 0;

      if (!newPlan || !newMonths || !resolvedNewPlanTotal) {
        res.status(400).json({ error: 'Faltan parámetros' });
        return;
      }

      const preview = await subscriptionService.calculateUpgradeProration(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        resolvedNewPlanTotal,
        resolvedCurrentPlanFallback
      );
      res.json(preview);
    } catch (error) {
      console.error('[Wompi] Error en upgrade preview:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async applyFreeUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const { newPlan, newMonths, creditAmount, newPlanTotal, forcedEndDate } = req.body;
      if (!newPlan || !newMonths || creditAmount === undefined || newPlanTotal === undefined) {
        res.status(400).json({ error: 'Faltan parámetros' });
        return;
      }
      const { data: currentBrand } = await supabaseAdmin
        .from('brands')
        .select('plan, subscription_status, trial_end_date')
        .eq('id', brand.id)
        .single();

      const isActualUpgrade =
        hasActivePaidSubscription(currentBrand) &&
        currentBrand?.plan === 'BASIC' &&
        String(newPlan).toUpperCase() === 'PRO';

      if (!isActualUpgrade) {
        res.status(400).json({ error: 'FREE_UPGRADE_NOT_ALLOWED' });
        return;
      }

      const reference = `FREE-UPGRADE-${brand.id}-${Date.now()}`;
      await planChangeService.createPending({
        brandId: brand.id,
        reference,
        source: 'free_upgrade',
        fromPlan: currentBrand?.plan || null,
        toPlan: String(newPlan).toUpperCase(),
        months: parseInt(newMonths as string, 10),
        amountExpected: 0,
        metadata: { creditAmount, newPlanTotal, forcedEndDate: forcedEndDate || null },
      });
      const updatedBrand = await subscriptionService.applyFreeUpgrade(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        parseFloat(creditAmount),
        parseFloat(newPlanTotal),
        reference,
        forcedEndDate
      );
      await planChangeService.markCompleted(reference, 0);
      res.json({ success: true, brand: updatedBrand });
    } catch (error) {
      console.error('[Wompi] Error en free upgrade:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async freeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { plan, months, includes_landing, reference: reqRef, email, coupon_id } = req.body;
      
      const effectivePlan = (plan === 'LANDING' ? 'BASIC' : plan).toUpperCase();
      const parsedMonths = Number.parseInt(months as string, 10);
      const monthsNum = Number.isNaN(parsedMonths) ? 1 : parsedMonths;

      // SECURITY: Verificar cupón válido del 100% antes de permitir checkout gratuito
      if (coupon_id) {
        const { data: coupon, error: couponErr } = await supabaseAdmin
          .from('coupons')
          .select('id, code, discount_type, discount_value, max_uses, uses_count, expires_at, plan_ids, active')
          .eq('id', coupon_id)
          .eq('active', true)
          .maybeSingle();

        if (couponErr || !coupon) {
          res.status(400).json({ error: 'Cupón inválido o no encontrado' });
          return;
        }

        const now = new Date();
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
          res.status(400).json({ error: 'Cupón expirado' });
          return;
        }

        if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
          res.status(400).json({ error: 'Cupón sin usos disponibles' });
          return;
        }

        if (coupon.plan_ids && coupon.plan_ids.length > 0 && !coupon.plan_ids.includes(effectivePlan)) {
          res.status(400).json({ error: 'Este cupón no aplica para el plan seleccionado' });
          return;
        }

        // Verificar que el descuento sea 100% (percentage) o que cubra el total
        if (coupon.discount_type === 'percentage' && coupon.discount_value < 100) {
          res.status(400).json({ error: 'El cupón no cubre el 100% del valor. No se permite checkout gratuito.' });
          return;
        }

        if (coupon.discount_type === 'fixed') {
          const expectedTotal = brand?.id
            ? await pricingService.calculateTotal(effectivePlan, monthsNum, !!includes_landing)
            : await pricingService.calculateExternalCheckoutTotal(effectivePlan, monthsNum, !!includes_landing);
          
          if (coupon.discount_value < expectedTotal) {
            res.status(400).json({ error: 'El cupón no cubre el total del checkout. No se permite checkout gratuito.' });
            return;
          }
        }
      } else if (!brand?.id) {
        res.status(400).json({ error: 'Se requiere un cupón válido para checkout gratuito' });
        return;
      }

      // SECURITY: If authenticated, the email must match the session email.
      if (brand?.id && email && brand.email && email.trim().toLowerCase() !== brand.email.toLowerCase()) {
        res.status(403).json({
          error: 'EMAIL_MISMATCH',
          message: 'El email del checkout debe coincidir con el email de tu cuenta activa.',
        });
        return;
      }

      if (brand?.id && effectivePlan === 'TRIAL') {
        const { data: brandData } = await supabaseAdmin
          .from('brands')
          .select('trial_end_date, trial_generations_limit')
          .eq('id', brand.id)
          .maybeSingle();

        const hasHadTrial = brandData?.trial_end_date !== null || brandData?.trial_generations_limit !== null;
        
        if (hasHadTrial) {
          res.status(409).json({
            error: 'TRIAL_ALREADY_USED',
            message: 'Ya usaste tu prueba gratuita. ¡Upgrade a Basic o Pro para continuar!',
          });
          return;
        }
        // Si no ha tenido trial, permitir comprar trial para su cuenta existente
      }

      if (!brand?.id) {
        if (!email) {
          res.status(401).json({ error: 'No autenticado ni email proporcionado' });
          return;
        }

        const ref = reqRef || `FREE-visitor-${crypto.randomUUID()}`;
        
        const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({ 
          email, 
          reference: ref, 
          plan: effectivePlan, 
          months: monthsNum, 
          amount: 0,
          includes_landing: !!includes_landing,
          status: 'paid',
        });

        if (insertError) {
          console.error('[Wompi] Error al insertar registro pendiente gratuito:', insertError);
          res.status(500).json({ error: 'Error al procesar registro gratuito' });
          return;
        }

        res.json({ success: true, isVisitor: true, reference: ref });
        return;
      }

      const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brand.id).single();
      if (!currentBrand) {
        res.status(404).json({ error: 'Marca no encontrada' });
        return;
      }

      if (includes_landing && isTrialLandingBlocked(currentBrand) && effectivePlan === 'NONE') {
        res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
        return;
      }

      const ref = reqRef || `FREE-${brand.id}-${Date.now()}`;

      if (effectivePlan !== 'NONE') {
        await subscriptionService.renewSubscription(
          brand.id,
          {
            brand_id: brand.id,
            amount: 0,
            currency: 'COP',
            payment_date: new Date().toISOString(),
            payment_method: 'free_checkout',
            status: 'completed',
            months_paid: monthsNum,
            notes: `Checkout gratuito. Plan: ${effectivePlan}. Ref: ${ref}${includes_landing ? '. Incluye Landing Page.' : ''}`,
            reference: ref,
          },
          monthsNum,
          effectivePlan,
          hasActivePaidSubscription(currentBrand) && currentBrand.plan === 'BASIC' && effectivePlan === 'PRO'
        );
      }

      if (includes_landing) {
        await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brand.id);
      }
      
      const { data: updatedBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brand.id).single();
      res.json({ success: true, brand: updatedBrand });
    } catch (error) {
      console.error('[Wompi] Error en free checkout:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { plan, months } = req.query;
      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const isLandingPurchase = (req.query.includes_landing as string) === 'true';

      if (brand?.id && planStr === 'TRIAL') {
        res.status(409).json({
          error: 'AUTHENTICATED_TRIAL_DISABLED',
          message: 'El trial solo puede comprarse sin una sesion activa. Cierra sesion y usa /trial-checkout.',
        });
        return;
      }

      if (brand?.id && isLandingPurchase && planStr === 'NONE') {
        const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brand.id).single();
        if (currentBrand && isTrialLandingBlocked(currentBrand)) {
          res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
          return;
        }
      }

      let amountCOP = brand?.id
        ? await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase)
        : await pricingService.calculateExternalCheckoutTotal(planStr, monthsNum, isLandingPurchase);

      if (brand?.id && planStr === 'PRO') {
        const { data: b } = await supabaseAdmin.from('brands').select('plan, subscription_status, trial_end_date').eq('id', brand.id).single();
        if (hasActivePaidSubscription(b) && b?.plan === 'BASIC') {
          const proPlanTotal = await pricingService.calculateTotal('PRO', monthsNum, false);
          const preview = await subscriptionService.calculateUpgradeProration(brand.id, 'PRO', monthsNum, proPlanTotal, 0);
          amountCOP = preview.amountToPay;
          if (isLandingPurchase) {
             const onlyLanding = await pricingService.calculateTotal('NONE', 0, true);
             amountCOP += onlyLanding;
          }
        }
      }

      const brandId = brand?.id ?? `visitor_${crypto.randomUUID()}`;
      const config = await wompiService.getWidgetConfig(brandId, amountCOP, monthsNum, planStr, isLandingPurchase);
      const signature = await wompiService.generateIntegritySignature(config.reference, config.amountInCents, config.currency);
      res.json({ ...config, signature });
    } catch (error) {
      console.error('[Wompi] Error en getWidgetConfig:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tx = await wompiService.getTransactionById(id);
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

  async getCheckoutUrl(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { months, plan } = req.query;
      const email = req.query.email as string | undefined;
      const monthsNum = months ? parseInt(months as string, 10) : 1;
      const planStr = (plan as string)?.toUpperCase() || 'BASIC';
      const isLandingPurchase = (req.query.includes_landing as string) === 'true';

      // SECURITY: If authenticated, the email must match the session email.
      // Prevents creating orders for a different account while logged in.
      if (brand?.id && email && brand.email && email.trim().toLowerCase() !== brand.email.toLowerCase()) {
        res.status(403).json({
          error: 'EMAIL_MISMATCH',
          message: 'El email del checkout debe coincidir con el email de tu cuenta activa.',
        });
        return;
      }

      if (brand?.id && planStr === 'TRIAL') {
        res.status(409).json({
          error: 'AUTHENTICATED_TRIAL_DISABLED',
          message: 'El trial solo puede comprarse sin una sesion activa. Cierra sesion y usa /trial-checkout.',
        });
        return;
      }

      if (brand?.id && isLandingPurchase && planStr === 'NONE') {
        const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brand.id).single();
        if (currentBrand && isTrialLandingBlocked(currentBrand)) {
          res.status(403).json({ error: 'TRIAL_LANDING_BLOCKED', message: 'La mini-landing requiere primero activar un plan pago.' });
          return;
        }
      }

      let amountCOP = brand?.id
        ? await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase)
        : await pricingService.calculateExternalCheckoutTotal(planStr, monthsNum, isLandingPurchase);

      if (brand?.id && planStr === 'PRO') {
        const { data: b } = await supabaseAdmin.from('brands').select('plan, subscription_status, trial_end_date').eq('id', brand.id).single();
        if (hasActivePaidSubscription(b) && b?.plan === 'BASIC') {
          const proPlanTotal = await pricingService.calculateTotal('PRO', monthsNum, false);
          const preview = await subscriptionService.calculateUpgradeProration(brand.id, 'PRO', monthsNum, proPlanTotal, 0);
          amountCOP = preview.amountToPay;
          if (isLandingPurchase) {
            const onlyLanding = await pricingService.calculateTotal('NONE', 0, true);
            amountCOP += onlyLanding;
          }
        }
      }

      const brandId = brand?.id ?? `visitor_${crypto.randomUUID()}`;
      const reference = wompiService.generateReference(brandId, monthsNum, planStr, isLandingPurchase);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      let successPath = brand?.id
        ? `/dashboard/checkout?plan=${planStr}&months=${monthsNum}&method=wompi&ref=${encodeURIComponent(reference)}`
        : `/onboarding-post-pago?plan=${planStr}&months=${monthsNum}`;

      if (!brand?.id && email) {
        const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({ 
          email, 
          reference, 
          plan: planStr, 
          months: monthsNum, 
          amount: amountCOP,
          includes_landing: isLandingPurchase,
          status: 'pending',
        });
        
        if (insertError) {
          console.error('[Wompi] Error al insertar registro pendiente:', insertError);
          res.status(500).json({ error: 'Error al iniciar el registro' });
          return;
        }
        
        successPath = `/onboarding-post-pago?ref=${reference}`;
      }

      let productName = `Plan ${planStr} Lookitry`;
      if (planStr === 'NONE') productName = `Mini-Landing Lookitry (Pago único)`;
      if (isLandingPurchase && planStr !== 'NONE') productName += ` + Mini-Landing`;

      const checkoutUrl = await wompiService.getCheckoutUrl(brandId, amountCOP, `${frontendUrl}${successPath}`, false, monthsNum, planStr, reference, productName);
      
      if (brand?.id && planStr === 'PRO') {
        const { data: currentBrand } = await supabaseAdmin.from('brands').select('plan, subscription_status, trial_end_date').eq('id', brand.id).single();
        if (hasActivePaidSubscription(currentBrand) && currentBrand?.plan === 'BASIC') {
          await planChangeService.createPending({
            brandId: brand.id,
            reference,
            source: 'wompi',
            fromPlan: currentBrand?.plan || null,
            toPlan: 'PRO',
            months: monthsNum,
            amountExpected: amountCOP,
            metadata: { includesLanding: isLandingPurchase },
          });
        }
      }
      res.json({ checkoutUrl, reference });
    } catch (error) {
      console.error('[Wompi] Error en getCheckoutUrl:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
