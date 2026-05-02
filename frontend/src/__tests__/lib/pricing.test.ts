import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  clientesParaMeta,
  getPricingConfig,
  margenPorCliente,
  precioConDescuento,
  precioEnUSD,
} from '@/lib/pricing';

describe('pricing helpers', () => {
  it('calcula el descuento por duración correcto', () => {
    expect(
      precioConDescuento(100000, 6, {
        meses_1: 0,
        meses_3: 5,
        meses_6: 10,
        meses_12: 15,
      })
    ).toBe(90000);
  });

  it('calcula clientes necesarios para la meta redondeando hacia arriba', () => {
    expect(clientesParaMeta(500000, 180000)).toBe(3);
  });

  it('calcula margen por cliente incluyendo costos fijos prorrateados', () => {
    expect(margenPorCliente(180000, 400, 25, 84000, 4)).toBe(149000);
  });

  it('usa TRM fallback si recibe 0 o negativo', () => {
    // Fórmula: Math.ceil((precioCOP + 10000) / safeTrm) con safeTrm = 3900 cuando trm <= 0
    expect(precioEnUSD(390000, 0)).toBe(103); // (390000 + 10000) / 3900 = 102.56 → ceil 103
    expect(precioEnUSD(390000, -10)).toBe(103);
    // Con TRM positivo normal
    expect(precioEnUSD(390000, 4000)).toBe(100); // 400000 / 4000 = 100
  });
});

describe('getPricingConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aplica promociones activas sobre el precio base', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 'basic', data: { precio_mensual_cop: 200000, features: [] } },
            { id: 'descuentos_duracion', data: { meses_1: 0, meses_3: 5, meses_6: 10, meses_12: 15 } },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              type: 'plan_override',
              config: { plan: 'BASIC', override_price: 150000, original_price: 200000 },
            },
            {
              type: 'launch_offer',
              config: { discount_pct: 10 },
            },
          ],
        })
    );

    const config = await getPricingConfig();

    expect(config.basic.precio_original_cop).toBe(200000);
    expect(config.basic.precio_mensual_cop).toBe(135000);
  });

  it('retorna defaults si falla la carga remota', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const config = await getPricingConfig();

    expect(config.basic.precio_mensual_cop).toBe(180000);
    expect(config.pro.precio_mensual_cop).toBe(350000);
  });
});
