import { supabaseAdmin } from '../config/supabase';
import { rebeccaIdentityService } from './rebecca-identity.service';
import { vertexService } from './vertex.service';
import { pricingService } from './pricing.service';
import { calculatePriceUSD } from '../utils/pricingCurrency';
import type { VertexModelId } from './vertex.service';
import { redis } from '../config/redis';

// — Response cache for common questions (Redis-backed) —
const RESPONSE_CACHE_TTL_S = 15 * 60; // 15 min
type CachedResponse = { reply: string; cachedAt: number };

function getResponseCacheKey(message: string, intent: string, channel: string, context?: ChatContext): string | null {
  const lower = message.toLowerCase().trim();
  // Don't cache messages with personal info (emails, phone numbers, money amounts)
  if (/\$\d|@\w|\d{7,}|\+\d{10,}/.test(lower)) return null;
  // Only cache FAQ-like intents
  const cacheable = ['pricing_question', 'demo_request', 'info_request', 'greeting'];
  if (!cacheable.includes(intent)) return null;
  const pageKey = context?.page_url?.replace(/\W/g, '_') || 'none';
  return `rebecca:cache:${channel}:${intent}:${pageKey}:${lower.substring(0, 80)}`;
}

async function getCachedResponse(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    const cached: CachedResponse = JSON.parse(raw);
    if (Date.now() - cached.cachedAt < RESPONSE_CACHE_TTL_S * 1000) return cached.reply;
    await redis.del(key);
  } catch { /* cache miss */ }
  return null;
}

async function setCachedResponse(key: string, reply: string): Promise<void> {
  if (!redis || !key) return;
  try {
    await redis.set(key, JSON.stringify({ reply, cachedAt: Date.now() } as CachedResponse), 'EX', RESPONSE_CACHE_TTL_S);
  } catch { /* cache write failed silently */ }
}

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

// ChatContext para páginas - Phase 1
export interface ChatContext {
  page_url: string;
  page_title?: string;
  source: 'demo' | 'widget' | 'whatsapp';
  brand_slug?: string;
}

// Lead intent detection - Section 3.4
export type LeadIntent =
  | 'pricing_question'
  | 'checkout_intent'
  | 'demo_request'
  | 'objection'
  | 'greeting'
  | 'info_request'
  | 'unknown';

const KNOWLEDGE_CACHE_TTL_MS = 5 * 60 * 1000;
const CONFIG_CACHE_TTL_MS = 60 * 1000;

// Límites de caracteres por canal - Section 5.2
// WhatsApp: 800 chars, Web: 1200 chars para evitar redundancia
const CHANNEL_LIMITS = {
  whatsapp: 800,
  web: 1200,
} as const;

const knowledgeCache = new Map<'web', KnowledgeCacheEntry>();
let configCache: { config: RebeccaConfig; expiresAt: number } | null = null;

// ——————————————
// HELPERS - Phase 1
// ——————————————

/**
 * Detecta la intención del lead basándose en el mensaje.
 * Section 3.4 del spec
 */
export function detectIntent(message: string): LeadIntent {
  const lower = message.toLowerCase();

  if (/cuánto cuesta|precios|plan|cuesta|valor|pago/.test(lower)) return 'pricing_question';
  if (/comprar|pagar|activar|checkout|empieza|subscri|registrar/.test(lower)) return 'checkout_intent';
  if (/demo|cómo funciona|ver prueba|como uso|funciona|como trabajo/.test(lower)) return 'demo_request';
  if (/es caro|no me sirve|pienso|mejor|alternativa|difícil|complicado/.test(lower)) return 'objection';
  if (/hola|buenos|buenas|saludos|que tal|como estás/.test(lower)) return 'greeting';
  if (/qué incluye|diferencias|características|ventajas|beneficios/.test(lower)) return 'info_request';

  return 'unknown';
}

/**
 * Construye los enlaces contextuales según la página actual.
 * Section 4.2 del spec
 */
export function buildContextualLinks(context?: ChatContext | null): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

  return {
    plans: `${baseUrl}/planes`,
    checkout: context?.brand_slug
      ? `${baseUrl}/checkout/${context.brand_slug}`
      : `${baseUrl}/checkout`,
    demo: `${baseUrl}/demo`,
    faq: `${baseUrl}/planes#faq`,
    howItWorks: `${baseUrl}/probador-virtual`,
    contact: `${baseUrl}/contacto`,
  };
}

/**
 * Trunca el texto al límite de caracteres en el último punto completo.
 * Section 5.3 del spec
 */
export function truncateToLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');

  return lastPeriod > maxChars * 0.7
    ? truncated.substring(0, lastPeriod + 1)
    : truncated + '...';
}

/**
 * Obtiene recordatorios pendientes para una sesión.
 * Section 6.3 del spec
 */
async function getPendingReminder(sessionId: string): Promise<string | null> {
  try {
    const checkoutKey = await redis?.get(`reminder:checkout_abandoned:${sessionId}`);
    if (checkoutKey) {
      return "Vi que quedaste en el checkout ayer. ¿Necesitás ayuda con el proceso de activación?";
    }

    const plansKey = await redis?.get(`reminder:plans:${sessionId}`);
    if (plansKey) {
      return "Vi que viste los planes hace un rato. ¿Tenés alguna duda antes de elegir el tuyo?";
    }

    const pendingKey = await redis?.get(`reminder:pending:${sessionId}`);
    if (pendingKey) {
      return "Vi que estuviste mirando opciones. ¿Hay algo en lo que te pueda ayudar?";
    }

    return null;
  } catch (err) {
    console.error('[RebeccaChatService] Error checking reminders:', err);
    return null;
  }
}

/**
 * Registra una conversación en sales_patterns.
 * Section 3.2 del spec
 */
async function registerSalesPattern(params: {
  trigger_phrase: string;
  rebecca_response: string;
  intent_detected: LeadIntent;
  lead_session_id?: string;
  lead_email?: string;
  brand_id?: string;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('sales_patterns')
      .insert({
        trigger_phrase: params.trigger_phrase.substring(0, 500),
        rebecca_response: params.rebecca_response.substring(0, 2000),
        outcome: 'abandoned', // Default until conversion
        intent_detected: params.intent_detected,
        lead_session_id: params.lead_session_id || null,
        lead_email: params.lead_email || null,
        brand_id: params.brand_id || null,
      });
  } catch (err) {
    // Non-critical error, don't fail the reply
    console.error('[RebeccaChatService] Error registering sales pattern:', err);
  }
}

async function getKnowledgeContext(contextualLinks?: Record<string, string> | null): Promise<string> {
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

    // Phase 1: Agregar enlaces contextuales al contexto si están disponibles
    let linksPart = '';
    if (contextualLinks) {
      linksPart = `\n\n## ENLACES DE CONVERSIÓN
- Planes y precios: ${contextualLinks.plans || ''}
- Checkout directo: ${contextualLinks.checkout || ''}
- Demo interactiva: ${contextualLinks.demo || ''}
- FAQ: ${contextualLinks.faq || ''}`;
    }

    const context = [knowledgePart, pricingPart, linksPart].filter(Boolean).join('\n\n---\n\n');

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
    whatsapp_instructions: configMap.whatsapp_instructions || 'Máximo 200 caracteres por mensaje. Si necesitás más, divide en varios mensajes cortos.',
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
    channel: 'web' | 'whatsapp',
    sessionId: string,
    message: string,
    history: HistoryMessage[],
    locale?: string,
    context?: ChatContext
  ): Promise<string> {
    const config = await getRebeccaConfig();

    if (!config.is_enabled) {
      throw new Error('[RebeccaChatService] Rebecca is disabled');
    }

    // — Phase 1: Detectar intención —
    const intent = detectIntent(message);

    // — Phase 1: Obtener contexto de recordatorios —
    const reminderMessage = await getPendingReminder(sessionId);
    const enrichedMessage = reminderMessage ? `${reminderMessage}\n\n${message}` : message;

    // — Try response cache first —
    const cacheKey = getResponseCacheKey(message, intent, channel, context);
    if (cacheKey) {
      const cached = await getCachedResponse(cacheKey);
      if (cached) {
        await registerSalesPattern({
          trigger_phrase: message,
          rebecca_response: cached,
          intent_detected: intent,
          lead_session_id: sessionId,
        });
        return cached;
      }
    }

    // — Phase 1: Construir enlaces contextuales —
    const contextualLinks = context ? buildContextualLinks(context) : null;

    // — Phase 1: Obtener conocimiento con enlaces —
    const knowledgeContext = await getKnowledgeContext(contextualLinks);

    const trimmedHistory = history.slice(-config.max_history);

    const maxTokens = channel === 'whatsapp' ? 200 : 500;

    const systemPrompt = rebeccaIdentityService.getSystemPrompt(
      channel,
      knowledgeContext,
      locale,
      config.web_instructions,
      config.whatsapp_instructions,
      config.system_prompt_extra,
      contextualLinks ? {
        plans_url: contextualLinks.plans,
        checkout_url: contextualLinks.checkout,
        demo_url: contextualLinks.demo,
        faq_url: contextualLinks.faq,
      } : undefined,
      context
    );
    const model = config.model as VertexModelId;

    const contents = [
      ...trimmedHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: enrichedMessage }] },
    ];

    const result = await vertexService.generateContent({
      model,
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        maxOutputTokens: maxTokens,
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

    // — Phase 1: Truncar si es necesario (Section 5.3) —
    const maxChars = channel === 'whatsapp' ? CHANNEL_LIMITS.whatsapp : CHANNEL_LIMITS.web;
    const truncatedReply = truncateToLimit(reply, maxChars);

    // Cache the response for future requests
    if (cacheKey) await setCachedResponse(cacheKey, truncatedReply);

    // — Phase 1: Registrar patrón de ventas —
    await registerSalesPattern({
      trigger_phrase: message,
      rebecca_response: truncatedReply,
      intent_detected: intent,
      lead_session_id: sessionId,
    });

    return truncatedReply;
  }
}

export const rebeccaChatService = new RebeccaChatService();