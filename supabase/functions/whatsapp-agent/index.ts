// Main Deno.serve handler for YCloud webhook
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { CONFIG } from './config.ts';
import { leadService } from './services/lead.service.ts';
import { ragService } from './services/rag.service.ts';
import { minimaxService } from './services/minimax.service.ts';
import { vertexService } from './services/vertex.service.ts';
import { ycloudService } from './services/ycloud.service.ts';
import { fallbackHandler } from './utils/fallback-handler.ts';
import { promptBuilder } from './utils/prompt-builder.ts';
import type { YCloudWebhookPayload } from './types.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// In-memory cache to prevent processing duplicate retries from YCloud
const processedMessages = new Set<string>();

serve(async (req: Request) => {
  const startTime = Date.now();
  let payload: YCloudWebhookPayload;
  
  // Parse JSON upfront to handle errors properly
  let rawPayload: any;
  try {
    rawPayload = await req.json();
  } catch (jsonError) {
    console.error('[Edge] Failed to parse JSON:', jsonError.message);
    return new Response(JSON.stringify({ status: 'error', code: 'INVALID_JSON' }), { status: 400 });
  }

  if (!rawPayload) {
    console.error('[Edge] Empty payload');
    return new Response(JSON.stringify({ status: 'error', code: 'EMPTY_PAYLOAD' }), { status: 400 });
  }

  try {
    payload = rawPayload;

    console.log('[Edge] Raw payload keys:', Object.keys(payload));
    console.log('[Edge] whatsappMessage:', payload?.whatsappMessage ? 'EXISTS' : 'MISSING');
    console.log('[Edge] whatsappInboundMessage:', payload?.whatsappInboundMessage ? 'EXISTS' : 'MISSING');
    console.log('[Edge] payload:', payload?.payload ? 'EXISTS' : 'MISSING');

    // Normalize YCloud webhook payload
    // Some webhooks send whatsappMessage, others send whatsappInboundMessage, others send payload
    const msg = payload?.whatsappMessage || payload?.whatsappInboundMessage || payload?.payload;
    if (!msg) {
      console.error('[Edge] No message found in payload');
      return new Response(JSON.stringify({ status: 'error', code: 'INVALID_PAYLOAD' }), { status: 400 });
    }

    console.log('[Edge] Message extracted, from:', msg?.from);

    // Extract fields - handle both formats
    // YCloud webhook: from=customer phone, to=our business phone
    // To reply: send TO customer's phone (from), FROM our business phone (to)
    const customerPhone = msg.from || msg.fromUserId;
    const businessPhone = msg.to;
    const message = msg.text?.body || msg.content?.text || '';
    const messageId = msg.id;

    // PREVENT DUPLICATES (YCloud retries)
    if (messageId) {
      if (processedMessages.has(messageId)) {
        console.log('[Edge] Dropping duplicate message from YCloud retry:', messageId);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'duplicate_retry' }), { status: 200 });
      }
      processedMessages.add(messageId);
      // Clean up cache to prevent memory leak (keep last 500 max)
      if (processedMessages.size > 500) {
        const iterator = processedMessages.values();
        processedMessages.delete(iterator.next().value);
      }
    }
    
    // STOP PROCESSING OLD RETRIES
    const createTimeStr = payload.createTime || msg.createTime || msg.sendTime;
    if (createTimeStr) {
      const msgTime = new Date(createTimeStr).getTime();
      const now = Date.now();
      // Drop messages older than 3 minutes (180000 ms)
      if (now - msgTime > 180000) {
        console.log('[Edge] Dropping old message from queue:', createTimeStr);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'old_message_retry' }), { status: 200 });
      }
    }

    // Extract customer name from profile
    const customerName = payload.whatsappMessage?.customerProfile?.name || payload.whatsappInboundMessage?.customerProfile?.name;
    if (customerName) {
      console.log('[Edge] Customer:', customerName);
    }

    // 2. Validate
    if (!customerPhone?.trim()) {
      return new Response(JSON.stringify({ status: 'error', code: 'MISSING_PHONE' }), { status: 400 });
    }

    // 3. Upsert lead + append message
    await leadService.upsertLead(supabase, customerPhone, message, customerName);

    // 4. RAG context (vector search)
    const ragContext = await ragService.getKnowledgeContext(supabase, message);

    // 5. Build prompts
    const systemPrompt = promptBuilder.buildSystemPrompt(ragContext);
    const userMessage = promptBuilder.buildUserMessage(message);

    // 6. Call AI (MiniMax primary, Vertex secondary)
    let response: string;
    try {
      console.log('[Edge] Calling MiniMax...');
      response = await minimaxService.callMiniMax(systemPrompt, userMessage);
      console.log('[Edge] MiniMax response:', response.substring(0, 100));
    } catch (minimaxError: any) {
      console.warn('[Edge] MiniMax failed, falling back to Vertex AI:', minimaxError.message);
      console.log('[Edge] Calling Vertex AI...');
      response = await vertexService.callVertex(systemPrompt, userMessage);
      console.log('[Edge] Vertex response:', response.substring(0, 100));
    }

    // 7. Send via YCloud - FROM our business phone TO customer
    console.log('[Edge] Sending to YCloud - customer:', customerPhone, 'business:', businessPhone);
    await ycloudService.sendMessage(customerPhone, response, businessPhone);
    
    const latency = Date.now() - startTime;
    console.log(JSON.stringify({ event: 'success', latency_ms: latency, phone }));
    
    return new Response(JSON.stringify({ status: 'ok', message_id: messageId }), { status: 200 });
    
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorCode = error.message || 'INTERNAL_ERROR';

    // Only fallback on AI errors (timeout or API errors from MiniMax or Vertex)
    const isAIError = errorCode.includes('timeout') ||
                      errorCode.includes('TIMEOUT') ||
                      errorCode.includes('MINIMAX') ||
                      errorCode.includes('VERTEX');

    if (isAIError) {
      console.log(JSON.stringify({ event: 'fallback', reason: errorCode, latency_ms: latency }));
      await fallbackHandler.trigger(supabase, payload);
      return new Response(JSON.stringify({ status: 'fallback_triggered', code: errorCode }), { status: 504 });
    }

    // For other errors (YCLOUD, validation, etc), just log and return error
    console.log(JSON.stringify({ event: 'error', error: errorCode, latency_ms: latency }));
    return new Response(JSON.stringify({ status: 'error', code: errorCode }), { status: 500 });
  }
});
