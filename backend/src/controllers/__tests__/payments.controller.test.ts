import { Response } from 'express';

import { paymentsController } from '../payments.controller';



const mockCreateCheckoutForBrand = jest.fn();



jest.mock('../../services/addonCredits.service', () => ({

  addonCreditsService: {

    createCheckoutForBrand: (...args: unknown[]) => mockCreateCheckoutForBrand(...args),

  },

}));



function buildRes() {

  return {

    status: jest.fn().mockReturnThis(),

    json: jest.fn().mockReturnThis(),

  } as unknown as Response;

}



describe('PaymentsController.checkoutAddon', () => {

  beforeEach(() => {

    jest.clearAllMocks();

  });



  it('rechaza la compra si no hay sesión', async () => {

    const res = buildRes();



    await paymentsController.checkoutAddon({ body: {} } as any, res);



    expect(res.status).toHaveBeenCalledWith(401);

    expect(mockCreateCheckoutForBrand).not.toHaveBeenCalled();

  });



  it('delegua al servicio con brand, gateway y packageId', async () => {

    mockCreateCheckoutForBrand.mockResolvedValue({

      gateway: 'wompi',

      reference: 'ADDON-123',

      checkoutUrl: 'https://checkout.test',

    });

    const res = buildRes();



    await paymentsController.checkoutAddon(

      {

        brand: { id: 'brand-1' },

        body: { gateway: 'wompi', packageId: 'credits_500' },

      } as any,

      res

    );



    expect(mockCreateCheckoutForBrand).toHaveBeenCalledWith('brand-1', 'wompi', 'credits_500');

    expect(res.status).toHaveBeenCalledWith(200);

  });



  it('mapea errores del servicio a 400', async () => {

    mockCreateCheckoutForBrand.mockRejectedValue(new Error('Paquete inválido'));

    const res = buildRes();



    await paymentsController.checkoutAddon(

      {

        brand: { id: 'brand-1' },

        body: { gateway: 'paypal', packageId: 'bad' },

      } as any,

      res

    );



    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(

      expect.objectContaining({ message: 'Paquete inválido' })

    );

  });

});

