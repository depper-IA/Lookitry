import { Request, Response } from 'express';
import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabase } from '../config/supabase';

const subscriptionService = new SubscriptionService();

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
      if (!checksum || !wompiService.verifyWebhookSignature(rawBody, checksum)) {
        console.warn('[Wompi] Firma inválida o ausente. Checksum recibido:', checksum);
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

      // Renovar suscripción o activar trial según el monto
      if (amountInCents === 100) {
        // Pago de tokenización de trial (100 COP)
        await supabase
          .from('brands')
          .update({ trial_payment_status: 'active' })
          .eq('id', brandId);
        console.log(`[Wompi] Trial activado para brand ${brandId}`);
      } else {
        // Renovar suscripción normal
        await subscriptionService.renewSubscription(brandId, {
          brand_id: brandId,
          amount: amountInCents / 100,
          currency: 'COP',
          payment_date: new Date().toISOString(),
          payment_method: 'wompi',
          status: 'completed',
          notes: `Pago automático Wompi. Ref: ${reference}. ID: ${transaction.id}`,
        });
        console.log(`[Wompi] Suscripción renovada para brand ${brandId}`);
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Wompi] Error procesando webhook:', error);
      // Siempre responder 200 a Wompi para evitar reintentos innecesarios
      res.status(200).json({ received: true, error: 'Error interno' });
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
      const { plan, amount } = req.query;

      const planAmounts: Record<string, number> = { BASIC: 150000, PRO: 250000 };
      const amountCOP = amount
        ? parseInt(amount as string, 10)
        : planAmounts[(plan as string)?.toUpperCase()] ?? 150000;

      const brandId = brand?.id ?? `visitor_${Date.now()}`;
      const config = wompiService.getWidgetConfig(brandId, amountCOP);
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
   */
  async getCheckoutUrl(req: Request, res: Response): Promise<void> {
    try {
      const brand = (req as any).brand;
      const { amount, months } = req.query;

      const amountCOP = amount ? parseInt(amount as string, 10) : 250000;
      const monthsNum = months ? parseInt(months as string, 10) : 1;

      const brandId = brand?.id ?? `visitor_${Date.now()}`;

      // Después del pago: si tiene sesión → /pago-exitoso, si no → /registro-pro
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const successPath = brand?.id
        ? `/pago-exitoso?plan=PRO&months=${monthsNum}`
        : `/registro-pro?plan=PRO&months=${monthsNum}`;
      const redirectUrl = `${frontendUrl}${successPath}`;

      const checkoutUrl = await wompiService.getCheckoutUrl(brandId, amountCOP, redirectUrl);

      res.json({ checkoutUrl });
    } catch (error) {
      console.error('[Wompi] Error generando checkout URL:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
