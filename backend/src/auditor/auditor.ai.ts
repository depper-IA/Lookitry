import { supabaseAdmin } from '../config/supabase';

export interface AIAuditResult {
  summary: string;
  sections: string[];
}

export async function auditAI(hours = 24): Promise<AIAuditResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  const sections: string[] = [];

  const { data: generations, error } = await supabaseAdmin
    .from('generations')
    .select('id, brand_id, product_id, status, error_message, generated_at, processing_time')
    .gte('generated_at', cutoff)
    .order('generated_at', { ascending: false });

  if (error) {
    sections.push(`Error consultando generaciones: ${error.message}`);
    return { summary: 'Auditoria de IA - ERROR', sections };
  }

  const total = generations?.length ?? 0;
  const success = generations?.filter(g => g.status === 'SUCCESS').length ?? 0;
  const failed = generations?.filter(g => g.status === 'FAILED').length ?? 0;
  const pending = generations?.filter(g => g.status === 'PENDING').length ?? 0;
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '0';

  const avgProcessingTime = generations
    ?.filter(g => g.processing_time != null)
    .reduce((sum, g) => sum + (g.processing_time || 0), 0);
  const avgTime = generations?.filter(g => g.processing_time != null).length
    ? Math.round(avgProcessingTime! / generations.filter(g => g.processing_time != null).length / 1000)
    : 0;

  sections.push(`Generaciones IA (ultimas ${hours}h): ${total}`);
  sections.push(`Exitosas: ${success} | Fallidas: ${failed} | Pendientes: ${pending}`);
  sections.push(`Tasa de exito: ${successRate}%`);
  sections.push(`Tiempo promedio: ${avgTime}s`);

  if (failed > 0) {
    const errors = generations
      ?.filter(g => g.status === 'FAILED' && g.error_message)
      .slice(0, 5)
      .map(g => `  - ${g.error_message?.slice(0, 100)}`)
      .join('\n');
    sections.push(`\nUltimos errores de IA:\n${errors || '  Sin detalles'}`);
  }

  if (pending > 0) {
    sections.push(`\nALERTA: ${pending} generaciones pendientes (posible bloqueo en n8n)`);
  }

  const { data: brandsWithGenerations } = await supabaseAdmin
    .from('generations')
    .select('brand_id')
    .gte('generated_at', cutoff)
    .eq('status', 'SUCCESS');

  if (brandsWithGenerations) {
    const uniqueBrands = new Set(brandsWithGenerations.map(g => g.brand_id)).size;
    sections.push(`\nMarcas activas (IA): ${uniqueBrands}`);
  }

  const { data: totalAllTime } = await supabaseAdmin
    .from('generations')
    .select('id', { count: 'exact', head: true });

  sections.push(`\nTotal generaciones (historico): ${totalAllTime ?? 0}`);

  const summary = `Auditoria de IA - ${hours}h | ${successRate}% exito`;

  return { summary, sections };
}
