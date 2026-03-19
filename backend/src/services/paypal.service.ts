
import axios from 'axios';
import { PaymentSettingsService } from './paymentSettings.service';

/**
 * PayPalService
 * 
 * Maneja la integración oficial con la API REST de PayPal.
 */
class PayPalService {
  private async getAccessToken() {
    const settings = await new PaymentSettingsService().getSettings();
    const clientId = process.env.PAYPAL_CLIENT_ID || settings.paypal_client_id;
    const secret = process.env.PAYPAL_SECRET || settings.paypal_client_secret;
    const isSandbox = settings.paypal_sandbox ?? true;

    const baseUrl = isSandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const response = await axios({
      url: `${baseUrl}/v1/oauth2/token`,
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: 'grant_type=client_credentials',
    });

    return {
      token: response.data.access_token,
      baseUrl
    };
  }

  async createOrder(amountUSD: number, reference: string, description: string) {
    try {
      const { token, baseUrl } = await this.getAccessToken();

      const response = await axios({
        url: `${baseUrl}/v2/checkout/orders`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: reference,
              amount: {
                currency_code: 'USD',
                value: amountUSD.toFixed(2),
              },
              description: description,
            },
          ],
          application_context: {
            brand_name: 'Lookitry',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
            return_url: `${process.env.FRONTEND_URL}/pago-exitoso?ref=${reference}&method=paypal`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
          },
        },
      });

      const approveLink = response.data.links.find((l: any) => l.rel === 'approve');
      return {
        orderId: response.data.id,
        approveUrl: approveLink.href,
      };
    } catch (error: any) {
      console.error('[PayPal] Error al crear orden:', error.response?.data || error.message);
      throw new Error('Error al generar el pago con PayPal');
    }
  }
}

export const paypalService = new PayPalService();
