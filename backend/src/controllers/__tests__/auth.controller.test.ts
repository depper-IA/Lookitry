import { Request, Response } from 'express';



const mockRegister = jest.fn();

const mockLogin = jest.fn();

const mockRequestPasswordResetGetToken = jest.fn();

const mockResetPassword = jest.fn();

const mockResendVerificationEmail = jest.fn();

const mockChangePassword = jest.fn();

const mockVerifyEmail = jest.fn();

const mockGetBrandById = jest.fn();

const mockSendEmail = jest.fn();

const mockGenerateToken = jest.fn().mockReturnValue('jwt-generado');

const mockSendWelcomeEmail = jest.fn();



jest.mock('../../services/auth.service', () => ({

  AuthService: jest.fn().mockImplementation(() => ({

    register: mockRegister,

    login: mockLogin,

    requestPasswordResetGetToken: mockRequestPasswordResetGetToken,

    resetPassword: mockResetPassword,

    resendVerificationEmail: mockResendVerificationEmail,

    changePassword: mockChangePassword,

    verifyEmail: mockVerifyEmail,

    getBrandById: mockGetBrandById,

  })),

}));



jest.mock('../../services/email.service', () => ({

  EmailService: jest.fn().mockImplementation(() => ({

    sendEmail: mockSendEmail,

  })),

}));



jest.mock('../../templates/email-templates', () => ({

  verifyEmailTemplate: jest.fn().mockReturnValue('<html>verify</html>'),

  passwordResetTemplate: jest.fn().mockReturnValue('<html>reset</html>'),

}));



jest.mock('../../utils/jwt', () => ({

  generateToken: (...args: unknown[]) => mockGenerateToken(...args),

}));



jest.mock('../../services/notification.service', () => ({

  notificationService: {

    sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),

  },

}));


import { AuthController } from '../auth.controller';

function buildReq(body: Record<string, unknown>, options: { ip?: string; authorization?: string } = {}) {
  return {
    body,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...(options.authorization ? { authorization: options.authorization } : {}),
    },
    ip: options.ip || '127.0.0.1',
    cookies: {},
  } as unknown as Request;
}

function buildRes() {

  const res = {

    status: jest.fn().mockReturnThis(),

    json: jest.fn().mockReturnThis(),

    cookie: jest.fn().mockReturnThis(),

  } as unknown as Response;

  return res;

}



describe('AuthController', () => {

  let controller: AuthController;



  beforeEach(() => {

    jest.clearAllMocks();

    controller = new AuthController();

    process.env.NODE_ENV = 'test';

    process.env.TURNSTILE_ENABLED = 'false'; // Desactivar validación Turnstile en tests

    mockSendEmail.mockResolvedValue(undefined);

    mockSendWelcomeEmail.mockResolvedValue(undefined);

  });



  describe('register', () => {

    it('rechaza cuando faltan campos requeridos', async () => {

      const req = { body: { email: 'qa@lookitry.com' } } as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(

        expect.objectContaining({ error: 'VALIDATION_ERROR' })

      );

      expect(mockRegister).not.toHaveBeenCalled();

    });



    it('rechaza emails desechables', async () => {

      const req = {

        body: {

          email: 'temp@mailinator.com',

          password: '123456',

          name: 'Marca QA',

          slug: 'marca-qa',

          contact_name: 'Persona QA',

        },

      } as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(

        expect.objectContaining({ error: 'DISPOSABLE_EMAIL' })

      );

    });



    it('rechaza slugs inválidos', async () => {

      const req = {

        body: {

          email: 'qa@lookitry.com',

          password: '123456',

          name: 'Marca QA',

          slug: 'Marca Invalida',

          contact_name: 'Persona QA',

        },

      } as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(

        expect.objectContaining({

          message: expect.stringContaining('slug'),

        })

      );

    });



    it('rechaza contraseñas cortas', async () => {

      const req = {

        body: {

          email: 'qa@lookitry.com',

          password: '123',

          name: 'Marca QA',

          slug: 'marca-qa',

          contact_name: 'Persona QA',

        },

      } as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(mockRegister).not.toHaveBeenCalled();

    });



    it('devuelve 201 y setea cookie cuando el registro es exitoso', async () => {

      mockRegister.mockResolvedValue({

        token: 'token-registrado',

        brand: { id: 'brand-1', email: 'qa@lookitry.com', name: 'Marca QA', slug: 'marca-qa', plan: 'BASIC' },

        verificationToken: 'verify-token',

        requiresTrialPayment: false,

      });

      const req = {

        body: {

          email: 'qa@lookitry.com',

          password: '123456',

          name: 'Marca QA',

          slug: 'marca-qa',

          contact_name: 'Persona QA',

          fingerprint: 'fp-1',

        },

        ip: '127.0.0.1',

        headers: {},

      } as unknown as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(mockRegister).toHaveBeenCalledWith(

        expect.objectContaining({

          email: 'qa@lookitry.com',

          fingerprint: 'fp-1',

          ip: '127.0.0.1',

        })

      );

      expect(res.cookie).toHaveBeenCalledWith(

        'token',

        'token-registrado',

        expect.objectContaining({ httpOnly: true })

      );

      expect(res.status).toHaveBeenCalledWith(201);

    });



    it('mapea conflictos de negocio a 409', async () => {

      mockRegister.mockRejectedValue(new Error('El email ya está registrado'));

      const req = {

        body: {

          email: 'qa@lookitry.com',

          password: '123456',

          name: 'Marca QA',

          slug: 'marca-qa',

          contact_name: 'Persona QA',

        },

        headers: {},

      } as unknown as Request;

      const res = buildRes();



      await controller.register(req, res);



      expect(res.status).toHaveBeenCalledWith(409);

    });

  });



  describe('login', () => {

  it('rechaza login sin credenciales', async () => {
      const req = { body: { email: '' }, headers: { 'x-forwarded-for': '127.0.0.1' }, ip: '127.0.0.1' } as unknown as Request;
      const res = buildRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('mapea credenciales inválidas a 401', async () => {
      mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));
      const req = { body: { email: 'qa@lookitry.com', password: 'mal' }, headers: { 'x-forwarded-for': '127.0.0.1' }, ip: '127.0.0.1' } as unknown as Request;
      const res = buildRes();

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });



    it('mapea credenciales inválidas a 401', async () => {

      mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));

      const req = { body: { email: 'qa@lookitry.com', password: 'mal' } } as Request;

      const res = buildRes();



      await controller.login(req, res);



      expect(res.status).toHaveBeenCalledWith(401);

    });

  });



  describe('resetPassword', () => {

    it('rechaza token o password ausentes', async () => {

      const req = { body: { token: '', password: '' } } as Request;

      const res = buildRes();



      await controller.resetPassword(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(mockResetPassword).not.toHaveBeenCalled();

    });



    it('mapea token expirado a 400', async () => {

      mockResetPassword.mockRejectedValue(new Error('TOKEN_EXPIRED'));

      const req = { body: { token: 'abc', password: '123456' } } as Request;

      const res = buildRes();



      await controller.resetPassword(req, res);



      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(

        expect.objectContaining({ error: 'TOKEN_EXPIRED' })

      );

    });

  });

});

