import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3001';

async function generateTestReference(plan: string, months: number, includes_landing: boolean, gateway: string) {
  // Simula el proceso del frontend para obtener un enlace de checkout
  // En wompi:
  const base_price = plan === 'PRO' ? 250000 : 150000;
  const amount = base_price * months + (includes_landing ? 650000 : 0);
  
  const res = await axios.get(`${API_URL}/api/payments/${gateway}/checkout-url`, {
    params: {
      amount,
      plan,
      months,
      includes_landing,
      email: `test_${gateway}_${plan}_${Date.now()}@wilkiedevs.com`
    }
  });

  return { reference: res.data.reference || res.data.id, data: res.data };
}

async function simulateWebhook(gateway: string, reference: string, amount: number) {
  if (gateway === 'wompi') {
    // Para simplificar, insertamos manualmente un webhook omitiendo la firma,
    // o vamos directo a la DB de pending_registrations y hacemos el UPDATE local
    // que el webhook haría a "paid".
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    await supabase.from('pending_registrations').update({
      status: 'paid',
      payment_id: `WOMPI_TEST_${Date.now()}`
    }).eq('reference', reference);
  }
}

async function testPostPayment(reference: string, expectedPlan: string, expectedMonths: number, expectedLanding: boolean) {
  try {
    const res = await axios.post(`${API_URL}/api/auth/register-post-payment`, {
      contact_name: 'Test O',
      name: `Test ${expectedPlan}`,
      slug: `test-${expectedPlan.toLowerCase()}-${Date.now()}`,
      password: 'Password123!',
      ref: reference
    });
    
    console.log(`[EXITO] ${expectedPlan} - M${expectedMonths} - L:${expectedLanding} | Brand ID: ${res.data.brand.id}`);
    
    // Verificar en DB
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data: brand } = await supabase.from('brands').select('*').eq('id', res.data.brand.id).single();
    
    console.log(`   -> Plan en DB: ${brand.plan} (esperado: ${expectedPlan})`);
    console.log(`   -> Landing en DB: ${brand.has_landing_page} (esperada: ${expectedLanding})`);
    
    // Calcular meses
    const end = new Date(brand.subscription_end_date);
    const start = new Date(brand.subscription_start_date);
    const diffMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    console.log(`   -> Meses activos: ${diffMonths} (esperados: ${expectedMonths})`);
    
    // Verificar historial de pago (amount real no puede ser $0 si fue validado)
    const { data: payments } = await supabase.from('subscription_payments').select('*').eq('brand_id', brand.id);
    console.log(`   -> Pagos registrados: ${payments?.length}. Recibo más reciente: COP $${payments?.[0]?.amount || 0}`);
    
    if (brand.plan !== expectedPlan || diffMonths < expectedMonths || brand.has_landing_page !== expectedLanding || payments?.length === 0) {
      console.error(`[ERROR] Diferencias detectadas en DB para ${expectedPlan}`);
    }
  } catch (err: any) {
    console.error(`[ERROR FATAL] ${expectedPlan}:`, err.response?.data || err.message);
  }
}

async function runTests() {
  console.log('Iniciando tests de checkout y validación de variables en la DB...');
  
  // 1. Plan Basico, 1 mes, sin landing, wompi
  const t1 = await generateTestReference('BASIC', 1, false, 'wompi');
  await simulateWebhook('wompi', t1.reference, 150000);
  await testPostPayment(t1.reference, 'BASIC', 1, false);

  // 2. Plan PRO, 1 mes, sin landing, wompi
  const t2 = await generateTestReference('PRO', 1, false, 'wompi');
  await simulateWebhook('wompi', t2.reference, 250000);
  await testPostPayment(t2.reference, 'PRO', 1, false);

  // 3. Plan PRO + landing + meses (12), wompi
  const t3 = await generateTestReference('PRO', 12, true, 'wompi');
  await simulateWebhook('wompi', t3.reference, 3650000); // Valor estricto 
  await testPostPayment(t3.reference, 'PRO', 12, true);
}

runTests();
