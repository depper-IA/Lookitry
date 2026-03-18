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
   * Formato: TRYON-{brandId}-M{months}-P{plan}-{timestamp}
   * Ejemplo: TRYON-uuid-M3-PPRO-1748000000000
   */
  generateReference(brandId: string, months: number = 1, plan: string = 'BASIC'): string {
    return `TRYON-${brandId}-M${months}-P${plan.toUpperCase()}-${Date.now()}`;
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
   * Extrae el brandId, months y plan de la referencia de pago.
   * Formato nuevo: TRYON-{brandId}-M{months}-P{plan}-{timestamp}
   * Formato legacy: TRYON-{brandId}-{timestamp}
   */
  extractBrandIdFromReference(reference: string): string | null {
    const parts = reference.split('-');
    if (parts.length < 3 || parts[0] !== 'TRYON') return null;
    // Formato nuevo: TRYON-{uuid4parts}-M{n}-P{plan}-{ts}
    // Buscar el índice del segmento que empieza con 'M' seguido de dígitos
    const mIdx = parts.findIndex((p, i) => i > 0 && /^M\d+$/.test(p));
    if (mIdx > 1) {
      // brandId son las partes entre índice 1 y mIdx-1 (UUID tiene 5 partes con guiones)
      return parts.slice(1, mIdx).join('-');
    }
    // Formato legacy: TRYON-{brandId}-{timestamp}
    return parts.slice(1, -1).join('-');
  }

  /**
   * Extrae months y plan de la referencia de pago.
   * Retorna defaults si la referencia es formato legacy.
   */
  extractMetaFromReference(reference: string): { months: number; plan: string } {
    const parts = reference.split('-');
    const mIdx = parts.findIndex((p, i) => i > 0 && /^M\d+$/.test(p));
    if (mIdx > 1 && parts[mIdx + 1]?.startsWith('P')) {
      const months = parseInt(parts[mIdx].slice(1), 10) || 1;
      const plan = parts[mIdx + 1].slice(1) || 'BASIC';
      return { months, plan };
    }
    return { months: 1, plan: 'BASIC' };
  }

  /**
   * Retorna los datos necesarios para inicializar el widget de Wompi en el frontend.
   */
  async getWidgetConfig(brandId: string, amountCOP: number, months: number = 1, plan: string = 'BASIC') {
    const { publicKey } = await this.getActiveKeys();
    const reference = this.generateReference(brandId, months, plan);
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
  async getCheckoutUrl(brandId: string, amountCOP: number, redirectUrl: string, cardOnly = false, months: number = 1, plan: string = 'BASIC'): Promise<string> {
    const { publicKey } = await this.getActiveKeys();
    const reference = this.generateReference(brandId, months, plan);
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
