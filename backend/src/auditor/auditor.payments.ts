import { supabaseAdmin } from '../config/supabase';

export interface PaymentsAuditResult {
  summary: string;
  sections: string[];
}

export async function auditPayments(hours = 24): Promise<PaymentsAuditResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  const sections: string[] = [];

  const { data: payments, error: pError } = await supabaseAdmin
    .from('subscription_payments')
    .select('id, brand_id, amount, currency, payment_date, payment_method, status, months_paid')
    .gte('payment_date', cutoff)
    .order('payment_date', { ascending: false });

  if (pError) {
    sections.push(`Error consultando pagos: ${pError.message}`);
  } else {
    const total = payments?.length ?? 0;
    const completed = payments?.filter(p => p.status === 'completed').length ?? 0;
    const totalAmount = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0;
    const wompiCount = payments?.filter(p => p.payment_method === 'wompi').length ?? 0;
    const paypalCount = payments?.filter(p => p.payment_method === 'paypal').length ?? 0;

    sections.push(`Pagos en ultimas ${hours}h: ${total} (${completed} completados)`);
    sections.push(`Recaudado: $${totalAmount.toLocaleString('es-CO')} COP`);
    sections.push(`Wompi: ${wompiCount} | PayPal: ${paypalCount}`);

    if (payments && payments.length > 0 && payments.length <= 10) {
      const recent = payments.slice(0, 5).map(p => {
        const amount = Number(p.amount || 0).toLocaleString('es-CO');
        return `  - ${p.brand_id.slice(0, 8)}... | $${amount} ${p.currency || 'COP'} | ${p.payment_method} | ${p.status}`;
      }).join('\n');
      sections.push(`Ultimos pagos:\n${recent}`);
    }
  }

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('pending_registrations')
    .select('id, email, status, reference, amount, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (pendingError) {
    sections.push(`Error consultando pendientes: ${pendingError.message}`);
  } else {
    const paid = pending?.filter(p => p.status === 'paid').length ?? 0;
    const pending_count = pending?.filter(p => p.status === 'pending').length ?? 0;

    sections.push(`\nCarritos de compra (${hours}h): ${pending?.length ?? 0} total`);
    sections.push(`Pagados sin registrar: ${paid} | Pendientes de pago: ${pending_count}`);

    if (paid > 0) {
      sections.push(`ALERTA: ${paid} pagos pendientes de registro completo`);
    }
  }

  const { data: notifications, error: nError } = await supabaseAdmin
    .from('admin_notifications')
    .select('title, message, severity, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!nError && notifications && notifications.length > 0) {
    const alerts = notifications.map(n => `  [${n.severity?.toUpperCase() || 'INFO'}] ${n.title}: ${n.message?.slice(0, 80)}`).join('\n');
    sections.push(`\nUltimas alertas del sistema:\n${alerts}`);
  }

  const { data: brands, error: bError } = await supabaseAdmin
    .from('brands')
    .select('id, name, email, plan, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (!bError) {
    sections.push(`\nNuevas marcas (${hours}h): ${brands?.length ?? 0}`);
    if (brands && brands.length > 0 && brands.length <= 10) {
      const list = brands.map(b => `  - ${b.name} (${b.plan}) | ${b.email}`).join('\n');
      sections.push(list);
    }
  }

  const summary = `Auditoria de pagos - ultimas ${hours}h`;

  return { summary, sections };
}
