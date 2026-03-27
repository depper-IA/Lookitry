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
}

export const paymentsController = new PaymentsController();
