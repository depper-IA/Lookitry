// examples/unit.example.ts
// Ejemplo: Test unitario de un Service
// Copia y adapta este patrón para cualquier service del backend.

import { AuthService } from '../services/auth.service';

// 1. Mockear TODAS las dependencias externas antes de importar el módulo bajo prueba
jest.mock('../config/supabase', () => ({
  supabase: {},
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'test-brand-id', email: 'test@example.com', plan: 'BASIC' }, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

jest.mock('../services/email.service', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  })),
}));

// 2. Importar el módulo bajo prueba DESPUÉS de los mocks
// (ya se hizo con jest.mock arriba — los imports pueden ir junto a ellos
//  porque jest.mock tiene hoisting automático)

describe('AuthService', () => {
  let service: AuthService;

  // 3. Setear variables de entorno y crear instancia fresca en cada test
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';
    jest.clearAllMocks(); // limpia contadores y valores mockeados
    service = new AuthService();
  });

  describe('login', () => {
    it('debe retornar token JWT con credenciales válidas', async () => {
      // Arrange: el mock de supabase ya devuelve un brand válido

      // Act
      // const result = await service.login('test@example.com', 'password123');

      // Assert
      // expect(result).toHaveProperty('token');
      // expect(typeof result.token).toBe('string');
    });

    it('debe lanzar error con credenciales inválidas', async () => {
      // Arrange: simular que no se encontró el usuario
      const { supabaseAdmin } = require('../config/supabase');
      supabaseAdmin.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      // Act & Assert
      // await expect(service.login('bad@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('debe crear un brand nuevo y retornar token', async () => {
      // Implement similar to login test above
    });
  });
});
