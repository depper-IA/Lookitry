import { wompiService } from '../services/wompi.service';
import { SubscriptionService } from '../services/subscription.service';
import crypto from 'crypto';

/**
 * Script de Auditoría de Pagos Marzo 2026
 * Simula el flujo de pago real de Wompi contra la base de datos de Supabase.
 */
async function runAudit() {
  const BRAND_ID = '44014665-3902-445c-8361-ca3bce5fe593'; // Sam Wilkie
  const PLAN = 'BASIC';
  const MONTHS = 1;
  const AMOUNT_COP = 150000;
  const reference = `TRYON-${BRAND_ID}-M${MONTHS}-P${PLAN}-${Date.now()}`;
  
  console.log('--- 🚀 INICIANDO AUDITORÍA DE PAGOS REALES (LOCAL VS SUPABASE) ---');
  console.log('Marca objetivo:', BRAND_ID);
  console.log('Referencia generada:', reference);

  // 1. Simular el Checksum que Wompi enviaría al webhook
  // Fórmula: SHA256(id + status + amount_in_cents + currency + events_secret)
  const txId = 'AUDIT-TX-' + Date.now();
  const status = 'APPROVED';
  const amountCents = AMOUNT_COP * 100;
  const currency = 'COP';
  
  // Usamos el secreto de Sandbox para la prueba local según .env
  const secret = 'test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg';
  const data = `${txId}${status}${amountCents}${currency}${secret}`;
  const checksum = crypto.createHash('sha256').update(data).digest('hex');

  console.log('Checksum calculado:', checksum);

  // 2. Simular el procesamiento del Webhook (Lógica del Controlador)
  try {
    console.log('\n2. Procesando renovación de suscripción...');
    const subService = new SubscriptionService();
    
    // El controlador llama a renewSubscription tras validar la firma
    const result = await subService.renewSubscription(
      BRAND_ID, 
      {
        brand_id: BRAND_ID,
        amount: AMOUNT_COP,
        currency: 'COP',
        payment_method: 'wompi',
        status: 'completed',
        notes: `Auditoría local (Test de Integración) - Ref: ${reference}`,
      }, 
      MONTHS, // meses (1)
      PLAN, // plan ('BASIC')
      false // isUpgrade
    );

    console.log('✅ Resultado de renovación:', JSON.stringify(result, null, 2));

    // 3. Verificación de Auditoría en Supabase
    console.log('\n3. Verificando resultados en base de datos...');
    const { createClient } = require('@supabase/supabase-js');
    const s = createClient(
      'https://vkdooutklowctuudjnkl.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg'
    );

    const { data: brand } = await s.from('brands').select('*').eq('id', BRAND_ID).single();
    const { data: payments } = await s.from('subscription_payments').select('*').eq('brand_id', BRAND_ID).order('payment_date', { ascending: false }).limit(1);

    if (brand.subscription_status === 'active' && brand.plan === PLAN) {
      console.log('🎉 PRUEBA EXITOSA: La marca ya está ACTIVA con el plan', PLAN);
    } else {
      console.error('❌ FALLO: La marca no se activó correctamente.');
    }

    if (payments && payments.length > 0 && payments[0].amount === AMOUNT_COP) {
      console.log('💰 PRUEBA EXITOSA: El pago se registró en subscription_payments.');
    } else {
      console.error('❌ FALLO: No se encontró el registro de pago.');
    }

  } catch (error) {
    console.error('💥 ERROR DURANTE LA AUDITORÍA:', error);
  }

  console.log('\n--- 🏁 FIN DE LA AUDITORÍA ---');
}

runAudit();
