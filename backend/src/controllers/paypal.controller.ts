
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
}
