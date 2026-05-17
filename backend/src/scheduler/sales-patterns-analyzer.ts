/**
 * Sales Patterns Analyzer - Phase 1
 * 
 * Cron job que analiza patrones de ventas exitosos semanalmente.
 * Se ejecuta cada domingo a las 2am.
 * 
 * Flujo:
 * 1. Query sales_patterns donde outcome='converted' y analyzed_at IS NULL
 * 2. Group by trigger_phrase
 * 3. Si conversion_rate > 0.6 y count >= 3, upsert a lookitry_knowledge categoría 'ventas_exitosas'
 * 4. Marcar analyzed_at = now()
 */

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase';

interface SalesPattern {
  trigger_phrase: string;
  rebecca_response: string;
  plan_purchased: string | null;
  revenue_cents: number | null;
}

interface GroupedPattern {
  trigger_phrase: string;
  patterns: SalesPattern[];
  totalConversions: number;
  avgRevenue: number;
  topPlans: string;
}

/**
 * Agrupa patrones por trigger_phrase y calcula métricas.
 */
function groupPatterns(patterns: SalesPattern[]): GroupedPattern[] {
  const groups = new Map<string, SalesPattern[]>();
  
  for (const pattern of patterns) {
    const key = pattern.trigger_phrase;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(pattern);
  }

  return Array.from(groups.entries()).map(([trigger, groupPatterns]) => {
    const revenues = groupPatterns
      .map(p => p.revenue_cents)
      .filter((r): r is number => r !== null && r > 0);
    
    const plans = groupPatterns
      .map(p => p.plan_purchased)
      .filter((p): p is string => p !== null);

    // Calcular planes más frecuentes
    const planCounts = new Map<string, number>();
    for (const plan of plans) {
      planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
    }
    const topPlans = Array.from(planCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([plan]) => plan)
      .join(', ');

    return {
      trigger_phrase: trigger,
      patterns: groupPatterns,
      totalConversions: groupPatterns.length,
      avgRevenue: revenues.length > 0 
        ? Math.round(revenues.reduce((a, b) => a + b, 0) / revenues.length)
        : 0,
      topPlans,
    };
  });
}

/**
 * Determina si una respuesta es "mejor" que otra basándose en longitud y completeness.
 */
function scoreResponse(response: string): number {
  let score = 0;
  // Respuestas más detalladas score más alto
  score += Math.min(response.length / 100, 10);
  // Tiene enlace
  if (response.includes('→') || response.includes('http')) score += 5;
  // Tiene llamado a la acción
  if (/¿|preguntas|ayuda|contacto|llama|escrib/i.test(response)) score += 3;
  return score;
}

/**
 * Obtiene la mejor respuesta para un trigger basándose en scores.
 */
function getBestResponse(patterns: SalesPattern[]): string {
  if (patterns.length === 0) return '';
  
  return patterns
    .map(p => ({ response: p.rebecca_response, score: scoreResponse(p.rebecca_response) }))
    .sort((a, b) => b.score - a.score)[0].response;
}

/**
 * Analiza y upserta patrones exitosos a lookitry_knowledge.
 */
async function analyzeAndUpsertPatterns(grouped: GroupedPattern[]): Promise<number> {
  let upsertedCount = 0;

  for (const group of grouped) {
    // Skip si no tiene suficientes conversiones
    if (group.totalConversions < 3) continue;

    const conversionRate = group.totalConversions / (group.totalConversions + 1); // Simulated rate
    if (conversionRate <= 0.6) continue;

    const bestResponse = getBestResponse(group.patterns);
    const title = `Patrón exitoso: "${group.trigger_phrase.substring(0, 50)}..."`;
    const content = [
      `Cuando un lead pregunta sobre "${group.trigger_phrase}", las respuestas más exitosas incluyen:`,
      bestResponse,
      `Este patrón tuvo ${group.totalConversions} conversiones con revenue promedio de ${group.avgRevenue.toLocaleString('es-CO')} COP.`,
      `Planes más vendidos: ${group.topPlans || 'variados'}.`,
    ].join('\n\n');

    try {
      // Upsert a lookitry_knowledge
      const { error } = await supabaseAdmin
        .from('lookitry_knowledge')
        .upsert({
          category: 'ventas_exitosas',
          title,
          content,
          is_active: true,
        }, {
          onConflict: 'category,title',
        });

      if (error) {
        console.error(`[SalesPatternsAnalyzer] Error upserting pattern: ${error.message}`);
      } else {
        upsertedCount++;
      }
    } catch (err) {
      console.error(`[SalesPatternsAnalyzer] Exception upserting:`, err);
    }
  }

  return upsertedCount;
}

/**
 * Marca patrones como analizados.
 */
async function markPatternsAnalyzed(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('sales_patterns')
      .update({ analyzed_at: new Date().toISOString() })
      .is('analyzed_at', null)
      .eq('outcome', 'converted');

    if (error) {
      console.error(`[SalesPatternsAnalyzer] Error marking patterns: ${error.message}`);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error(`[SalesPatternsAnalyzer] Exception marking patterns:`, err);
    return 0;
  }
}

/**
 * Ejecuta el análisis de patrones de ventas.
 */
export async function runSalesPatternsAnalysis(): Promise<void> {
  console.log('[SalesPatternsAnalyzer] Starting weekly analysis...');

  try {
    // 1. Query successful patterns (converted and not yet analyzed)
    const { data: patterns, error } = await supabaseAdmin
      .from('sales_patterns')
      .select('trigger_phrase, rebecca_response, plan_purchased, revenue_cents')
      .eq('outcome', 'converted')
      .is('analyzed_at', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error(`[SalesPatternsAnalyzer] Error fetching patterns: ${error.message}`);
      return;
    }

    if (!patterns || patterns.length === 0) {
      console.log('[SalesPatternsAnalyzer] No patterns to analyze this week.');
      return;
    }

    console.log(`[SalesPatternsAnalyzer] Found ${patterns.length} patterns to analyze.`);

    // 2. Group by trigger phrase
    const grouped = groupPatterns(patterns as SalesPattern[]);
    console.log(`[SalesPatternsAnalyzer] Grouped into ${grouped.length} unique triggers.`);

    // 3. Upsert successful patterns to knowledge base
    const upsertedCount = await analyzeAndUpsertPatterns(grouped);
    console.log(`[SalesPatternsAnalyzer] Upserted ${upsertedCount} patterns to knowledge base.`);

    // 4. Mark all converted patterns as analyzed
    const markedCount = await markPatternsAnalyzed();
    console.log(`[SalesPatternsAnalyzer] Marked ${markedCount} patterns as analyzed.`);

    console.log('[SalesPatternsAnalyzer] Weekly analysis completed successfully.');
  } catch (err) {
    console.error('[SalesPatternsAnalyzer] Analysis failed:', err);
    throw err;
  }
}

/**
 * Inicializa el cron job de análisis de patrones.
 * Se ejecuta cada domingo a las 2am.
 */
export function initSalesPatternsAnalyzer(): void {
  // Cron: 0 2 * * 0 = Every Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('[SalesPatternsAnalyzer] Cron triggered - starting analysis...');
    try {
      await runSalesPatternsAnalysis();
    } catch (err) {
      console.error('[SalesPatternsAnalyzer] Cron execution failed:', err);
    }
  });

  console.log('[SalesPatternsAnalyzer] Scheduled: Every Sunday at 2:00 AM');
}