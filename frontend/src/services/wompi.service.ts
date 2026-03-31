import { api } from './api';

export interface WompiWidgetConfig {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
}

class WompiService {
  /**
   * Obtiene la configuración del widget de Wompi desde el backend.
   * El backend genera la referencia y la firma de integridad.
   * Se pasan plan, months y amount para que la referencia los incluya
   * y el webhook pueda extraerlos correctamente al activar la suscripción.
   */
  async getWidgetConfig(plan: 'BASIC' | 'PRO' | 'NONE', months: number = 1, amount?: number, includesLanding: boolean = false): Promise<WompiWidgetConfig> {
    let url = `/payments/wompi/config?plan=${plan}&months=${months}`;
    if (amount) url += `&amount=${amount}`;
    if (includesLanding) url += `&includes_landing=true`;
    const response = await api.get<WompiWidgetConfig>(url);
    return response.data;
  }

  async getCheckoutUrl(
    plan: 'BASIC' | 'PRO' | 'NONE',
    months: number = 1,
    amount?: number,
    includesLanding: boolean = false
  ): Promise<{ checkoutUrl: string; reference: string }> {
    let url = `/payments/wompi/checkout-url?plan=${plan}&months=${months}`;
    if (amount) url += `&amount=${amount}`;
    if (includesLanding) url += `&includes_landing=true`;
    const response = await api.get<{ checkoutUrl: string; reference: string }>(url);
    return response.data;
  }
}

export const wompiService = new WompiService();
