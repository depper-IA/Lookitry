
import { Request, Response } from 'express';
import { paypalService } from '../services/paypal.service';
import { supabaseAdmin } from '../config/supabase';

export class PaypalController {
  /**
   * GET /api/payments/paypal/checkout-url
   * Genera una orden de PayPal y devuelve la URL de aprobación.
   */
  async getCheckoutUrl(req: any, res: Response) {
    try {
      const { amount, months, plan, email, includes_landing, trm } = req.query;
      const brandId = req.admin?.id || req.brand?.id;
      
      const monthsNum = parseInt(months as string) || 1;
      const amountCOP = parseFloat(amount as string);
      const currentTRM = parseFloat(trm as string) || 3900;
      const amountUSD = amountCOP / currentTRM;

      const isLandingPurchase = includes_landing === 'true';
      const effectivePlan = (plan as string || 'BASIC').toUpperCase();

      // Generar referencia única
      const brandIdentifier = brandId || `visitor_${Date.now()}`;
      const reference = `TRYON-${brandIdentifier}-M${monthsNum}-P${effectivePlan}${isLandingPurchase ? '-LANDING' : ''}-${Date.now()}`;

      // Si es un visitante, guardar en pending_registrations
      if (!brandId && email) {
        await supabaseAdmin
          .from('pending_registrations')
          .insert({ 
            email: email as string, 
            reference, 
            plan: effectivePlan, 
            months: monthsNum, 
            includes_landing: isLandingPurchase 
          });
      }

      const description = isLandingPurchase 
        ? `Lookitry Mini-landing + Plan ${effectivePlan} (${monthsNum} meses)`
        : `Lookitry Plan ${effectivePlan} (${monthsNum} meses)`;

      const { approveUrl } = await paypalService.createOrder(amountUSD, reference, description);

      res.json({ checkoutUrl: approveUrl });
    } catch (error: any) {
      console.error('[PayPal Controller] Error:', error.message);
      res.status(500).json({ error: 'Error al generar link de PayPal' });
    }
  }

  /**
   * POST /api/payments/paypal/capture
   * Captura el pago de una orden y activa la suscripción/registro.
   */
  async captureOrder(req: any, res: Response) {
    try {
      const { orderId, reference } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId es requerido' });
      }

      // 1. Capturar el pago en PayPal
      const captureData = await paypalService.captureOrder(orderId);

      if (captureData.status !== 'COMPLETED') {
        return res.status(400).json({ 
          error: 'PAYMENT_NOT_COMPLETED', 
          message: 'El pago no se ha completado correctamente en PayPal' 
        });
      }

      // 2. Extraer información de la referencia (TRYON-brandId-Mmonths-Pplan-...)
      const parts = reference.split('-');
      const brandIdOrVisitor = parts[1];
      const months = parseInt(parts[2].replace('M', '')) || 1;
      const plan = parts[3].replace('P', '') as 'BASIC' | 'PRO';
      const isLanding = reference.includes('-LANDING');

      const amount = captureData.purchase_units[0].payments.captures[0].amount.value;

      // 3. Registrar el pago en la base de datos si es una marca existente
      const isExistingBrand = !brandIdOrVisitor.startsWith('visitor_');

      if (isExistingBrand) {
        const { SubscriptionService } = await import('../services/subscription.service');
        const subService = new SubscriptionService();
        
        await subService.renewSubscription(brandIdOrVisitor, {
          brand_id: brandIdOrVisitor,
          amount: parseFloat(amount),
          currency: 'USD',
          payment_date: new Date().toISOString(),
          payment_method: 'paypal',
          status: 'completed',
          months_paid: months,
          notes: `Pago PayPal. Plan: ${plan}. Meses: ${months}. Ref: ${reference}. ID: ${orderId}`
        }, months, plan, false);

        if (isLanding) {
          await supabaseAdmin
            .from('brands')
            .update({ has_landing_page: true, landing_suspended_at: null })
            .eq('id', brandIdOrVisitor);
        }
      } else {
        // Para visitantes, marcamos el registro como PAGADO de forma segura en la DB
        const { error: updateError } = await supabaseAdmin
          .from('pending_registrations')
          .update({ 
            status: 'paid', 
            payment_id: orderId,
            updated_at: new Date().toISOString()
          })
          .eq('reference', reference);

        if (updateError) {
          console.error('[PayPal] Error al marcar registro como pagado:', updateError.message);
        } else {
          console.log(`[PayPal] Pago de visitante CAPTURADO y VERIFICADO: ${reference}`);
        }
      }

      res.json({ 
        ok: true, 
        status: 'COMPLETED',
        reference,
        isExistingBrand
      });
    } catch (error: any) {
      console.error('[PayPal Controller] Error en captura:', error.message);
      res.status(500).json({ error: 'Error al procesar la captura de PayPal' });
    }
  }
}
