import crypto from 'crypto';

/**
 * WompiService
 *
 * Integración con la pasarela de pagos Wompi (Colombia).
 * Documentación: https://docs.wompi.co
 *
 * Flujo:
 * 1. Frontend abre el widget de Wompi con los datos del pago
 * 2. Wompi procesa el pago y envía un webhook al backend
 * 3. Backend verifica la firma y renueva la suscripción
 */
export class WompiService {
  private readonly publicKey: string;
  private readonly eventsSecret: string;
  private readonly integritySecret: string;
  readonly enabled: boolean;

  constructor() {
    this.publicKey = process.env.WOMPI_PUBLIC_KEY || '';
    this.eventsSecret = process.env.WOMPI_EVENTS_SECRET || '';
    this.integritySecret = process.env.WOMPI_INTEGRITY_SECRET || process.env.WOMPI_PRIVATE_KEY || '';
    this.enabled = process.env.WOMPI_ENABLED === 'true';
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
    const data = `${reference}${amountInCents}${currency}${this.integritySecret}`;
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
  verifyWebhookSignature(payload: string, checksum: string): boolean {
    if (!this.eventsSecret) return false;
    const expected = crypto
      .createHash('sha256')
      .update(payload + this.eventsSecret)
      .digest('hex');
    return expected === checksum;
  }

  /**
   * Extrae el brandId de la referencia de pago.
   * Formato esperado: TRYON-{brandId}-{timestamp}
   */
  extractBrandIdFromReference(reference: string): string | null {
    const parts = reference.split('-');
    // TRYON-{uuid-con-guiones}-{timestamp}
    // El uuid tiene 5 partes separadas por guión, el timestamp es el último
    if (parts.length < 3 || parts[0] !== 'TRYON') return null;
    // Reconstruir el uuid: partes 1..n-1 (excluir TRYON y timestamp)
    const uuidParts = parts.slice(1, -1);
    return uuidParts.join('-');
  }

  /**
   * Retorna los datos necesarios para inicializar el widget de Wompi en el frontend.
   */
  getWidgetConfig(brandId: string, amountCOP: number) {
    const reference = this.generateReference(brandId);
    const amountInCents = amountCOP * 100;
    return {
      publicKey: this.publicKey,
      reference,
      amountInCents,
      currency: 'COP',
    };
  }

  /**
   * Genera la URL del checkout hosted de Wompi.
   * El usuario es redirigido a esta URL — Wompi maneja todo el flujo de pago.
   * Documentación: https://docs.wompi.co/docs/colombia/widget-checkout-web
   *
   * URL base: https://checkout.wompi.co/p/
   * Parámetros requeridos:
   *   public-key, currency, amount-in-cents, reference, signature:integrity, redirect-url
   */
  async getCheckoutUrl(brandId: string, amountCOP: number, redirectUrl: string): Promise<string> {
    const reference = this.generateReference(brandId);
    const amountInCents = amountCOP * 100;
    const currency = 'COP';
    const signature = await this.generateIntegritySignature(reference, amountInCents, currency);

    // URLSearchParams codifica ":" como "%3A", pero Wompi requiere "signature:integrity" literal.
    // Construimos la query string manualmente para preservar los dos puntos.
    const encode = (v: string) => encodeURIComponent(v);
    const qs = [
      `public-key=${encode(this.publicKey)}`,
      `currency=${encode(currency)}`,
      `amount-in-cents=${encode(String(amountInCents))}`,
      `reference=${encode(reference)}`,
      `signature:integrity=${encode(signature)}`,
      `redirect-url=${encode(redirectUrl)}`,
    ].join('&');

    return `https://checkout.wompi.co/p/?${qs}`;
  }
}

export const wompiService = new WompiService();
