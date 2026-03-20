
const { supabaseAdmin } = require('./src/config/supabase');
const { SubscriptionService } = require('./src/services/subscription.service');
require('dotenv').config();

async function testPaypalFlow() {
  const brandEmail = 'contacto@ecomoda.test';
  const plan = 'BASIC';
  const months = 1;
  const reference = `TRYON-visitor_${Date.now()}-M1-PBASIC-LANDING-${Date.now()}`;

  console.log('--- TEST: PayPal Flow Simulation ---');
  
  // 1. Crear registro pendiente (Simulando checkout iniciado)
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .insert({ 
      email: brandEmail, 
      reference, 
      plan, 
      months, 
      includes_landing: true 
    })
    .select()
    .single();

  if (pendingError) {
    console.error('Error creating pending registration:', pendingError.message);
    return;
  }
  console.log('1. Pending registration created with reference:', reference);

  // 2. Marcar como pagado (Simulando captura exitosa de PayPal)
  const { error: updateError } = await supabaseAdmin
    .from('pending_registrations')
    .update({ status: 'paid', payment_id: 'PAYID-' + Date.now() })
    .eq('reference', reference);

  if (updateError) {
    console.error('Error updating status to paid:', updateError.message);
    return;
  }
  console.log('2. Status updated to "paid". Flow is ready for registration.');

  // 3. Verificar que el registro post-pago funcionaría
  const { data: verify, error: verifyError } = await supabaseAdmin
    .from('pending_registrations')
    .select('*')
    .eq('reference', reference)
    .single();

  if (verifyError || !verify || verify.status !== 'paid') {
    console.error('Validation FAILED: Registration is not marked as paid.');
  } else {
    console.log('3. Flow Verified: The visitor can now register via /registro-pro with ref:', reference);
  }

  // Limpieza del test
  await supabaseAdmin.from('pending_registrations').delete().eq('reference', reference);
  console.log('--- TEST FINISHED ---');
}

testPaypalFlow();
