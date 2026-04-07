import dotenv from 'dotenv';
dotenv.config();

import { brevoCampaignService } from '../services/brevo-campaign.service';

async function testBrevo() {
  console.log('--- Iniciando Test E2E Brevo ---');
  console.log('API Key present:', !!process.env.BREVO_API_KEY);
  
  try {
    console.log('\n1. Verificando conexión...');
    const connected = await brevoCampaignService.verifyConnection();
    console.log('Conexión:', connected ? 'EXITOSA' : 'FALLIDA');

    console.log('\n2. Intentando enviar email de prueba...');
    const result = await brevoCampaignService.sendEmail({
      to: 'info@lookitry.com', // O el email que prefieras
      subject: 'Test E2E Lookitry Admin',
      html: '<h1>Test Exitoso</h1><p>Si recibes esto, el flujo E2E funciona.</p>'
    });
    
    console.log('Resultado del envío:', JSON.stringify(result, null, 2));
    
    if (result.messageId) {
      console.log('\nSUCCESS: Email enviado correctamente.');
    } else {
      console.log('\nFAILURE: No se recibió messageId. Revisa logs de Brevo.');
    }
  } catch (error: any) {
    console.error('\nERROR FATAL:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

testBrevo();
