// Feature: checkout-email-registro-pro

// Property 2: Pending registration round-trip

// Validates: Requirements 2.1, 2.5



import * as fc from 'fast-check';



/**

 * Property 2: Pending registration round-trip

 *

 * Para cualquier combinación válida de email, plan y months, cuando el controlador

 * getCheckoutUrl recibe una solicitud sin sesión con email, el INSERT a

 * pending_registrations debe recibir exactamente los valores generados.

 *

 * Validates: Requirements 2.1, 2.5

 */



// ââ Mocks ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



// Mock de supabaseAdmin â captura los argumentos del INSERT

const mockInsert = jest.fn();

const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

const mockEq = jest.fn().mockReturnThis();

const mockSelect = jest.fn().mockReturnThis();

const mockFrom = jest.fn().mockImplementation(() => ({

  insert: mockInsert,

  select: mockSelect,

  eq: mockEq,

  single: mockSingle,

}));



jest.mock('../../config/supabase', () => ({

  supabaseAdmin: { 

    from: (table: string) => mockFrom(table),

  },

  supabase: { from: jest.fn() },

}));



// Mock de pricingService

jest.mock('../../services/pricing.service', () => ({

  pricingService: {

    calculateTotal: jest.fn().mockResolvedValue(250000),

    calculateExternalCheckoutTotal: jest.fn().mockResolvedValue(250000),

    getPricingConfig: jest.fn().mockResolvedValue([]),

  },

}));



// Mock de wompiService â devuelve una checkoutUrl y expone generateReference

const mockGetCheckoutUrl = jest.fn();

const mockGenerateReference = jest.fn();



jest.mock('../../services/wompi.service', () => ({

  WompiService: jest.fn().mockImplementation(() => ({

    getCheckoutUrl: mockGetCheckoutUrl,

    generateReference: mockGenerateReference,

  })),

  wompiService: {

    getCheckoutUrl: (...args: any[]) => mockGetCheckoutUrl(...args),

    generateReference: (...args: any[]) => mockGenerateReference(...args),

    verifyWebhookSignature: jest.fn().mockResolvedValue(true),

    extractBrandIdFromReference: jest.fn().mockReturnValue(null),

    extractMetaFromReference: jest.fn().mockReturnValue({ months: 1, plan: 'BASIC' }),

    getWidgetConfig: jest.fn(),

    generateIntegritySignature: jest.fn(),

  },

}));



// ââ Importar el controlador DESPUÑS de los mocks ââââââââââââââââââââââââââââââ

import { WompiController } from '../../controllers/wompi.controller';



// ââ Helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



/** Construye un objeto Request mínimo para getCheckoutUrl */

function buildRequest(email: string, plan: string, months: number) {

  return {

    query: { email, plan, months: String(months), amount: '250000' },

    brand: undefined, // sin sesión

  } as any;

}



/** Construye un objeto Response mínimo con spies */

function buildResponse() {

  const res: any = {};

  res.status = jest.fn().mockReturnValue(res);

  res.json = jest.fn().mockReturnValue(res);

  return res;

}



// ââ Tests âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



describe('Property-Based Tests: checkout-email-registro-pro', () => {

  let controller: WompiController;



  beforeEach(() => {

    jest.clearAllMocks();

    controller = new WompiController();



    // Por defecto el INSERT tiene éxito

    mockInsert.mockResolvedValue({ error: null });



    // getCheckoutUrl del servicio devuelve una URL de ejemplo

    mockGetCheckoutUrl.mockResolvedValue('https://checkout.wompi.co/l/?data=test');

  });



  describe('Property 2: Pending registration round-trip', () => {

    it('el INSERT recibe exactamente email, plan, months y reference generados', async () => {

      await fc.assert(

        fc.asyncProperty(

          fc.record({

            email: fc.emailAddress(),

            plan: fc.constantFrom('BASIC', 'PRO'),

            months: fc.integer({ min: 1, max: 12 }),

          }),

          async ({ email, plan, months }) => {

            jest.clearAllMocks();



            // La referencia que genera el servicio para este caso

            const fixedNow = Date.now();

            const expectedReference = `visitor_${fixedNow}-${plan}-${months}`;

            mockGenerateReference.mockReturnValue(expectedReference);

            mockInsert.mockResolvedValue({ error: null });

            mockGetCheckoutUrl.mockResolvedValue('https://checkout.wompi.co/l/?data=test');



            const req = buildRequest(email, plan, months);

            const res = buildResponse();



            await controller.getCheckoutUrl(req, res);



            // El controlador debe haber llamado a supabaseAdmin.from('pending_registrations')

            expect(mockFrom).toHaveBeenCalledWith('pending_registrations');



            // El INSERT debe recibir exactamente los valores generados

            expect(mockInsert).toHaveBeenCalledWith(

              expect.objectContaining({

                email,

                plan: plan.toUpperCase(),

                months,

                reference: expectedReference,

              })

            );



            // La respuesta debe ser exitosa (no 500)

            expect(res.status).not.toHaveBeenCalledWith(500);

          }

        ),

        { numRuns: 100 }

      );

    });



    it('retorna 500 y no devuelve checkoutUrl si el INSERT falla', async () => {

      await fc.assert(

        fc.asyncProperty(

          fc.record({

            email: fc.emailAddress(),

            plan: fc.constantFrom('BASIC', 'PRO'),

            months: fc.integer({ min: 1, max: 12 }),

          }),

          async ({ email, plan, months }) => {

            jest.clearAllMocks();

            const fixedNow = Date.now();

            const expectedReference = `visitor_${fixedNow}-${plan}-${months}`;

            mockGenerateReference.mockReturnValue(expectedReference);



            // Simular fallo del INSERT

            mockInsert.mockResolvedValue({ error: { message: 'DB error' } });



            const req = buildRequest(email, plan, months);

            const res = buildResponse();



            await controller.getCheckoutUrl(req, res);



            // Debe retornar 500

            expect(res.status).toHaveBeenCalledWith(500);



            // No debe retornar checkoutUrl

            const jsonCalls = res.json.mock.calls;

            for (const [body] of jsonCalls) {

              expect(body).not.toHaveProperty('checkoutUrl');

            }

          }

        ),

        { numRuns: 100 }

      );

    });



    it('no crea pending_registration cuando el usuario tiene sesión activa', async () => {

      await fc.assert(

        fc.asyncProperty(

          fc.record({

            email: fc.emailAddress(),

            plan: fc.constantFrom('BASIC', 'PRO'),

            months: fc.integer({ min: 1, max: 12 }),

            brandId: fc.uuid(),

          }),

          async ({ email, plan, months, brandId }) => {

            jest.clearAllMocks();



            mockGenerateReference.mockReturnValue(`${brandId}-${plan}-${months}`);

            mockInsert.mockResolvedValue({ error: null });

            mockGetCheckoutUrl.mockResolvedValue('https://checkout.wompi.co/l/?data=test');



            // Solicitud CON sesión activa

            const req = {

              query: { email, plan, months: String(months), amount: '250000' },

              brand: { id: brandId },

            } as any;

            const res = buildResponse();



            await controller.getCheckoutUrl(req, res);



            // Con sesión activa NO debe insertar en pending_registrations

            const pendingInsertCalls = (mockFrom.mock.calls as string[][]).filter(

              (args) => args[0] === 'pending_registrations'

            );

            expect(pendingInsertCalls).toHaveLength(0);

          }

        ),

        { numRuns: 100 }

      );

    });

  });

});

