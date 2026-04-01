import { supabaseAdmin } from '../config/supabase';

export interface SecurityAuditResult {
  summary: string;
  sections: string[];
}

export async function auditSecurity(hours = 24): Promise<SecurityAuditResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  const sections: string[] = [];

  const { data: trialRegistrations, error: trialError } = await supabaseAdmin
    .from('trial_registrations')
    .select('id, ip_address, brand_id, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  if (trialError) {
    sections.push(`Error consultando trials: ${trialError.message}`);
  } else {
    const ipCounts = new Map<string, number>();
    trialRegistrations?.forEach(r => {
      ipCounts.set(r.ip_address, (ipCounts.get(r.ip_address) || 0) + 1);
    });

    const suspiciousIPs = Array.from(ipCounts.entries()).filter(([, count]) => count > 2);

    sections.push(`Registros de trial (${hours}h): ${trialRegistrations?.length ?? 0}`);
    if (suspiciousIPs.length > 0) {
      const list = suspiciousIPs.map(([ip, count]) => `  - ${ip}: ${count} intentos`).join('\n');
      sections.push(`ALERTA - IPs sospechosas:\n${list}`);
    }
  }

  const { data: failedLogins } = await supabaseAdmin
    .from('admin_notifications')
    .select('title, message, severity, created_at')
    .ilike('title', '%login%')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(10);

  if (failedLogins && failedLogins.length > 0) {
    sections.push(`\nNotificaciones de login (${hours}h): ${failedLogins.length}`);
    const list = failedLogins.slice(0, 5).map(n => `  - [${n.severity?.toUpperCase() || 'INFO'}] ${n.message?.slice(0, 100)}`).join('\n');
    sections.push(list);
  }

  const { data: brands } = await supabaseAdmin
    .from('brands')
    .select('id, name, email, plan, subscription_status');

  if (brands) {
    const suspended = brands.filter(b => b.subscription_status === 'suspended');
    const expired = brands.filter(b => b.subscription_status === 'expired');
    sections.push(`\nMarcas suspendidas/expiradas: ${suspended.length}/${expired.length}`);

    const activeWithNoLanding = brands.filter(b => b.subscription_status === 'active' && !(b as any).has_landing_page);
    if (activeWithNoLanding.length > 0) {
      sections.push(`Marcas activas sin landing: ${activeWithNoLanding.length}`);
    }
  }

  const { count: totalGenerations } = await supabaseAdmin
    .from('generations')
    .select('*', { count: 'exact', head: true });

  const { count: totalBrands } = await supabaseAdmin
    .from('brands')
    .select('*', { count: 'exact', head: true });

  sections.push(`\nTotales del sistema:`);
  sections.push(`Marcas: ${totalBrands ?? 0} | Generaciones: ${totalGenerations ?? 0}`);

  const summary = `Auditoria de seguridad - ${hours}h`;

  return { summary, sections };
}
