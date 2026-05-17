import { supabaseAdmin } from '../config/supabase';
import { rebeccaIdentityService } from './rebecca-identity.service';
import { vertexService } from './vertex.service';
import { pricingService } from './pricing.service';
import { calculatePriceUSD } from '../utils/pricingCurrency';
import type { VertexModelId } from './vertex.service';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface KnowledgeCacheEntry {
  context: string;
  expiresAt: number;
}

interface RebeccaConfig {
  model: string;
  max_output_tokens: number;
  temperature: number;
  is_enabled: boolean;
  rate_limit_max: number;
  rate_limit_window_ms: number;
  web_instructions: string;
  whatsapp_instructions: string;
  system_prompt_extra: string;
  max_history: number;
}

const KNOWLEDGE_CACHE_TTL_MS = 5 * 60 * 1000;
const CONFIG_CACHE_TTL_MS = 60 * 1000;

const knowledgeCache = new Map<'web', KnowledgeCacheEntry>();
let configCache: { config: RebeccaConfig; expiresAt: number } | null = null;

async function getKnowledgeContext(): Promise<string> {
  const cached = knowledgeCache.get('web');
  if (cached && Date.now() < cached.expiresAt) {
    return cached.context;
  }

  try {
    const [knowledgeResult, pricingConfigs, trmResult] = await Promise.all([
      supabaseAdmin.from('lookitry_knowledge').select('title, content').eq('is_active', true),
      pricingService.getPricingConfig().catch(() => [] as any[]),
      pricingService.getEffectiveTrm().catch(() => ({ trm: 4000, source: 'fallback' as const })),
    ]);

    const knowledgePart = knowledgeResult.data
      ? knowledgeResult.data.map((item: { title: string; content: string }) => `${item.title}\n${item.content}`).join('\n\n---\n\n')
      : '';

    const pricingPart = buildPricingContext(pricingConfigs || [], trmResult?.trm ?? 4000);
    const context = [knowledgePart, pricingPart].filter(Boolean).join('\n\n---\n\n');

    knowledgeCache.set('web', { context, expiresAt: Date.now() + KNOWLEDGE_CACHE_TTL_MS });
    return context;
  } catch (err) {
    console.error('[RebeccaChatService] Error building knowledge context:', err);
    return '';
  }
}

function buildPricingContext(configs: any[], trm: number): string {
  if (!configs || configs.length === 0) return '';

  const lines: string[] = ['## PRECIOS DE PLANES', `TRM actual: ${trm} COP/USD`, ''];

  const planOrder = ['TRIAL', 'BASIC', 'PRO', 'LANDING'];
  const sorted = [...configs].sort(
    (a: any, b: any) => (planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan))
  );

  for (const plan of sorted) {
    const usd = calculatePriceUSD(plan.precio_mensual_cop, trm);
    lines.push(
      `${plan.plan}: $${plan.precio_mensual_cop.toLocaleString('es-CO')} COP (≈$${usd} USD)/mes` +
      (plan.precio_original_cop && plan.precio_original_cop > plan.precio_mensual_cop
        ? ` — precio anterior: $${plan.precio_original_cop.toLocaleString('es-CO')} COP`
        : '')
    );
  }

  return lines.join('\n');
}

async function getRebeccaConfig(): Promise<RebeccaConfig> {
  if (configCache && Date.now() < configCache.expiresAt) {
    return configCache.config;
  }

  const { data, error } = await supabaseAdmin
    .from('rebecca_config')
    .select('config_key, config_value');

  if (error) {
    console.error('[RebeccaChatService] Error loading config from DB:', error);
    return getDefaultConfig();
  }

  const configMap: Record<string, string> = {};
  for (const row of data || []) {
    configMap[row.config_key] = row.config_value;
  }

  const config: RebeccaConfig = {
    model: configMap.model || 'gemini-2.5-flash',
    max_output_tokens: parseInt(configMap.max_output_tokens || '600', 10),
    temperature: parseFloat(configMap.temperature || '0.7'),
    is_enabled: configMap.is_enabled !== 'false',
    rate_limit_max: parseInt(configMap.rate_limit_max || '20', 10),
    rate_limit_window_ms: parseInt(configMap.rate_limit_window_ms || '3600000', 10),
    web_instructions: configMap.web_instructions || 'Respuestas completas pero concisas. Máximo 3 párrafos.',
    whatsapp_instructions: configMap.whatsapp_instructions || 'Máximo 200 caracteres por mensaje. Si necesitás más, dividí en varios mensajes cortos.',
    system_prompt_extra: configMap.system_prompt_extra || '',
    max_history: parseInt(configMap.max_history || '10', 10),
  };

  configCache = { config, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return config;
}

function getDefaultConfig(): RebeccaConfig {
  return {
    model: process.env.REBECCA_VERTEX_MODEL || 'gemini-2.5-flash',
    max_output_tokens: parseInt(process.env.REBECCA_MAX_OUTPUT_TOKENS || '600', 10),
    temperature: parseFloat(process.env.REBECCA_TEMPERATURE || '0.7'),
    is_enabled: true,
    rate_limit_max: parseInt(process.env.REBECCA_WIDGET_RATE_LIMIT_MAX || '20', 10),
    rate_limit_window_ms: parseInt(process.env.REBECCA_WIDGET_RATE_LIMIT_WINDOW_MS || '3600000', 10),
    web_instructions: 'Respuestas completas pero concisas. Máximo 3 párrafos.',
    whatsapp_instructions: 'Máximo 200 caracteres por mensaje. Si necesitás más, dividí en varios mensajes cortos.',
    system_prompt_extra: '',
    max_history: parseInt(process.env.REBECCA_WIDGET_MAX_HISTORY || '10', 10),
  };
}

export class RebeccaChatService {
  async replyForChannel(
    channel: 'web',
    sessionId: string,
    message: string,
    history: HistoryMessage[],
    locale?: string
  ): Promise<string> {
    const config = await getRebeccaConfig();

    if (!config.is_enabled) {
      throw new Error('[RebeccaChatService] Rebecca is disabled');
    }

    const trimmedHistory = history.slice(-config.max_history);

    const knowledgeContext = await getKnowledgeContext();
    const systemPrompt = rebeccaIdentityService.getSystemPrompt(
      channel,
      knowledgeContext,
      locale,
      config.web_instructions,
      config.whatsapp_instructions,
      config.system_prompt_extra
    );
    const model = config.model as VertexModelId;

    const contents = [
      ...trimmedHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await vertexService.generateContent({
      model,
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        maxOutputTokens: config.max_output_tokens,
        temperature: config.temperature,
      },
    });

    if (result.error) {
      throw new Error(`[RebeccaChatService] Vertex error: ${result.error}`);
    }

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('[RebeccaChatService] Empty response from Vertex');
    }

    return reply;
  }
}

export const rebeccaChatService = new RebeccaChatService();