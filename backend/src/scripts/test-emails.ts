/**
 * Script para probar todos los templates de email.
 * Envía cada tipo de notificación a la dirección de prueba.
 *
 * Uso: npm run test:emails
 */
import dotenv from 'dotenv';
dotenv.config();

import { NotificationService } from '../services/notification.service';
import { Brand } from '../types';

const TEST_EMAIL = 'Info.samwilkie@gmail.com';

const mockBrand: Brand = {
  id: 'test-brand-id',
  name: 'Marca de Prueba',
  email: TEST_EMAIL,
  slug: 'marca-prueba',
  plan: 'BASIC',
  widget_template: 'default',
  button_text: 'Probar ahora',
  welcome_message: 'Bienvenido',
  trial_end_date: null,
  trial_generations_limit: 10,
  subscription_status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function runEmailTests() {
  const notificationService = new NotificationService();

  const tests: Array<{ name: string; fn: () => Promise<void> }> = [
    {
      name: 'Email de bienvenida',
      fn: () => notificationService.sendWelcomeEmail(mockBrand),
    },
    {
      name: 'Recordatorio 7 días',
      fn: () => notificationService.sendExpirationReminder(mockBrand, 7),
    },
    {
      name: 'Recordatorio 3 días',
      fn: () => notificationService.sendExpirationReminder(mockBrand, 3),
    },
    {
      name: 'Vencimiento hoy (0 días)',
      fn: () => notificationService.sendExpirationReminder(mockBrand, 0),
    },
    {
      name: 'Notificación de suspensión',
      fn: () => notificationService.sendSuspensionNotice(mockBrand),
    },
    {
      name: 'Confirmación de renovación',
      fn: () => notificationService.sendRenewalConfirmation(mockBrand),
    },
    {
      name: 'Alerta de uso 80%',
      fn: () => notificationService.sendUsageAlert(mockBrand, 80, 80, 100),
    },
    {
      name: 'Alerta de uso 100%',
      fn: () => notificationService.sendUsageAlert(mockBrand, 100, 100, 100),
    },
  ];

  console.log(`\nEnviando ${tests.length} emails de prueba a ${TEST_EMAIL}...\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`[OK] ${test.name}`);
      passed++;
    } catch (error: any) {
      console.error(`[FAIL] ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResultado: ${passed} enviados, ${failed} fallidos\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runEmailTests();
