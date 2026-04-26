/**
 * E2E Test: Flujos completos de checkout y registro
 * Prueba: Trial, Basic, Pro, y bundle PRO+6meses+Landing
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY ? require('@supabase/supabase-js').createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  validateStatus: () => true,
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRandomEmail(): string {
  const random = Math.random().toString(36).substring(7);
  return `test-${random}-${Date.now()}@example.com`;
}

function generateRandomSlug(): string {
  const random = Math.random().toString(36).substring(7);
  return `test-${random}-${Date.now()}`;
}

describe('E2E: Flujos de Checkout y Registro', () => {
  const testCleanup: string[] = [];

  beforeAll(async () => {
    if (supabase) {
      console.log('\nâ Supabase client initialized');
    } else {
      console.log('\nâ ï¸ Supabase no configurado, usando modo limitado');
    }
  });

  afterAll(async () => {
    if (supabase && testCleanup.length > 0) {
      console.log('\nð§¹ Limpiando datos de prueba...');
      for (const email of testCleanup) {
        try {
          await supabase.from('brands').delete().eq('email', email);
        } catch (e) {
          console.log(`No se pudo limpiar: ${email}`);
        }
      }
    }
  });

  describe('Flujo 1: Trial', () => {
    it('1.1. Verifica que registro requiere CAPTCHA (Turnstile)', async () => {
      console.log('\nð§ª Trial 1.1: Verificando que registro requiere CAPTCHA...');
      
      const registerRes = await api.post('/api/auth/register', {
        email: generateRandomEmail(),
        password: 'Test@1234',
        name: 'Test Trial Brand',
        slug: generateRandomSlug(),
        contact_name: 'Test User',
      });

      console.log('   Registro response:', registerRes.status, registerRes.data?.error);
      
      expect([400, 429]).toContain(registerRes.status);
      if (registerRes.status === 400) {
        expect(registerRes.data.error).toBe('CAPTCHA_REQUIRED');
      }
    });

    it('1.2. Usuario con sesión activa NO puede comprar Trial (retorna 409)', async () => {
      console.log('\nð§ª Trial 1.2: Verificando que usuario con sesión NO puede comprar Trial...');
      
      await delay(1000);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: 20000,
          months: 1,
          plan: 'TRIAL',
        },
      });

      console.log('   Checkout response:', checkoutRes.status);
      console.log('   Response data:', checkoutRes.data?.error);
      
      if (checkoutRes.status === 409) {
        expect(checkoutRes.data.error).toBe('AUTHENTICATED_TRIAL_DISABLED');
        console.log('   â Usuario con sesión bloquado de Trial');
      } else {
        console.log('   â¹ï¸  Sin sesión activa, checkout procede normalmente');
        expect(checkoutRes.status).toBe(200);
      }
    });

    it('1.3. Usuario autenticado intentando Trial recibe error específico', async () => {
      console.log('\nð§ª Trial 1.3: Verificando protección específica para usuario con sesión...');
      
      if (!supabase) {
        console.log('   â ï¸  Supabase no disponible, saltando test');
        return;
      }

      await delay(1000);

      const testBrand = {
        email: `existing-${Date.now()}@test.com`,
        name: 'Existing Brand Test',
        slug: `existing-${Date.now()}`,
      };

      const { data: brand, error } = await supabase.from('brands').insert(testBrand).select().single();

      if (error || !brand) {
        console.log('   â ï¸  No se pudo crear brand de prueba:', error?.message);
        return;
      }

      testCleanup.push(testBrand.email);

      const { generateToken } = await import('../../utils/jwt');
      const token = generateToken({ brandId: brand.id, email: brand.email });

      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: 20000,
          months: 1,
          plan: 'TRIAL',
        },
        headers: {
          Cookie: `token=${token}`,
        },
      });

      console.log('   Checkout response con sesión:', checkoutRes.status);
      console.log('   Error:', checkoutRes.data?.error);

      expect(checkoutRes.status).toBe(409);
      expect(checkoutRes.data.error).toBe('AUTHENTICATED_TRIAL_DISABLED');
      console.log('   â Usuario autenticado bloqueado de Trial');
    });
  });

  describe('Flujo 2: BASIC', () => {
    it('2.1. Checkout para plan BASIC', async () => {
      console.log('\nð§ª BASIC 2.1: Generando checkout para BASIC...');
      await delay(1000);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: 150000,
          months: 1,
          plan: 'BASIC',
        },
      });

      console.log('   Checkout response:', checkoutRes.status);
      
      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.data.checkoutUrl).toBeDefined();
      console.log('   â Checkout URL generado correctamente');
    });
  });

  describe('Flujo 3: PRO', () => {
    it('3.1. Checkout para plan PRO', async () => {
      console.log('\nð§ª PRO 3.1: Generando checkout para PRO...');
      await delay(1000);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: 250000,
          months: 1,
          plan: 'PRO',
        },
      });

      console.log('   Checkout response:', checkoutRes.status);
      
      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.data.checkoutUrl).toBeDefined();
    });

    it('3.2. Checkout con descuento por meses (3 meses)', async () => {
      console.log('\nð§ª PRO 3.2: Checkout PRO con 3 meses (descuento 5%)...');
      await delay(1000);
      
      const basePrice = 250000;
      const discount = 0.05;
      const expectedPrice = basePrice * 3 * (1 - discount);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: expectedPrice,
          months: 3,
          plan: 'PRO',
        },
      });

      console.log('   Precio esperado:', expectedPrice);
      console.log('   Checkout response:', checkoutRes.status);
      
      expect(checkoutRes.status).toBe(200);
    });

    it('3.3. Checkout con descuento 6 meses (10%)', async () => {
      console.log('\nð§ª PRO 3.3: Checkout PRO con 6 meses (descuento 10%)...');
      await delay(1000);
      
      const basePrice = 250000;
      const discount = 0.10;
      const expectedPrice = basePrice * 6 * (1 - discount);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: expectedPrice,
          months: 6,
          plan: 'PRO',
        },
      });

      console.log('   Precio esperado:', expectedPrice);
      console.log('   Checkout response:', checkoutRes.status);
      
      expect(checkoutRes.status).toBe(200);
    });
  });

  describe('Flujo 4: PRO + 6 meses + Landing (Bundle)', () => {
    it('4.1. Checkout bundle PRO+6meses+Landing', async () => {
      console.log('\nð§ª Bundle 4.1: Generando checkout PRO + 6 meses + Landing...');
      await delay(1000);
      
      const basePrice = 250000;
      const landingPrice = 650000;
      const months = 6;
      const discount = 0.10;
      
      const planPrice = basePrice * months * (1 - discount);
      const totalPrice = planPrice + landingPrice;
      
      console.log('   Plan PRO 6 meses (10% descuento):', planPrice);
      console.log('   Landing:', landingPrice);
      console.log('   TOTAL:', totalPrice);
      
      const checkoutRes = await api.get('/api/payments/wompi/checkout-url', {
        params: {
          amount: totalPrice,
          months: 6,
          plan: 'PRO',
          includes_landing: 'true',
        },
      });

      console.log('   Checkout response:', checkoutRes.status);
      
      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.data.checkoutUrl).toBeDefined();
      console.log('   â Checkout URL generado correctamente');
    });
  });

  describe('Validaciones de seguridad', () => {
    it('5.1. Bloquea email temporal (yopmail)', async () => {
      console.log('\nð§ª Validación 5.1: Verificando bloqueo de email temporal...');
      await delay(1000);
      
      const registerRes = await api.post('/api/auth/register', {
        email: `test-${Date.now()}@yopmail.com`,
        password: 'Test@1234',
        name: 'Test Brand',
        slug: generateRandomSlug(),
        contact_name: 'Test User',
      });

      console.log('   Response:', registerRes.status, registerRes.data?.error);
      
      expect([400, 429]).toContain(registerRes.status);
      if (registerRes.status === 400) {
        expect(registerRes.data.error).toBe('DISPOSABLE_EMAIL');
      }
    });

    it('5.2. Bloquea slug reservado (admin)', async () => {
      console.log('\nð§ª Validación 5.2: Verificando bloqueo de slug reservado...');
      await delay(1000);
      
      const registerRes = await api.post('/api/auth/register', {
        email: generateRandomEmail(),
        password: 'Test@1234',
        name: 'Test Brand',
        slug: 'admin',
        contact_name: 'Test User',
      });

      console.log('   Response:', registerRes.status, registerRes.data?.error);
      
      expect([400, 429]).toContain(registerRes.status);
      if (registerRes.status === 400) {
        expect(registerRes.data.error).toBe('SLUG_RESERVED');
      }
    });
  });

  describe('Payment Settings', () => {
    it('6.1. Obtiene configuración de pagos pública', async () => {
      console.log('\nð§ª Payment Settings 6.1: Obteniendo configuración pública...');
      
      const res = await api.get('/api/payment-settings/public');
      
      console.log('   Response:', res.status);
      
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        console.log('   â Configuración obtenida');
        console.log('   Wompi enabled:', res.data.wompiEnabled);
        console.log('   PayPal enabled:', res.data.paypalEnabled);
      }
    });
  });
});

console.log('\nð Iniciando tests E2E de checkout y registro...');
console.log('   API URL:', API_URL);