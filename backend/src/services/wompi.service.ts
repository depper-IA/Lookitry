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
   * Formato: TRYON-{brandId}-M{months}-P{plan}[-LANDING]-{timestamp}
   * Ejemplo: TRYON-uuid-M3-PPRO-LANDING-1748000000000
   */
  generateReference(brandId: string, months: number = 1, plan: string = 'BASIC', includesLanding: boolean = false): string {
    return `TRYON-${brandId}-M${months}-P${plan.toUpperCase()}${includesLanding ? '-LANDING' : ''}-${Date.now()}`;
  }

  /**
   * Verifica la firma del webhook de Wompi.
   * Wompi docs: https://docs.wompi.co/en/docs/colombia/eventos/
   * Intenta múltiples variantes de la fórmula para máxima compatibilidad.
   */
  async verifyWebhookSignature(payload: string, checksum: string): Promise<boolean> {
    const { eventsSecret, testMode } = await this.getActiveKeys();
    if (!eventsSecret) {
      console.warn('[Wompi] events_secret no configurado — firma no verificable');
      return false;
    }

    const tryHash = (data: string) => crypto.createHash('sha256').update(data).digest('hex');

    try {
      const event = JSON.parse(payload);
      const tx = event?.data?.transaction;
      if (tx) {
        const timestamp = event.timestamp?.toString() || '';

        // Variante 1 (nueva): id + status + amount_in_cents + timestamp + secret
        const v1 = tryHash(`${tx.id}${tx.status}${tx.amount_in_cents}${timestamp}${eventsSecret}`);
        if (v1 === checksum) return true;

        // Variante 2 (legacy): id + status + amount_in_cents + currency + secret
        const v2 = tryHash(`${tx.id}${tx.status}${tx.amount_in_cents}${tx.currency}${eventsSecret}`);
        if (v2 === checksum) return true;

        // Variante 3: solo body raw + secret
        const v3 = tryHash(payload + eventsSecret);
        if (v3 === checksum) return true;

        // Log para debug cuando falla
        console.warn(`[Wompi] Firma NO coincide con ninguna variante. testMode=${testMode} tx.id=${tx.id} tx.status=${tx.status} tx.amount=${tx.amount_in_cents} timestamp=${timestamp}`);
        console.warn(`[Wompi] checksum_recibido=${checksum}`);
        console.warn(`[Wompi] v1=${v1} v2=${v2} v3=${v3}`);
      }
    } catch (e) {
      console.error('[Wompi] Error parseando payload para verificación:', e);
    }

    // Fallback final: body completo + secret
    const vFinal = tryHash(payload + eventsSecret);
    return vFinal === checksum;
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
  extractMetaFromReference(reference: string): { months: number; plan: string; includesLanding: boolean } {
    const parts = reference.split('-');
    const mIdx = parts.findIndex((p, i) => i > 0 && /^M\d+$/.test(p));
    const includesLanding = parts.includes('LANDING');
    if (mIdx > 1 && parts[mIdx + 1]?.startsWith('P')) {
      const months = parseInt(parts[mIdx].slice(1), 10) || 1;
      const plan = parts[mIdx + 1].slice(1) || 'BASIC';
      return { months, plan, includesLanding };
    }
    return { months: 1, plan: 'BASIC', includesLanding };
  }

  /**
   * Retorna los datos necesarios para inicializar el widget de Wompi en el frontend.
   */
  async getWidgetConfig(brandId: string, amountCOP: number, months: number = 1, plan: string = 'BASIC', includesLanding: boolean = false) {
    const { publicKey } = await this.getActiveKeys();
    const reference = this.generateReference(brandId, months, plan, includesLanding);
    const amountInCents = amountCOP * 100;
    return {
      publicKey,
      reference,
      amountInCents,
      currency: 'COP',
    };
  }

  /**
   * Consulta una transacción por referencia en la API de Wompi.
   * Retorna el primer elemento del array data[], o null si está vacío.
   * Lanza error si la llamada de red falla.
   */
  async getTransactionByReference(reference: string): Promise<{ status: string } | null> {
    try {
      const { privateKey, testMode } = await this.getActiveKeys();
      const baseUrl = testMode ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';
      const url = `${baseUrl}/v1/transactions?reference=${encodeURIComponent(reference)}`;
      
      console.log(`[Wompi] Verificando transacción: ref=${reference} env=${testMode ? 'sandbox' : 'production'}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${privateKey}`,
        },
      });
      const json = await response.json() as { data: { status: string }[] };
      if (!json.data || json.data.length === 0) return null;
      return json.data[0];
    } catch (error) {
      console.error('[Wompi] Error al verificar el pago con Wompi:', error);
      throw new Error('Error al verificar el pago con Wompi');
    }
  }

  /**
   * Consulta una transacción por ID en la API de Wompi.
   */
  async getTransactionById(id: string): Promise<{ reference: string, status: string } | null> {
    try {
      const { privateKey, testMode } = await this.getActiveKeys();
      const baseUrl = testMode ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';
      const url = `${baseUrl}/v1/transactions/${encodeURIComponent(id)}`;
      
      const response = await fetch(url, { headers: { Authorization: `Bearer ${privateKey}` } });
      const json = await response.json() as { data: { reference: string, status: string } };
      if (!json.data) return null;
      return json.data;
    } catch (error) {
      console.error('[Wompi] Error al consultar TX por ID:', error);
      return null;
    }
  }

  /**
   * Genera la URL del checkout hosted de Wompi.
   * Si se pasa `referenceOverride`, se usa esa referencia en lugar de generar una nueva.
   */
  async getCheckoutUrl(brandId: string, amountCOP: number, redirectUrl: string, cardOnly = false, months: number = 1, plan: string = 'BASIC', referenceOverride?: string): Promise<string> {
    const { publicKey } = await this.getActiveKeys();
    const reference = referenceOverride ?? this.generateReference(brandId, months, plan);
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
