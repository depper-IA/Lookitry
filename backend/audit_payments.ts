import { supabaseAdmin } from './src/config/supabase';

async function audit() {
  console.log('--- INICIANDO AUDITORÍA TÉCNICA DE PAGOS ---');
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Verificar registros de pagos en las últimas 24h
    const { data: payments, error: pError } = await supabaseAdmin
      .from('subscription_payments')
      .select('id, brand_id, amount, payment_date, payment_method, status, notes')
      .gte('payment_date', last24h)
      .order('payment_date', { ascending: false });

    console.log(`\n[Subscription Payments] Registros en últimas 24h: ${payments?.length ?? 0}`);
    if (payments && payments.length > 0) {
      payments.forEach(p => console.log(` - ID: ${p.id} | Brand: ${p.brand_id} | Amount: ${p.amount} | Status: ${p.status} | Method: ${p.payment_method}`));
    }

    // 2. Verificar carritos de compra pendientes (pending_registrations)
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .select('id, email, status, reference, created_at')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false });

    console.log(`\n[Pending Registrations] Carritos en últimas 24h: ${pending?.length ?? 0}`);
    if (pending && pending.length > 0) {
      pending.forEach(pr => console.log(` - Email: ${pr.email} | Status: ${pr.status} | Ref: ${pr.reference}`));
    }

    // 3. Verificar notificaciones de error del sistema
    const { data: notifications, error: nError } = await supabaseAdmin
      .from('admin_notifications')
      .select('title, message, severity, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`\n[Admin Notifications] Últimas alertas:`);
    if (notifications && notifications.length > 0) {
      notifications.forEach(n => console.log(` - [${n.severity.toUpperCase()}] ${n.title}: ${n.message}`));
    }

    // 4. Buscar marcas creadas en las últimas 24h
    const { data: brands, error: bError } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, plan, created_at')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false });

    console.log(`\n[New Brands] Marcas registradas hoy: ${brands?.length ?? 0}`);
    if (brands && brands.length > 0) {
      brands.forEach(b => console.log(` - Name: ${b.name} | Email: ${b.email} | Plan: ${b.plan}`));
    }

    console.log('\n--- AUDITORÍA COMPLETADA ---');
  } catch (error) {
    console.error('Error durante la auditoría:', error);
  }
}

audit();
