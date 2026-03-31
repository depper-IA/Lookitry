import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { addonCreditsService } from '../services/addonCredits.service';

export class PaymentsController {
  async checkoutAddon(req: AuthRequest, res: Response) {
    try {
      if (!req.brand?.id) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para comprar créditos extra',
        });
      }

      const { gateway, packageId } = req.body || {};
      const result = await addonCreditsService.createCheckoutForBrand(req.brand.id, gateway, packageId);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: error.message || 'No se pudo iniciar el checkout del add-on',
      });
    }
  }

  async verifyAddon(req: AuthRequest, res: Response) {
    try {
      if (!req.brand?.id) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      const { reference } = req.body;
      if (!reference) return res.status(400).json({ error: 'Falta la referencia' });

      // Verificar en Wompi primero
      const { wompiService } = require('../services/wompi.service');
      const tx = await wompiService.getTransactionByReference(reference);

      if (tx && tx.status === 'APPROVED') {
        await addonCreditsService.applyPurchasedCredits(
          reference,
          'wompi',
          tx.amount_in_cents / 100,
          String(tx.id)
        );
        return res.status(200).json({ status: 'applied_now', message: 'Compra unificada (Wompi).' });
      }

      // Si no es Wompi, verificamos en PayPal
      const { paypalService } = require('../services/paypal.service');
      const paypalOrder = await paypalService.getTrackedOrder(reference);
      if (paypalOrder && paypalOrder.order_id) {
        const order = await paypalService.getOrder(paypalOrder.order_id);
        if (order && (order.status === 'COMPLETED' || order.status === 'APPROVED')) {
           // En caso de que haya quedado en APPROVED, idealmente la captura se debió hacer en paypal.controller
           // pero si no, igual la aplicamos (idealmente el webhook o /capture la captura).
           await addonCreditsService.applyPurchasedCredits(
               reference,
               'paypal',
               paypalOrder.amount_usd_expected,
               paypalOrder.order_id
           );
           return res.status(200).json({ status: 'applied_now', message: 'Compra unificada (PayPal).' });
        }
      }

      return res.status(200).json({ status: 'pending_or_not_found' });
    } catch (error: any) {
      // Ignorar errores silenciándolos, puede que ya se haya aplicado (violación Unique)
      if (error.message?.includes('violates unique constraint')) {
        return res.status(200).json({ status: 'already_applied' });
      }
      console.error('[PaymentsController] Error en verifyAddon:', error);
      return res.status(500).json({ error: 'Error verificando el add-on' });
    }
  }
}

export const paymentsController = new PaymentsController();
