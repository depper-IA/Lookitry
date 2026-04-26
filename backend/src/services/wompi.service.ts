import crypto from 'crypto';

import { PaymentSettingsService } from './paymentSettings.service';

import { supabaseAdmin } from '../config/supabase';



/**

 * WompiService

 *

 * Integración con la pasarela de pagos Wompi (Colombia).

 * Documentación: https://docs.wompi.co

 *

 * Las llaves se leen desde payment_settings en Supabase.

 * Si wompi_test_mode=true â llaves sandbox (wompi_public_key / wompi_private_key)

 * Si wompi_test_mode=false â llaves producción (wompi_prod_public_key / wompi_prod_private_key)

 * Fallback a variables de entorno para compatibilidad.

 */



const settingsService = new PaymentSettingsService();



export class WompiService {

  readonly enabled: boolean;



  constructor() {

    this.enabled = process.env.WOMPI_ENABLED === 'true';

  }



  /** Obtiene las llaves activas según el modo configurado en payment_settings */

  async getActiveKeys(): Promise<{

    publicKey: string;

    privateKey: string;

    eventsSecret: string;

    integritySecret: string;

    testMode: boolean;

  }> {

    const isProdEnv = process.env.NODE_ENV === 'production' || process.env.FRONTEND_URL?.includes('lookitry.com');

    try {

      const s = await settingsService.getSettings();

      // Si el registro de la DB dice explícitamente test_mode=false, usamos PROD

      if (s.wompi_test_mode === false) {

        return {

          publicKey: s.wompi_prod_public_key || process.env.WOMPI_PROD_PUBLIC_KEY || process.env.WOMPI_PUBLIC_KEY || '',

          privateKey: s.wompi_prod_private_key || process.env.WOMPI_PROD_PRIVATE_KEY || process.env.WOMPI_PRIVATE_KEY || '',

          eventsSecret: s.wompi_prod_events_secret || process.env.WOMPI_PROD_EVENTS_SECRET || process.env.WOMPI_EVENTS_SECRET || '',

          integritySecret: s.wompi_prod_integrity_secret || process.env.WOMPI_PROD_INTEGRITY_SECRET || process.env.WOMPI_INTEGRITY_SECRET || '',

          testMode: false,

        };

      } else {

        // Por defecto (o si test_mode=true), usamos llaves de test

        return {

          publicKey: s.wompi_public_key || process.env.WOMPI_PUBLIC_KEY || '',

          privateKey: s.wompi_private_key || process.env.WOMPI_PRIVATE_KEY || '',

          eventsSecret: s.wompi_events_secret || process.env.WOMPI_EVENTS_SECRET || '',

          integritySecret: s.wompi_integrity_secret || process.env.WOMPI_INTEGRITY_SECRET || '',

          testMode: true,

        };

      }

    } catch {

      // Fallback a variables de entorno si falla la BD

      // CRÑTICO: Si detectamos entorno de producción, usamos variables PROD_ correspondientes

      const isActuallyProd = isProdEnv && process.env.WOMPI_PROD_PUBLIC_KEY;

      return {

        publicKey: (isActuallyProd ? process.env.WOMPI_PROD_PUBLIC_KEY : process.env.WOMPI_PUBLIC_KEY) || '',

        privateKey: (isActuallyProd ? process.env.WOMPI_PROD_PRIVATE_KEY : process.env.WOMPI_PRIVATE_KEY) || '',

        eventsSecret: (isActuallyProd ? process.env.WOMPI_PROD_EVENTS_SECRET : process.env.WOMPI_EVENTS_SECRET) || '',

        integritySecret: (isActuallyProd ? process.env.WOMPI_PROD_INTEGRITY_SECRET : process.env.WOMPI_INTEGRITY_SECRET) || '',

        testMode: !isActuallyProd,

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

   * Genera una referencia específica para el pago del Trial.

   */

  generateTrialReference(brandId: string): string {

    return `TRIAL-${brandId}-${Date.now()}`;

  }



  /**

   * Verifica la firma del webhook de Wompi.

   * Wompi docs: https://docs.wompi.co/en/docs/colombia/eventos/

   * 

   * NOTA: Solo usamos la variante oficial (v1) según documentación de Wompi.

   * Las variantes legacy (v2, v3) fueron removidas por seguridad.

   */

  async verifyWebhookSignature(payload: string, checksum: string): Promise<boolean> {

    const { eventsSecret, testMode } = await this.getActiveKeys();

    if (!eventsSecret) {

      console.warn('[Wompi] events_secret no configurado â firma no verificable');

      return false;

    }



    const tryHash = (data: string) => crypto.createHash('sha256').update(data).digest('hex');



    try {

      // Variante oficial (v1) según documentación de Wompi:

      // Estructura: transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret

      const event = JSON.parse(payload);

      const tx = event?.data?.transaction;

      const timestamp = event?.timestamp;



      if (tx && timestamp) {

        const amountStr = String(tx.amount_in_cents);

        const v1String = `${tx.id}${tx.status}${amountStr}${timestamp}${eventsSecret}`;

        const v1 = tryHash(v1String);

        

        if (v1 === checksum) return true;

        

        // Debug si falla

        console.warn(`[Wompi] Firma v1 fallida. testMode=${testMode} tx.id=${tx?.id} status=${tx?.status}`);

      } else {

        console.warn('[Wompi] Payload sin transaction o timestamp válido');

      }

    } catch (e) {

      console.error('[Wompi] Error parseando payload:', e);

    }



    return false;

  }



  /**

   * Extrae el brandId, months y plan de la referencia de pago.

   * Formato nuevo: TRYON-{brandId}-M{months}-P{plan}-{timestamp}

   * Formato legacy: TRYON-{brandId}-{timestamp}

   */

  extractBrandIdFromReference(reference: string): string | null {

    try {

      if (!reference) return null;

      const parts = reference.split('-');



      // Solo soportamos prefijos conocidos del sistema.

      // Esto evita falsos positivos en referencias ajenas.

      const prefix = parts[0];

      if (!['TRYON', 'TRIAL', 'GUEST'].includes(prefix)) {

        return null;

      }

      

      // Soporte para referencias de TRIAL

      if (parts[0] === 'TRIAL' || parts[0] === 'GUEST') {

        // En TRIAL-{brandId}-timestamp o GUEST-TRIAL-{brandId}-timestamp

        // El brandId es la parte central.

        if (parts[0] === 'GUEST' && parts[1] === 'TRIAL') {

           // GUEST-TRIAL-visitor_XXX-... -> El visitor_XXX es partes[2]

           return parts[2];

        }

        return parts[1];

      }



      // Un UUID tiene 5 partes unidas por guiones (ej: 550e8400-e29b-41d4-a716-446655440000)

      // Buscamos dónde empieza la parte de metadatos (M seguido de números)

      const mIdx = parts.findIndex((p, i) => i > 0 && /^M\d+$/.test(p));

      

      if (mIdx > 1) {

        // El brandId es todo lo que hay entre el prefijo y la M

        // Esto funciona aunque el brandId sea un UUID con guiones

        return parts.slice(1, mIdx).join('-');

      }



      // Si no hay M, asumimos formato legacy: PREFIX-brandId-timestamp

      // El brandId es todo menos el primero y el último

      if (parts.length >= 3) {

        return parts.slice(1, -1).join('-');

      }

      

      return null;

    } catch (e) {

      console.error('[Wompi] Error extrayendo brandId:', e);

      return null;

    }

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

  async getTransactionByReference(reference: string): Promise<{ id: string; reference: string; status: string; amount_in_cents: number; currency: string } | null> {

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

      const json = await response.json() as { data: { id: string; reference: string; status: string; amount_in_cents: number; currency: string }[] };

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

  async getCheckoutUrl(brandId: string, amountCOP: number, redirectUrl: string, cardOnly = false, months: number = 1, plan: string = 'BASIC', referenceOverride?: string, productName?: string): Promise<string> {

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

    

    if (productName) {

      params.push(`name=${encode(productName)}`);

    }



    return `https://checkout.wompi.co/p/?${params.join('&')}`;

  }



  /**

   * Verifica si un pago de suscripción ya fue procesado exitosamente.

   * Esta es la base de la idempotencia para webhooks de Wompi.

   *

   * Retorna { alreadyProcessed: true } si ya existe un registro 'completed' en

   * subscription_payments para la referencia dada.

   *

   * También detecta si la suscripción ya fue activada para TRIAL.

   */

  async checkIdempotency(reference: string, brandId: string): Promise<{

    alreadyProcessed: boolean;

    existingPaymentId?: string;

    reason?: string;

  }> {

    // 1. Check subscription_payments por referencia + status 'completed'

    const { data: existingPayment } = await supabaseAdmin

      .from('subscription_payments')

      .select('id, status, brand_id, plan')

      .eq('reference', reference)

      .eq('status', 'completed')

      .maybeSingle();



    if (existingPayment) {

      return {

        alreadyProcessed: true,

        existingPaymentId: existingPayment.id,

        reason: `subscription_payments: pago completado (id=${existingPayment.id})`,

      };

    }



    // 2. Para TRIAL: check si la brand ya tiene trial_payment_status='active'

    // Si la referencia empieza con TRIAL-, verificamos si el trial ya está activo

    if (reference.startsWith('TRIAL-')) {

      const { data: brand } = await supabaseAdmin

        .from('brands')

        .select('id, trial_payment_status')

        .eq('id', brandId)

        .maybeSingle();



      if (brand?.trial_payment_status === 'active') {

        return {

          alreadyProcessed: true,

          reason: `TRIAL: trial_payment_status ya es 'active' para brand=${brandId}`,

        };

      }

    }



    // 3. Check pendiente de plan_change para evitar re-procesar upgrades

    const { data: planChange } = await supabaseAdmin

      .from('plan_changes')

      .select('id, status')

      .eq('reference', reference)

      .eq('status', 'completed')

      .maybeSingle();



    if (planChange) {

      return {

        alreadyProcessed: true,

        existingPaymentId: planChange.id,

        reason: `plan_changes: cambio de plan completado (id=${planChange.id})`,

      };

    }



    return { alreadyProcessed: false };

  }

}



export const wompiService = new WompiService();

