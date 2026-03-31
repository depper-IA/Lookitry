import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WompiButton from '@/components/payments/WompiButton';

const mockGetWidgetConfig = vi.fn();
const mockGetCheckoutUrl = vi.fn();
const mockOpen = vi.fn();
const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

vi.mock('@/services/wompi.service', () => ({
  wompiService: {
    getWidgetConfig: (...args: unknown[]) => mockGetWidgetConfig(...args),
    getCheckoutUrl: (...args: unknown[]) => mockGetCheckoutUrl(...args),
  },
}));

describe('WompiButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    (window as any).WidgetCheckout = vi.fn(function WidgetCheckout() {
      return {
        open: mockOpen,
      };
    });
  });

  it('carga el script y ejecuta onSuccess cuando Wompi aprueba el pago', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    mockGetWidgetConfig.mockResolvedValue({
      currency: 'COP',
      amountInCents: 15000000,
      reference: 'TRYON-1',
      publicKey: 'pub',
      signature: 'sig',
    });

    render(
      <WompiButton plan="BASIC" onSuccess={onSuccess} onError={onError}>
        Pagar ahora
      </WompiButton>
    );

    const script = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]') as HTMLScriptElement;
    script.dispatchEvent(new Event('load'));

    const button = await screen.findByRole('button', { name: /pagar ahora/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    fireEvent.click(button);

    await waitFor(() => expect(mockGetWidgetConfig).toHaveBeenCalled());
    await waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1));

    const callback = mockOpen.mock.calls[0][0];
    callback({ transaction: { status: 'APPROVED' } });

    expect(onSuccess).toHaveBeenCalledWith({ transaction: { status: 'APPROVED' } });
    expect(onError).not.toHaveBeenCalled();
    expect(mockGetCheckoutUrl).not.toHaveBeenCalled();
  });

  it('reporta pagos pendientes por onError', async () => {
    const onError = vi.fn();
    mockGetWidgetConfig.mockResolvedValue({
      currency: 'COP',
      amountInCents: 15000000,
      reference: 'TRYON-1',
      publicKey: 'pub',
      signature: 'sig',
    });

    render(<WompiButton plan="PRO" onSuccess={vi.fn()} onError={onError} />);

    const script = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]') as HTMLScriptElement;
    script.dispatchEvent(new Event('load'));

    const button = await screen.findByRole('button', { name: /pagar con wompi/i });
    await waitFor(() => expect(button).not.toBeDisabled());
    fireEvent.click(button);

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());
    const callback = mockOpen.mock.calls[0][0];
    callback({ transaction: { status: 'PENDING' } });

    expect(onError).toHaveBeenCalledWith('Estamos verificando tu pago con Wompi.');
  });

  it('usa checkout hospedado si el script no carga', async () => {
    const onError = vi.fn();
    mockGetCheckoutUrl.mockResolvedValue({
      checkoutUrl: 'https://checkout.wompi.co/l/test-link',
      reference: 'TRYON-2',
    });

    render(<WompiButton plan="BASIC" onSuccess={vi.fn()} onError={onError} />);

    const script = document.querySelector('script[src="https://checkout.wompi.co/widget.js"]') as HTMLScriptElement;
    script.dispatchEvent(new Event('error'));

    const button = await screen.findByRole('button', { name: /pagar con wompi/i });
    fireEvent.click(button);

    await waitFor(() => expect(mockGetCheckoutUrl).toHaveBeenCalledWith('BASIC', 1, undefined, false));
    expect(openSpy).toHaveBeenCalledWith('https://checkout.wompi.co/l/test-link', '_self');
    expect(onError).not.toHaveBeenCalled();
  });
});
