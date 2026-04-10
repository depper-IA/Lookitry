import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { paymentsService } from '@/services/payments.service';

describe('paymentsService.checkoutAddon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía el payload esperado al backend', async () => {
    mockPost.mockResolvedValue({
      data: {
        gateway: 'wompi',
        reference: 'ADDON-123',
        checkoutUrl: 'https://checkout.test',
      },
    });

    const result = await paymentsService.checkoutAddon('credits_1000', 'wompi');

    expect(mockPost).toHaveBeenCalledWith('/payments/checkout-addon', {
      packageId: 'credits_1000',
      gateway: 'wompi',
    });
    expect(result.reference).toBe('ADDON-123');
  });

  it('usa credits_500 por defecto si no recibe packageId', async () => {
    mockPost.mockResolvedValue({
      data: {
        gateway: 'paypal',
        reference: 'ADDON-999',
        checkoutUrl: 'https://paypal.test',
      },
    });

    await paymentsService.checkoutAddon();

    expect(mockPost).toHaveBeenCalledWith('/payments/checkout-addon', {
      packageId: 'credits_500',
      gateway: undefined,
    });
  });
});
