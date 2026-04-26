// auth.service.unit.test.ts

// Tests unitarios para AuthService â login, verifyEmail, getBrandById, resetPassword



import bcrypt from 'bcryptjs';



// âââ Mocks ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



jest.mock('../../config/supabase', () => ({

  supabase: {},

  supabaseAdmin: {

    from: jest.fn(),

  },

}));



jest.mock('../../utils/jwt', () => ({

  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),

}));



jest.mock('../../services/email.service', () => ({

  EmailService: jest.fn().mockImplementation(() => ({

    sendEmail: jest.fn().mockResolvedValue(undefined),

  })),

}));



jest.mock('../../templates/email-templates', () => ({

  verifyEmailTemplate: jest.fn().mockReturnValue('<html>verify</html>'),

  passwordResetTemplate: jest.fn().mockReturnValue('<html>reset</html>'),

}));



// âââ Importar DESPUÑS de los mocks âââââââââââââââââââââââââââââââââââââââââââ



import { AuthService } from '../auth.service';

import { supabaseAdmin } from '../../config/supabase';



// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



function buildChain(resolvedValue: unknown) {

  const chain: Record<string, jest.Mock> = {};

  const methods = ['select', 'eq', 'update', 'insert', 'or', 'order', 'limit', 'gte', 'single', 'maybeSingle'];

  methods.forEach((m) => {

    chain[m] = jest.fn().mockReturnThis();

  });

  chain['single'] = jest.fn().mockResolvedValue(resolvedValue);

  chain['maybeSingle'] = jest.fn().mockResolvedValue(resolvedValue);

  return chain;

}



const mockBrand = {

  id: 'brand-uuid-001',

  email: 'test@lookitry.com',

  password: '', // se rellena en beforeEach con hash real

  name: 'Marca Test',

  slug: 'marca-test',

  plan: 'BASIC',

  email_verified: true,

  trial_end_date: null,

  trial_payment_status: null,

  subscription_status: 'active',

};



// âââ Tests ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



describe('AuthService', () => {

  let service: AuthService;



  beforeEach(async () => {

    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';

    mockBrand.password = await bcrypt.hash('password123', 10);

    service = new AuthService();

  });



  // âââ login ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



  describe('login', () => {

    it('debe retornar token y datos de la marca con credenciales válidas', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(buildChain({ data: mockBrand, error: null }));



      const result = await service.login({ email: 'test@lookitry.com', password: 'password123' });



      expect(result).toHaveProperty('token', 'mock-jwt-token');

      expect(result.brand.email).toBe('test@lookitry.com');

      expect(result.brand.plan).toBe('BASIC');

    });



    it('debe lanzar error con contraseña incorrecta', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(buildChain({ data: mockBrand, error: null }));



      await expect(service.login({ email: 'test@lookitry.com', password: 'wrong-pass' }))

        .rejects.toThrow('Credenciales inválidas');

    });



    it('debe lanzar error si el email no existe en la BD', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: null, error: { message: 'not found' } })

      );



      await expect(service.login({ email: 'noexiste@lookitry.com', password: 'pass' }))

        .rejects.toThrow('Credenciales inválidas');

    });



    it('debe incluir trialEndDate en la respuesta si la marca está en trial', async () => {

      const trialDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const trialBrand = { ...mockBrand, trial_end_date: trialDate };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(buildChain({ data: trialBrand, error: null }));



      const result = await service.login({ email: 'test@lookitry.com', password: 'password123' });



      expect(result.brand.trialEndDate).toBe(trialDate);

    });

  });



  // âââ verifyEmail ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



  describe('verifyEmail', () => {

    it('debe retornar ok:true con token válido no verificado', async () => {

      const chain = buildChain({ data: { id: 'brand-uuid-001', email_verified: false }, error: null });

      // Segunda llamada (update) también debe funcionar

      chain['update'] = jest.fn().mockReturnThis();

      (supabaseAdmin.from as jest.Mock).mockReturnValue(chain);



      const result = await service.verifyEmail('valid-token-abc');



      expect(result.ok).toBe(true);

      expect(result.message).toContain('verificado');

    });



    it('debe retornar ok:true si el email ya estaba verificado', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: { id: 'brand-uuid-001', email_verified: true }, error: null })

      );



      const result = await service.verifyEmail('already-verified-token');



      expect(result.ok).toBe(true);

      expect(result.message).toContain('ya fue verificado');

    });



    it('debe retornar ok:false con token inválido', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: null, error: null })

      );



      const result = await service.verifyEmail('token-inexistente');



      expect(result.ok).toBe(false);

      expect(result.message).toContain('inválido');

    });

  });



  // âââ getBrandById âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



  describe('getBrandById', () => {

    it('debe retornar la marca si existe', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: mockBrand, error: null })

      );



      const result = await service.getBrandById('brand-uuid-001');



      expect(result).not.toBeNull();

      expect(result?.id).toBe('brand-uuid-001');

    });



    it('debe retornar null si la marca no existe', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: null, error: { message: 'not found' } })

      );



      const result = await service.getBrandById('id-inexistente');



      expect(result).toBeNull();

    });

  });



  // âââ requestPasswordReset âââââââââââââââââââââââââââââââââââââââââââââââââ



  describe('requestPasswordReset', () => {

    it('no debe lanzar error aunque el email no exista (seguridad â no revelar existencia)', async () => {

      (supabaseAdmin.from as jest.Mock).mockReturnValue(

        buildChain({ data: null, error: null })

      );



      await expect(service.requestPasswordReset('noexiste@lookitry.com')).resolves.not.toThrow();

    });



    it('debe actualizar el reset_token si el email existe', async () => {

      const updateMock = jest.fn().mockReturnThis();

      const eqMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      const chain = buildChain({ data: { id: 'brand-uuid-001', name: 'Test', email: 'test@lookitry.com' }, error: null });

      chain['update'] = updateMock;

      updateMock.mockReturnValue({ eq: eqMock });



      (supabaseAdmin.from as jest.Mock).mockReturnValue(chain);



      await service.requestPasswordReset('test@lookitry.com');



      expect(updateMock).toHaveBeenCalledWith(

        expect.objectContaining({ reset_token: expect.any(String) })

      );

    });

  });

});

