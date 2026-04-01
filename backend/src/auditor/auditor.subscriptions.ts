import { supabaseAdmin } from '../config/supabase';

export interface SubscriptionsAuditResult {
  summary: string;
  sections: string[];
}

export async function auditSubscriptions(): Promise<SubscriptionsAuditResult> {
  const sections: string[] = [];
  const now = new Date();

  const { data: brands, error } = await supabaseAdmin
    .from('brands')
    .select('id, name, email, plan, subscription_status, subscription_end_date, trial_end_date, trial_payment_status, has_landing_page, landing_suspended_at');

  if (error) {
    sections.push(`Error consultando marcas: ${error.message}`);
    return { summary: 'Auditoria de suscripciones - ERROR', sections };
  }

  const allBrands = brands || [];

  const active = allBrands.filter(b => b.subscription_status === 'active').length;
  const expiringSoon = allBrands.filter(b => b.subscription_status === 'expiring_soon').length;
  const expired = allBrands.filter(b => b.subscription_status === 'expired').length;
  const suspended = allBrands.filter(b => b.subscription_status === 'suspended').length;
  const trial = allBrands.filter(b => b.plan === 'TRIAL').length;
  const basic = allBrands.filter(b => b.plan === 'BASIC').length;
  const pro = allBrands.filter(b => b.plan === 'PRO').length;

  sections.push(`Total marcas: ${allBrands.length}`);
  sections.push(`BASIC: ${basic} | PRO: ${pro} | TRIAL: ${trial}`);
  sections.push(`\nEstado de suscripciones:`);
  sections.push(`Activas: ${active}`);
  sections.push(`Por vencer pronto: ${expiringSoon}`);
  sections.push(`Expiradas: ${expired}`);
  sections.push(`Suspendidas: ${suspended}`);

  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: expiringBrands } = await supabaseAdmin
    .from('brands')
    .select('name, email, plan, subscription_end_date')
    .in('subscription_status', ['active', 'expiring_soon'])
    .lte('subscription_end_date', next7Days.toISOString())
    .gte('subscription_end_date', now.toISOString())
    .order('subscription_end_date', { ascending: true })
    .limit(10);

  if (expiringBrands && expiringBrands.length > 0) {
    const list = expiringBrands.map(b => {
      const daysLeft = Math.ceil((new Date(b.subscription_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `  - ${b.name} (${b.plan}) vence en ${daysLeft}d (${b.subscription_end_date?.slice(0, 10)})`;
    }).join('\n');
    sections.push(`\nVencen en 7 dias:\n${list}`);
  }

  const trialExpiring = allBrands.filter(b => {
    if (b.plan !== 'TRIAL' || !b.trial_end_date) return false;
    const trialEnd = new Date(b.trial_end_date);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft >= 0;
  });

  if (trialExpiring.length > 0) {
    const list = trialExpiring.map(b => {
      const daysLeft = Math.ceil((new Date(b.trial_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `  - ${b.name} | trial expira en ${daysLeft}d`;
    }).join('\n');
    sections.push(`\nTrials por expirar (<=3 dias):\n${list}`);
  }

  const suspendedWithLanding = allBrands.filter(b => b.landing_suspended_at && b.subscription_status === 'suspended');
  if (suspendedWithLanding.length > 0) {
    sections.push(`\nLandings suspendidas: ${suspendedWithLanding.length}`);
    const toDelete = suspendedWithLanding.filter(b => {
      const daysSuspended = (now.getTime() - new Date(b.landing_suspended_at!).getTime()) / (1000 * 60 * 60 * 24);
      return daysSuspended >= 75;
    });
    if (toDelete.length > 0) {
      sections.push(`ALERTA: ${toDelete.length} landings proximas a eliminar (>75 dias)`);
    }
  }

  const summary = `Auditoria de suscripciones - ${allBrands.length} marcas`;

  return { summary, sections };
}
