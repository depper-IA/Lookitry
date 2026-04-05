import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';

type PaypalOrderRecord = {
  reference: string;
  brand_id: string | null;
  email: string | null;
  plan: string;
  months: number;
  amount_cop: number;
  trm: number;
  amount_usd_expected: number;
  order_id: string | null;
  status: string | null;
};

export class PaypalService {
  convertCopToUsd(amountCOP: number, trm: number): number {
    const safeTrm = trm > 0 ? trm : 3900;
    return Math.ceil(amountCOP / safeTrm);
  }

  private isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private async getActiveKeys() {
    // Prioridad 1: Variables de entorno (seguridad y facilidad de despliegue)
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      return {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        sandbox: process.env.PAYPAL_SANDBOX === 'true'
      };
    }

    // Prioridad 2: Base de datos (configuración dinámica desde el panel admin)
    const { data: settings, error } = await supabaseAdmin
      .from('payment_settings')
      .select('paypal_enabled, paypal_client_id, paypal_client_secret, paypal_prod_client_id, paypal_prod_client_secret, paypal_sandbox')
      .eq('id', 1)
      .single();

    if (error || !settings) {
      throw new Error('No se pudo cargar la configuración de PayPal');
    }

    if (!settings.paypal_enabled) {
      throw new Error('PayPal no está habilitado en este momento');
    }

    const sandbox = !!settings.paypal_sandbox;

    return sandbox
      ? {
          clientId: settings.paypal_client_id,
          clientSecret: settings.paypal_client_secret,
          sandbox: true
        }
      : {
          clientId: settings.paypal_prod_client_id || settings.paypal_client_id,
          clientSecret: settings.paypal_prod_client_secret || settings.paypal_client_secret,
          sandbox: false
        };
  }

  private async getAccessToken(): Promise<string> {
    const { clientId, clientSecret, sandbox } = await this.getActiveKeys();
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  }

  /**
   * Crea una orden en PayPal
   * @param amountCOP Monto en COP
   * @param trm Tasa representativa del mercado (COP -> USD)
   * @param reference Referencia de pago interna
   * @param returnUrl URL de retorno exitoso (opcional)
   * @param cancelUrl URL de cancelación (opcional)
   */
  async createOrder(
    amountCOP: number,
    trm: number,
    reference: string,
    returnUrl?: string,
    cancelUrl?: string,
    planStr: string = 'UNKNOWN'
  ): Promise<{ checkoutUrl: string; orderId: string; amountUSD: number }> {
    const accessToken = await this.getAccessToken();
    const { sandbox } = await this.getActiveKeys();
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    // Convertir COP a USD (PayPal no acepta COP directamente para suscripciones)
    const amountUSD = this.convertCopToUsd(amountCOP, trm);

    const shortRef = reference.length > 254 ? reference.substring(0, 254) : reference;
    const returnUrlFinal = returnUrl || `${process.env.FRONTEND_URL}/pago-exitoso?method=paypal&ref=${encodeURIComponent(reference)}`;
    const cancelUrlFinal = cancelUrl || `${process.env.FRONTEND_URL}/checkout`;

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'Lookitry',
              landing_page: 'BILLING',
              user_action: 'PAY_NOW',
              return_url: returnUrlFinal,
              cancel_url: cancelUrlFinal
            }
          }
        },
        purchase_units: [
          {
            reference_id: shortRef,
            amount: {
              currency_code: 'USD',
              value: amountUSD.toFixed(2)
            },
            description: `Suscripción Lookitry - Plan ${planStr}`
          }
        ]
      },

      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    // Buscar el link de aprobación
    const approveLink = response.data.links.find((l: any) => l.rel === 'approve');
    if (!approveLink) throw new Error('No se pudo generar el link de aprobación de PayPal');

    return {
      checkoutUrl: approveLink.href,
      orderId: response.data.id,
      amountUSD,
    };
  }

  /**
   * Captura el pago aprobado por el usuario
   */
  async captureOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const { sandbox } = await this.getActiveKeys();
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  }

  /**
   * Obtiene el detalle de una orden de PayPal para verificar su estado
   */
  async getOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const { sandbox } = await this.getActiveKeys();
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const response = await axios.get(
      `${baseUrl}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  }

  extractReference(source: any): string | null {
    const purchaseUnit = source?.purchase_units?.[0];
    return (
      purchaseUnit?.custom_id ||
      purchaseUnit?.invoice_id ||
      purchaseUnit?.reference_id ||
      source?.custom_id ||
      source?.invoice_id ||
      source?.supplementary_data?.related_ids?.order_id ||
      null
    );
  }

  extractAmountUsd(source: any): number | null {
    const purchaseUnit = source?.purchase_units?.[0];
    const captureAmount = purchaseUnit?.payments?.captures?.[0]?.amount?.value;
    const orderAmount = purchaseUnit?.amount?.value;
    const raw = captureAmount ?? orderAmount ?? source?.amount?.value;
    const parsed = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }

  async recordOrder(payload: PaypalOrderRecord): Promise<void> {
    const { error } = await supabaseAdmin.from('paypal_orders').upsert(payload, {
      onConflict: 'reference',
    });

    if (error) {
      throw new Error(`No se pudo registrar la orden PayPal: ${error.message}`);
    }
  }

  async getTrackedOrder(reference: string): Promise<PaypalOrderRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('paypal_orders')
      .select('reference, brand_id, email, plan, months, amount_cop, trm, amount_usd_expected, order_id, status')
      .eq('reference', reference)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo consultar paypal_orders: ${error.message}`);
    }

    return (data as PaypalOrderRecord | null) ?? null;
  }

  async markOrderStatus(reference: string, status: string, orderId?: string | null): Promise<void> {
    const patch: Record<string, unknown> = { status };
    if (orderId) {
      patch.order_id = orderId;
    }

    const { error } = await supabaseAdmin
      .from('paypal_orders')
      .update(patch)
      .eq('reference', reference);

    if (error) {
      throw new Error(`No se pudo actualizar paypal_orders: ${error.message}`);
    }
  }

  /**
   * Intenta atomicizar el procesamiento de una orden (lock optimista).
   * Retorna true si fue exitoso (la orden estaba en estado válido para procesar).
   * Retorna false si ya estaba procesada/completada.
   */
  async tryStartProcessing(reference: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('paypal_orders')
      .update({ status: 'processing' })
      .eq('reference', reference)
      .in('status', ['pending', 'failed'])
      .select();

    if (error) {
      console.error('[PayPal] Error en tryStartProcessing:', error.message);
      return false;
    }

    // Si data.length > 0, pudimos adquirir el lock
    return data && data.length > 0;
  }

  /**
   * Verifica la firma de un webhook de PayPal
   * Nota: Idealmente se usa el endpoint de validación de PayPal o una librería
   */
  async verifyWebhookSignature(req: any): Promise<boolean> {
    // PayPal Webhook verification:
    // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
    //
    // En producción, rechazamos si no se puede verificar.
    const strict = this.isProd();

    const webhookId =
      process.env.PAYPAL_WEBHOOK_ID ||
      process.env.PAYPAL_WEBHOOK_ID_SANDBOX ||
      '';

    if (!webhookId) {
      if (strict) return false;
      return true;
    }

    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const certUrl = req.headers['paypal-cert-url'];
    const authAlgo = req.headers['paypal-auth-algo'];
    const transmissionSig = req.headers['paypal-transmission-sig'];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      if (strict) return false;
      return true;
    }

    try {
      const accessToken = await this.getAccessToken();
      const { sandbox } = await this.getActiveKeys();
      const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

      const resp = await axios.post(
        `${baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: req.body,
        },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` } }
      );

      return resp.data?.verification_status === 'SUCCESS';
    } catch (e) {
      if (strict) return false;
      return true;
    }
  }
}

export const paypalService = new PaypalService();
