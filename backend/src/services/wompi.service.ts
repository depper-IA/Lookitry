import crypto from 'crypto';
import { PaymentSettingsService } from './paymentSettings.service';

/**
 * WompiService
 *
 * Integración con la pasarela de pagos Wompi (Colombia).
 * Documentación: https://docs.wompi.co
 *
 * Las llaves se leen desde payment_settings en Supabase.
 * Si wompi_test_mode=true → llaves sandbox (wompi_public_key / wompi_private_key)
 * Si wompi_test_mode=false → llaves producción (wompi_prod_public_key / wompi_prod_private_key)
 * Fallback a variables de entorno para compatibilidad.
 */

const settingsService = new PaymentSettingsService();

export class WompiService {
  readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.WOMPI_ENABLED === 'true';
  }

  /** Obtiene las llaves activas según el modo configurado en payment_settings */
  private async getActiveKeys(): Promise<{
    publicKey: string;
    privateKey: string;
    eventsSecret: string;
    integritySecret: string;
    testMode: boolean;
  }> {
    try {
      const s = await settingsService.getSettings();
      if (s.wompi_test_mode) {
        return {
          publicKey: s.wompi_public_key || process.env.WOMPI_PUBLIC_KEY || '',
          privateKey: s.wompi_private_key || process.env.WOMPI_PRIVATE_KEY || '',
          eventsSecret: s.wompi_events_secret || process.env.WOMPI_EVENTS_SECRET || '',
          integritySecret: s.wompi_integrity_secret || process.env.WOMPI_INTEGRITY_SECRET || '',
          testMode: true,
        };
      } else {
        return {
          publicKey: s.wompi_prod_public_key || process.env.WOMPI_PUBLIC_KEY || '',
          privateKey: s.wompi_prod_private_key || process.env.WOMPI_PRIVATE_KEY || '',
          eventsSecret: s.wompi_prod_events_secret || process.env.WOMPI_EVENTS_SECRET || '',
          integritySecret: s.wompi_prod_integrity_secret || process.env.WOMPI_INTEGRITY_SECRET || '',
          testMode: false,
        };
      }
    } catch {
      // Fallback a variables de entorno si falla la BD
      return {
        publicKey: process.env.WOMPI_PUBLIC_KEY || '',
        privateKey: process.env.WOMPI_PRIVATE_KEY || '',
        eventsSecret: process.env.WOMPI_EVENTS_SECRET || '',
        integritySecret: process.env.WOMPI_INTEGRITY_SECRET || '',
        testMode: true,
      };
    }
  }

  /**
   * Genera la firma de integridad para el widget de Wompi.
   * Formato: SHA256(reference + amountInCents + currency + integritySecret)
   */
  async generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string = 'COP'
  ): Promise<string> {
    const { integritySecret } = await this.getActiveKeys();
    const data = `${reference}${amountInCents}${currency}${integritySecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Genera una referencia única para el pago.
   * Formato: TRYON-{brandId}-{timestamp}
   */
  generateReference(brandId: string): string {
    return `TRYON-${brandId}-${Date.now()}`;
  }

  /**
   * Verifica la firma del webhook de Wompi.
   * Wompi envía: X-Event-Checksum = SHA256(event_json + events_secret)
   */
  async verifyWebhookSignature(payload: string, checksum: string): Promise<boolean> {
    const { eventsSecret } = await this.getActiveKeys();
    if (!eventsSecret) return false;
    const expected = crypto
      .createHash('sha256')
      .update(payload + eventsSecret)
      .digest('hex');
    return expected === checksum;
  }

  /**
   * Extrae el brandId de la referencia de pago.
   * Formato esperado: TRYON-{brandId}-{timestamp}
   */
  extractBrandIdFromReference(reference: string): string | null {
    const parts = reference.split('-');
    if (parts.length < 3 || parts[0] !== 'TRYON') return null;
    const uuidParts = parts.slice(1, -1);
    return uuidParts.join('-');
  }

  /**
   * Retorna los datos necesarios para inicializar el widget de Wompi en el frontend.
   */
  async getWidgetConfig(brandId: string, amountCOP: number) {
    const { publicKey } = await this.getActiveKeys();
    const reference = this.generateReference(brandId);
    const amountInCents = amountCOP * 100;
    return {
      publicKey,
      reference,
      amountInCents,
      currency: 'COP',
    };
  }

  /**
   * Genera la URL del checkout hosted de Wompi.
   */
  async getCheckoutUrl(brandId: string, amountCOP: number, redirectUrl: string, cardOnly = false): Promise<string> {
    const { publicKey } = await this.getActiveKeys();
    const reference = this.generateReference(brandId);
    const amountInCents = amountCOP * 100;
    const currency = 'COP';
    const signature = await this.generateIntegritySignature(reference, amountInCents, currency);

    const encode = (v: string) => encodeURIComponent(v);
    const params = [
      `public-key=${encode(publicKey)}`,
      `currency=${encode(currency)}`,
      `amount-in-cents=${encode(String(amountInCents))}`,
      `reference=${encode(reference)}`,
      `signature:integrity=${encode(signature)}`,
      `redirect-url=${encode(redirectUrl)}`,
    ];

    if (cardOnly) {
      params.push(`payment-methods=${encode('CARD')}`);
    }

    return `https://checkout.wompi.co/p/?${params.join('&')}`;
  }
}

export const wompiService = new WompiService();
