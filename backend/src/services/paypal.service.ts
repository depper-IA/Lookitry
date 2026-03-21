import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';

export class PaypalService {
  private async getActiveKeys() {
    const { data: settings, error } = await supabaseAdmin
      .from('payment_settings')
      .select('paypal_enabled, paypal_client_id, paypal_client_secret, paypal_sandbox')
      .eq('id', 1)
      .single();

    if (error || !settings) {
      throw new Error('No se pudo cargar la configuración de PayPal');
    }

    if (!settings.paypal_enabled) {
      throw new Error('PayPal no está habilitado en este momento');
    }

    return {
      clientId: settings.paypal_client_id,
      clientSecret: settings.paypal_client_secret,
      sandbox: settings.paypal_sandbox
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
   */
  async createOrder(amountCOP: number, trm: number, reference: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    const { sandbox } = await this.getActiveKeys();
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    // Convertir COP a USD (PayPal no acepta COP directamente para suscripciones)
    const amountUSD = Math.ceil(amountCOP / trm);

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: reference,
            amount: {
              currency_code: 'USD',
              value: amountUSD.toString()
            },
            description: `Suscripción Lookitry - Ref: ${reference}`
          }
        ],
        application_context: {
          brand_name: 'Lookitry',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/pago-exitoso?method=paypal&ref=${reference}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout`
        }
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

    return approveLink.href;
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
}

export const paypalService = new PaypalService();
