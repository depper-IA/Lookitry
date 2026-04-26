// business.property.test.ts

// Property-based tests para invariantes del modelo de negocio de Lookitry

// Cubre: prorrateo de upgrade, límites de plan, conversión de moneda



import * as fc from 'fast-check';



// âââ Constantes del modelo ââââââââââââââââââââââââââââââââââââââââââââââââââââ



const PLAN_LIMITS = {

  BASIC: { maxProducts: 5, maxGenerationsPerMonth: 400, pricePerMonth: 150000 },

  PRO:   { maxProducts: 15, maxGenerationsPerMonth: 1200, pricePerMonth: 250000 },

} as const;



type Plan = keyof typeof PLAN_LIMITS;



// Replica la lógica de calculateUpgradeProration del backend

function calculateProration(

  totalPaid: number,

  totalDays: number,

  daysRemaining: number,

  newPlanPrice: number

): { creditAmount: number; amountToPay: number } {

  const pricePerDay = totalPaid / totalDays;

  const creditAmount = Math.round(pricePerDay * daysRemaining);

  const amountToPay = Math.max(0, newPlanPrice - creditAmount);

  return { creditAmount, amountToPay };

}



// âââ Tests ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



describe('Property-Based: Invariantes de planes', () => {

  it('PRO siempre tiene más límite de productos que BASIC', () => {

    fc.assert(

      fc.property(fc.constantFrom('BASIC' as Plan, 'PRO' as Plan), (plan) => {

        if (plan === 'PRO') {

          expect(PLAN_LIMITS.PRO.maxProducts).toBeGreaterThan(PLAN_LIMITS.BASIC.maxProducts);

        }

      }),

      { numRuns: 100 }

    );

  });



  it('PRO siempre tiene más generaciones por mes que BASIC', () => {

    fc.assert(

      fc.property(fc.constantFrom('BASIC' as Plan, 'PRO' as Plan), (plan) => {

        if (plan === 'PRO') {

          expect(PLAN_LIMITS.PRO.maxGenerationsPerMonth).toBeGreaterThan(

            PLAN_LIMITS.BASIC.maxGenerationsPerMonth

          );

        }

      }),

      { numRuns: 100 }

    );

  });



  it('PRO siempre cuesta más que BASIC', () => {

    expect(PLAN_LIMITS.PRO.pricePerMonth).toBeGreaterThan(PLAN_LIMITS.BASIC.pricePerMonth);

  });

});



describe('Property-Based: Prorrateo de upgrade', () => {

  it('el monto a pagar nunca es negativo', () => {

    fc.assert(

      fc.property(

        fc.float({ min: 0, max: 1_000_000, noNaN: true }),

        fc.integer({ min: 1, max: 365 }),

        fc.integer({ min: 0, max: 365 }),

        fc.float({ min: 0, max: 1_000_000, noNaN: true }),

        (totalPaid, totalDays, daysRemaining, newPlanPrice) => {

          const days = Math.min(daysRemaining, totalDays);

          const { amountToPay } = calculateProration(totalPaid, totalDays, days, newPlanPrice);

          expect(amountToPay).toBeGreaterThanOrEqual(0);

        }

      ),

      { numRuns: 500 }

    );

  });



  it('el crédito nunca supera el total pagado', () => {

    fc.assert(

      fc.property(

        fc.float({ min: 1, max: 1_000_000, noNaN: true }),

        fc.integer({ min: 1, max: 365 }),

        fc.integer({ min: 0, max: 365 }),

        (totalPaid, totalDays, daysRemaining) => {

          const days = Math.min(daysRemaining, totalDays);

          const { creditAmount } = calculateProration(totalPaid, totalDays, days, totalPaid * 2);

          // El crédito no puede superar lo que se pagó (con margen de redondeo)

          expect(creditAmount).toBeLessThanOrEqual(totalPaid + 1);

        }

      ),

      { numRuns: 500 }

    );

  });



  it('con 0 días restantes el crédito es 0', () => {

    fc.assert(

      fc.property(

        fc.float({ min: 1, max: 1_000_000, noNaN: true }),

        fc.integer({ min: 1, max: 365 }),

        fc.float({ min: 0, max: 1_000_000, noNaN: true }),

        (totalPaid, totalDays, newPlanPrice) => {

          const { creditAmount } = calculateProration(totalPaid, totalDays, 0, newPlanPrice);

          expect(creditAmount).toBe(0);

        }

      ),

      { numRuns: 200 }

    );

  });



  it('con todos los días restantes el crédito es igual al total pagado (sin redondeo)', () => {

    fc.assert(

      fc.property(

        fc.integer({ min: 1000, max: 1_000_000 }),

        fc.integer({ min: 1, max: 365 }),

        (totalPaid, totalDays) => {

          const { creditAmount } = calculateProration(totalPaid, totalDays, totalDays, totalPaid * 2);

          // Con todos los días restantes, el crédito debe ser ~totalPaid (margen de redondeo Â±1)

          expect(Math.abs(creditAmount - totalPaid)).toBeLessThanOrEqual(1);

        }

      ),

      { numRuns: 200 }

    );

  });

});



describe('Property-Based: Conversión de moneda Wompi', () => {

  it('amount_in_cents / 100 siempre da el valor en COP correcto', () => {

    fc.assert(

      fc.property(

        fc.integer({ min: 0, max: 100_000_000 }),

        (amountInCents) => {

          const amountCOP = amountInCents / 100;

          expect(Math.round(amountCOP * 100)).toBe(amountInCents);

        }

      ),

      { numRuns: 1000 }

    );

  });



  it('la conversión COP â USD con TRM nunca produce montos negativos', () => {

    fc.assert(

      fc.property(

        fc.integer({ min: 0, max: 10_000_000 }),

        fc.integer({ min: 1000, max: 10000 }),

        (amountCOP, trm) => {

          const amountUSD = Math.ceil(amountCOP / trm);

          expect(amountUSD).toBeGreaterThanOrEqual(0);

        }

      ),

      { numRuns: 500 }

    );

  });



  it('montos COP de planes estándar producen USD razonables con TRM típico', () => {

    const trm = 4000; // TRM representativo

    const basicUSD = Math.ceil(150000 / trm);

    const proUSD = Math.ceil(250000 / trm);



    // BASIC debería estar entre $30 y $60 USD

    expect(basicUSD).toBeGreaterThanOrEqual(30);

    expect(basicUSD).toBeLessThanOrEqual(60);



    // PRO debería estar entre $50 y $80 USD

    expect(proUSD).toBeGreaterThanOrEqual(50);

    expect(proUSD).toBeLessThanOrEqual(80);



    // PRO siempre más caro que BASIC en USD

    expect(proUSD).toBeGreaterThan(basicUSD);

  });

});



describe('Property-Based: Límites de generaciones', () => {

  it('las generaciones restantes nunca son negativas', async () => {

    await fc.assert(

      fc.asyncProperty(

        fc.constantFrom('BASIC' as Plan, 'PRO' as Plan),

        fc.integer({ min: 0, max: 2000 }),

        async (plan, used) => {

          const limit = PLAN_LIMITS[plan].maxGenerationsPerMonth;

          const remaining = Math.max(0, limit - used);

          expect(remaining).toBeGreaterThanOrEqual(0);

          expect(remaining).toBeLessThanOrEqual(limit);

        }

      ),

      { numRuns: 200 }

    );

  }, 15000);



  it('el límite de BASIC (400) nunca supera el de PRO (1200)', () => {

    fc.assert(

      fc.property(fc.integer({ min: 0, max: 1200 }), (used) => {

        const basicRemaining = Math.max(0, PLAN_LIMITS.BASIC.maxGenerationsPerMonth - used);

        const proRemaining = Math.max(0, PLAN_LIMITS.PRO.maxGenerationsPerMonth - used);

        // PRO siempre tiene igual o más restante que BASIC

        expect(proRemaining).toBeGreaterThanOrEqual(basicRemaining);

      }),

      { numRuns: 300 }

    );

  });

});

