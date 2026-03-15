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
   */
  async getWidgetConfig(plan: 'BASIC' | 'PRO'): Promise<WompiWidgetConfig> {
    const response = await api.get<WompiWidgetConfig>('/payments/wompi/config', {
      params: { plan },
    });
    return response.data;
  }
}

export const wompiService = new WompiService();
