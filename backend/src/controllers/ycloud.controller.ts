import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { minimaxService, ConvMessage } from '../services/minimax.service';
import { vertexService } from '../services/vertex.service';
import { ycloudSendMessage } from '../services/ycloud.service';
import { rebeccaIdentityService } from '../services/rebecca-identity.service';
import { getRagContext } from '../services/rag-context.service';

const HISTORY_LIMIT = 20; // max messages to load (10 exchanges)

// In-memory dedup — keyed by messageId (primary) or content hash (fallback)
const processedMessages = new Set<string>();

function hashMessage(phone: string, text: string): string {
  const str = `${phone}:${text}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i)!;
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function normalizePhone(raw: string): string {
  const cleaned = raw.trim();
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function cleanResponse(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\([A-Za-z0-9À-ɏ一-鿿؀-ۿ]{1,100}\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function processWhatsAppMessage(rawPayload: any): Promise<void> {
  const startTime = Date.now();

  const msg = rawPayload?.whatsappMessage || rawPayload?.whatsappInboundMessage || rawPayload?.payload;
  if (!msg) return;

  const customerPhone = normalizePhone(msg.from || msg.fromUserId || '');
  const businessPhone = msg.to;
  const message = msg.text?.body || msg.content?.text || '';
  const messageId = msg.id;
  const customerName = rawPayload?.whatsappMessage?.customerProfile?.name ||
                       rawPayload?.whatsappInboundMessage?.customerProfile?.name;

  if (!message.trim()) {
    console.log('[YCloud-Webhook] Skipping non-text message');
    return;
  }

  // 1. Upsert conversation
  let { data: conversation } = await supabaseAdmin
    .from('lead_conversations')
    .select('id')
    .eq('platform_id', customerPhone)
    .eq('status', 'active')
    .maybeSingle();

  if (!conversation) {
    const { data: newConv, error: convError } = await supabaseAdmin
      .from('lead_conversations')
      .insert({ platform_id: customerPhone, status: 'active', source: 'whatsapp' })
      .select('id')
      .single();
    if (convError) console.error('[YCloud-Webhook] Conversation error:', convError);
    else conversation = newConv;
  }

  // 2. Persist inbound message
  if (conversation) {
    const { error: msgError } = await supabaseAdmin
      .from('lead_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'lead',
        content: message,
        metadata: { messageId, raw: rawPayload }
      });
    if (msgError) console.error('[YCloud-Webhook] Message insert error:', msgError);
  }

  // 3. Upsert lead — name fallback to phone to satisfy NOT NULL
  const { error: leadError } = await supabaseAdmin
    .from('leads')
    .upsert({
      phone: customerPhone,
      name: customerName || customerPhone,
      internal_notes: `Último mensaje: ${message}`,
      source: 'whatsapp',
      status: 'new',
      country: 'Colombia'
    });
  if (leadError) console.error('[YCloud-Webhook] Lead upsert error:', leadError);

  // 4. Load conversation history for multi-turn context
  let history: ConvMessage[] = [];
  if (conversation) {
    const { data: pastMessages } = await supabaseAdmin
      .from('lead_messages')
      .select('sender_type, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT);

    if (pastMessages && pastMessages.length > 0) {
      history = pastMessages
        .filter((m: any) => m.sender_type === 'lead' || m.sender_type === 'bot')
        .map((m: any) => ({
          role: m.sender_type === 'lead' ? 'user' : 'assistant' as 'user' | 'assistant',
          content: m.content
        }));
      console.log('[YCloud-Webhook] Loaded', history.length, 'history messages');
    }
  }

  // 5. RAG + identity
  const ragContext = await getRagContext(message);
  const locale = rebeccaIdentityService.detectLocale(message);
  const systemPrompt = rebeccaIdentityService.getSystemPrompt('whatsapp', ragContext, locale);

  // 6. AI — MiniMax primary, Vertex fallback — both receive full history
  let aiResponse: string;
  try {
    console.log('[YCloud-Webhook] Calling MiniMax... locale:', locale, 'history:', history.length);
    aiResponse = await minimaxService.callMiniMax(systemPrompt, message, history);
  } catch (minimaxErr: any) {
    console.warn('[YCloud-Webhook] MiniMax failed, trying Vertex:', minimaxErr.message);
    try {
      aiResponse = await vertexService.callVertex(systemPrompt, message, history);
    } catch (vertexErr: any) {
      console.error('[YCloud-Webhook] Both AI providers failed:', vertexErr.message);
      return;
    }
  }

  const cleaned = cleanResponse(aiResponse);
  if (!cleaned) {
    console.error('[YCloud-Webhook] Empty cleaned response');
    return;
  }

  // 6. Send reply — single send point
  console.log('[YCloud-Webhook] Sending to YCloud - customer:', customerPhone);
  await ycloudSendMessage(customerPhone, cleaned, businessPhone);

  const latency = Date.now() - startTime;
  console.log(JSON.stringify({ event: 'success', latency_ms: latency }));

  // 7. Persist bot reply
  if (conversation) {
    await supabaseAdmin
      .from('lead_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'bot',
        content: cleaned,
        metadata: {}
      });
  }
}

/**
 * POST /api/chat/ycloud-webhook
 * ACK immediately → process async to prevent YCloud retries on slow AI calls.
 */
export const handleYCloudWebhook = async (req: Request, res: Response) => {
  const rawPayload = req.body;

  console.log('[YCloud-Webhook] Raw payload keys:', Object.keys(rawPayload));

  // Only process inbound text messages — drop delivery receipts, read receipts, etc.
  const eventType: string = rawPayload?.type || '';
  if (eventType && eventType !== 'whatsapp.inbound_message.received') {
    console.log('[YCloud-Webhook] Ignoring non-inbound event:', eventType);
    return res.status(200).json({ status: 'ignored', reason: 'non_inbound_event' });
  }

  const msg = rawPayload?.whatsappMessage || rawPayload?.whatsappInboundMessage || rawPayload?.payload;
  if (!msg) {
    return res.status(400).json({ status: 'error', code: 'INVALID_PAYLOAD' });
  }

  const messageId: string = msg.id || '';
  const rawPhone: string = msg.from || msg.fromUserId || '';
  const message: string = msg.text?.body || msg.content?.text || '';
  const contentHash = hashMessage(rawPhone, message);

  // Dedup by messageId (preferred) then content hash
  const dedupKey = messageId || contentHash;
  if (processedMessages.has(dedupKey)) {
    console.log('[YCloud-Webhook] Dropping duplicate:', dedupKey);
    return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
  }
  processedMessages.add(dedupKey);
  if (messageId) processedMessages.add(contentHash); // also block same content

  if (processedMessages.size > 500) {
    const arr = Array.from(processedMessages);
    processedMessages.clear();
    arr.slice(-300).forEach(h => processedMessages.add(h));
  }

  // ACK immediately — prevents YCloud from retrying on slow AI responses
  res.status(200).json({ status: 'received' });

  // Fire and forget — errors are logged, never bubble up to YCloud
  processWhatsAppMessage(rawPayload).catch(err => {
    console.error('[YCloud-Webhook] Background processing error:', err.message);
  });
};
