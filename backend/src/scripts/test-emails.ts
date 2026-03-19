import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno antes de importar servicios
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { emailService } from '../services/email.service';
import * as templates from '../templates/email-templates';

const TEST_EMAIL = 'info.samwilkie@gmail.com';
const BRAND_INFO = {
  name: 'Marca de Prueba',
  email: TEST_EMAIL
};

async function runTests() {
  console.log('--- Iniciando Test de Sistema de Correos ---');
  console.log('Destinatario:', TEST_EMAIL);

  const connectionOk = await emailService.verifyConnection();
  if (!connectionOk) {
    console.error('Error: No se pudo establecer conexión con el servidor SMTP.');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Verificación de Email',
      subject: 'Confirma tu correo electrónico - Lookitry',
      html: templates.verifyEmailTemplate(BRAND_INFO, 'https://pruebalo.wilkiedevs.com/verify?token=test-token')
    },
    {
      name: 'Bienvenida (Registro)',
      subject: 'Bienvenido a Lookitry',
      html: templates.welcomeEmail(BRAND_INFO, 'PRO', '$250.000 COP', 30)
    },
    {
      name: 'Recordatorio 7 días',
      subject: 'Tu suscripción vence en 7 días',
      html: templates.reminder7DaysEmail(BRAND_INFO, 7, '$250.000 COP')
    },
    {
      name: 'Recordatorio 3 días (Urgente)',
      subject: 'Renovación Urgente Requerida',
      html: templates.reminder3DaysEmail(BRAND_INFO, 3, '$250.000 COP')
    },
    {
      name: 'Vencimiento Hoy',
      subject: 'Tu Suscripción Vence Hoy',
      html: templates.expirationTodayEmail(BRAND_INFO, '$250.000 COP')
    },
    {
      name: 'Cuenta Suspendida',
      subject: 'Tu cuenta ha sido suspendida',
      html: templates.suspensionEmail(BRAND_INFO, '$250.000 COP')
    },
    {
      name: 'Confirmación de Renovación',
      subject: 'Suscripción Renovada Exitosamente',
      html: templates.renewalConfirmationEmail(BRAND_INFO, '2026-04-19', '$250.000 COP', 30)
    },
    {
      name: 'Alerta Uso 80%',
      subject: 'Alerta de Uso: 80% alcanzado',
      html: templates.usageAlert80Email(BRAND_INFO, 960, 1200, 15, '$250.000 COP')
    },
    {
      name: 'Alerta Uso 100%',
      subject: 'Límite de Generaciones Alcanzado',
      html: templates.usageAlert100Email(BRAND_INFO, 1200, 10, '$250.000 COP')
    },
    {
      name: 'Bienvenida Admin (Manual)',
      subject: 'Tus credenciales de acceso a Lookitry',
      html: templates.adminWelcomeEmail(BRAND_INFO, 'Pass123*', 'PRO', 7, '2026-03-26')
    },
    {
      name: 'Reset Password Admin',
      subject: 'Nueva contraseña de administrador',
      html: templates.adminPasswordResetEmail('Admin Test', TEST_EMAIL, 'TempPass99#')
    },
    {
      name: 'Aviso Eliminación Landing (75 días)',
      subject: 'Tu mini-landing será eliminada pronto',
      html: templates.landingDeletionWarningEmail(BRAND_INFO, 15, 'https://pruebalo.wilkiedevs.com')
    },
    {
      name: 'Reset Password Usuario',
      subject: 'Restablecer contraseña - Lookitry',
      html: templates.passwordResetTemplate(BRAND_INFO, 'https://pruebalo.wilkiedevs.com/reset?token=test-token')
    },
    {
      name: 'Notificación Landing Eliminada (90 días)',
      subject: 'Tu mini-landing ha sido eliminada',
      html: templates.landingDeletedNoticeEmail(BRAND_INFO)
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Enviando: ${test.name}...`);
      await emailService.sendEmail({
        to: TEST_EMAIL,
        subject: test.subject,
        html: test.html
      });
    } catch (err: any) {
      console.error(`Error enviando ${test.name}:`, err.message);
    }
  }

  console.log('--- Test Finalizado ---');
}

runTests().catch(console.error);
