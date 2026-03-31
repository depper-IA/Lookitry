import { api } from './api';

export interface AddonCheckoutResponse {
  gateway: 'wompi' | 'paypal';
  reference: string;
  checkoutUrl: string;
}

class PaymentsService {
  async checkoutAddon(packageId = 'credits_500', gateway?: 'wompi' | 'paypal') {
    const response = await api.post<AddonCheckoutResponse>('/payments/checkout-addon', {
      packageId,
      gateway,
    });

    return response.data;
  }

  async verifyAddon(reference: string) {
    const response = await api.post<{ status: string; message?: string }>('/payments/verify-addon', {
      reference,
    });
    return response.data;
  }
}

export const paymentsService = new PaymentsService();
