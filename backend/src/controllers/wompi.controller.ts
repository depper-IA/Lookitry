import { Request, Response } from 'express';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import { pricingService } from '../services/pricing.service';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { supabaseAdmin } from '../config/supabase';
import { verifyEmailTemplate } from '../templates/email-templates';

const subscriptionService = new SubscriptionService();
const emailService = new EmailService();
const notificationService = new NotificationService();

export class WompiController {
  /**
   * POST /api/payments/wompi/webhook
   * Recibe eventos de Wompi (transaction.updated, etc.).
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const checksum = req.headers['x-event-checksum'] as string;
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : (typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body));

      // --- LOG DE SEGURIDAD (Redactado) ---
      console.log(`[Wompi Webhook] Recibido. Checksum: ${checksum || 'NINGUNO'}. Body length: ${rawBody.length}`);
      // -------------------------


      const firmaValida = await wompiService.verifyWebhookSignature(rawBody, checksum);

      
      if (!checksum || !firmaValida) {
        console.warn(`[Wompi] Firma inválida detectada para checksum: ${checksum}`);
        res.status(401).json({ error: 'Firma inválida' });
        return;
      }

      const event = (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) ? req.body : JSON.parse(rawBody);

      if (event?.event !== 'transaction.updated' || event?.data?.transaction?.status !== 'APPROVED') {
        res.status(200).json({ received: true });
        return;
      }

      const transaction = event.data.transaction;
      const reference: string = transaction.reference;
      const amountInCents: number = transaction.amount_in_cents;

      const brandId = wompiService.extractBrandIdFromReference(reference);
      if (!brandId) {
        console.error('[Wompi] Referencia inválida:', reference);
        res.status(200).json({ received: true });
        return;
      }

      if (brandId.startsWith('visitor_')) {
        const { error: updateError } = await supabaseAdmin
          .from('pending_registrations')
          .update({ 
            status: 'paid', 
            payment_id: transaction.id,
            updated_at: new Date().toISOString()
          })
          .eq('reference', reference);

        if (updateError) console.error('[Wompi] Error al marcar registro:', updateError.message);
        res.status(200).json({ received: true });
        return;
      }

      const { months, plan, includesLanding } = wompiService.extractMetaFromReference(reference);

      if (reference.startsWith('TRIAL-')) {
        const { data: updatedBrand } = await supabaseAdmin
          .from('brands')
          .update({ trial_payment_status: 'active' })
          .eq('id', brandId)
          .select('id, email, name, email_verification_token, email_verified')
          .single();

        if (updatedBrand) {
          // 1. Siempre enviar confirmación/bienvenida de trial
          notificationService.sendWelcomeEmail(updatedBrand as any, true)
            .catch(err => console.error('[Wompi] Error email bienvenida trial:', err));

          // 2. Si no está verificado, enviar también el link de verificación
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
          }
        } else {
          const { data: currentBrand } = await supabaseAdmin.from('brands').select('plan, name').eq('id', brandId).single();
          const isActualUpgrade = currentBrand?.plan === 'BASIC' && effectivePlan === 'PRO';
          
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
              notes: `Pago automático Wompi. Ref: ${reference}. ID: ${transaction.id}`,
            },
            months,
            effectivePlan,
            isActualUpgrade
          );

          if (activateLanding) {
            await supabaseAdmin.from('brands').update({ has_landing_page: true, landing_suspended_at: null }).eq('id', brandId);
          }
        }

        const { data: updatedBrandForEmail } = await supabaseAdmin.from('brands').select('id, email, name, plan, subscription_end_date').eq('id', brandId).single();
        if (updatedBrandForEmail) {
          notificationService.sendRenewalConfirmation(updatedBrandForEmail as any).catch(err => console.error('[Wompi] Error confirmación email:', err));
        }
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Wompi] Error procesando webhook:', error);
      res.status(200).json({ received: true, error: 'Error interno' });
    }
  }

  async getUpgradePreview(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const { newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotalFallback } = req.query;
      if (!newPlan || !newMonths || !newPlanPricePerMonth) {
        res.status(400).json({ error: 'Faltan parámetros' });
        return;
      }

      const preview = await subscriptionService.calculateUpgradeProration(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        parseInt(newPlanPricePerMonth as string, 10),
        parseInt(currentPlanPriceTotalFallback as string, 10) || 150000
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
      const { newPlan, newMonths, creditAmount, newPlanTotal } = req.body;
      if (!newPlan || !newMonths || creditAmount === undefined || newPlanTotal === undefined) {
        res.status(400).json({ error: 'Faltan parámetros' });
        return;
      }
      const reference = `FREE-UPGRADE-${brand.id}-${Date.now()}`;
      const updatedBrand = await subscriptionService.applyFreeUpgrade(
        brand.id,
        (newPlan as string).toUpperCase(),
        parseInt(newMonths as string, 10),
        parseFloat(creditAmount),
        parseFloat(newPlanTotal),
        reference
      );
      res.json({ success: true, brand: updatedBrand });
    } catch (error) {
      console.error('[Wompi] Error en free upgrade:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }

  async freeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      if (!brand?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const { plan, months, includes_landing, reference: reqRef } = req.body;
      const { data: currentBrand } = await supabaseAdmin.from('brands').select('*').eq('id', brand.id).single();
      if (!currentBrand) {
        res.status(404).json({ error: 'Marca no encontrada' });
        return;
      }
      const effectivePlan = (plan === 'LANDING' ? 'BASIC' : plan).toUpperCase();
      const monthsNum = parseInt(months as string, 10) || 1;
      const ref = reqRef || `FREE-${brand.id}-${Date.now()}`;

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
          notes: `Checkout gratuito. Plan: ${effectivePlan}. Ref: ${ref}`,
        },
        monthsNum,
        effectivePlan,
        currentBrand.plan === 'BASIC' && effectivePlan === 'PRO'
      );

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

      let amountCOP = await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase);

      if (brand?.id && planStr === 'PRO') {
        const { data: b } = await supabaseAdmin.from('brands').select('plan').eq('id', brand.id).single();
        if (b?.plan === 'BASIC') {
          const configRows = await pricingService.getPricingConfig();
          const basicPrice = configRows.find(c => c.id.toLowerCase() === 'basic')?.data?.precio_mensual_cop || 150000;
          const proPrice = configRows.find(c => c.id.toLowerCase() === 'pro')?.data?.precio_mensual_cop || 250000;
          
          const preview = await subscriptionService.calculateUpgradeProration(brand.id, 'PRO', monthsNum, proPrice, basicPrice);
          amountCOP = preview.amountToPay;
          if (isLandingPurchase) {
             const onlyLanding = await pricingService.calculateTotal('NONE', 0, true);
             amountCOP += onlyLanding;
          }
        }
      }

      const brandId = brand?.id ?? `visitor_${Date.now()}`;
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

      let amountCOP = await pricingService.calculateTotal(planStr, monthsNum, isLandingPurchase);

      if (brand?.id && planStr === 'PRO') {
        const { data: b } = await supabaseAdmin.from('brands').select('plan').eq('id', brand.id).single();
        if (b?.plan === 'BASIC') {
          const configRows = await pricingService.getPricingConfig();
          const basicPrice = configRows.find(c => c.id.toLowerCase() === 'basic')?.data?.precio_mensual_cop || 150000;
          const proPrice = configRows.find(c => c.id.toLowerCase() === 'pro')?.data?.precio_mensual_cop || 250000;
          const preview = await subscriptionService.calculateUpgradeProration(brand.id, 'PRO', monthsNum, proPrice, basicPrice);
          amountCOP = preview.amountToPay;
          if (isLandingPurchase) {
            const onlyLanding = await pricingService.calculateTotal('NONE', 0, true);
            amountCOP += onlyLanding;
          }
        }
      }

      const brandId = brand?.id ?? `visitor_${Date.now()}`;
      const reference = wompiService.generateReference(brandId, monthsNum, planStr, isLandingPurchase);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      let successPath = brand?.id ? `/pago-exitoso?plan=${planStr}&months=${monthsNum}` : `/registro-pro?plan=${planStr}&months=${monthsNum}`;

      if (!brand?.id && email) {
        const { error: insertError } = await supabaseAdmin.from('pending_registrations').insert({ 
          email, 
          reference, 
          plan: planStr, 
          months: monthsNum, 
          includes_landing: isLandingPurchase 
        });
        
        if (insertError) {
          console.error('[Wompi] Error al insertar registro pendiente:', insertError);
          res.status(500).json({ error: 'Error al iniciar el registro' });
          return;
        }
        
        successPath = `/registro-pro?ref=${reference}`;
      }

      const checkoutUrl = await wompiService.getCheckoutUrl(brandId, amountCOP, `${frontendUrl}${successPath}`, false, monthsNum, planStr, reference);
      res.json({ checkoutUrl });
    } catch (error) {
      console.error('[Wompi] Error en getCheckoutUrl:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
