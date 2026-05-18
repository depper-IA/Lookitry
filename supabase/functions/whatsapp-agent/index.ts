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
// NOTE: In Edge Functions, this persists within a warm execution context
const processedMessages = new Set<string>();

// Hash-based dedup to handle message content duplicates
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

serve(async (req: Request) => {
  const startTime = Date.now();
  let payload: YCloudWebhookPayload;
  
  // Parse JSON upfront
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

    // Normalize YCloud webhook payload
    const msg = payload?.whatsappMessage || payload?.whatsappInboundMessage || payload?.payload;
    if (!msg) {
      console.error('[Edge] No message found in payload');
      return new Response(JSON.stringify({ status: 'error', code: 'INVALID_PAYLOAD' }), { status: 400 });
    }

    // Extract fields
    const customerPhone = msg.from || msg.fromUserId;
    const businessPhone = msg.to;
    const message = msg.text?.body || msg.content?.text || '';
    const messageId = msg.id;

    console.log('[Edge] Message from:', customerPhone, '| content:', message.substring(0, 50));

    // 1. DEDUPLICATION - Check messageId AND content hash BEFORE processing
    const contentHash = hashMessage(customerPhone || '', message);
    
    // Check if already processing this exact message
    if (processedMessages.has(contentHash)) {
      console.log('[Edge] Dropping duplicate message by content hash:', contentHash);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'duplicate_content' }), { status: 200 });
    }
    
    // Also check by messageId if present
    if (messageId && processedMessages.has(messageId)) {
      console.log('[Edge] Dropping duplicate message by ID:', messageId);
      return new Response(JSON.stringify({ status: 'ignored', reason: 'duplicate_retry' }), { status: 200 });
    }
    
    // Mark as being processed - prevents concurrent processing of same message
    processedMessages.add(contentHash);
    if (messageId) {
      processedMessages.add(messageId);
    }
    
    // Keep cache manageable
    if (processedMessages.size > 500) {
      const arr = Array.from(processedMessages);
      processedMessages.clear();
      arr.slice(-300).forEach(h => processedMessages.add(h));
    }

    // 2. Validate phone
    if (!customerPhone?.trim()) {
      return new Response(JSON.stringify({ status: 'error', code: 'MISSING_PHONE' }), { status: 400 });
    }

    // 3. Extract customer name
    const customerName = payload?.whatsappMessage?.customerProfile?.name || 
                         payload?.whatsappInboundMessage?.customerProfile?.name;

    // 4. PROCESS MESSAGE SYNCHRONOUSLY - don't return until done
    // This ensures we only send ONE response per message
    try {
      console.log('[Edge] Processing message...');

      // Upsert lead + append message
      await leadService.upsertLead(supabase, customerPhone, message, customerName);

      // RAG context (vector search)
      const ragContext = await ragService.getKnowledgeContext(supabase, message);

      // Build prompts
      const systemPrompt = promptBuilder.buildSystemPrompt(ragContext);
      const userMessage = promptBuilder.buildUserMessage(message);

      // Call AI (MiniMax primary, Vertex secondary)
      let response: string;
      try {
        console.log('[Edge] Calling MiniMax...');
        response = await minimaxService.callMiniMax(systemPrompt, userMessage);
        console.log('[Edge] MiniMax response received, length:', response.length);
      } catch (minimaxError: any) {
        console.warn('[Edge] MiniMax failed, falling back to Vertex AI:', minimaxError.message);
        try {
          response = await vertexService.callVertex(systemPrompt, userMessage);
        } catch (vertexError: any) {
          console.error('[Edge] Vertex also failed:', vertexError.message);
          await fallbackHandler.trigger(supabase, payload);
          return new Response(JSON.stringify({ status: 'fallback_triggered', code: 'AI_ERROR' }), { status: 200 });
        }
      }

      // Clean response
      response = cleanResponse(response);

      if (!response || response.trim().length === 0) {
        console.error('[Edge] Empty response after cleaning');
        return new Response(JSON.stringify({ status: 'ignored', reason: 'empty_response' }), { status: 200 });
      }

      // Send via YCloud - ONLY ONCE
      console.log('[Edge] Sending to YCloud - customer:', customerPhone, 'business:', businessPhone);
      await ycloudService.sendMessage(customerPhone, response, businessPhone);
      
      const latency = Date.now() - startTime;
      console.log(JSON.stringify({ event: 'success', latency_ms: latency }));

      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      
    } catch (processError: any) {
      console.error('[Edge] Processing error:', processError.message);
      
      const isAIError = processError.message.includes('timeout') ||
                        processError.message.includes('MINIMAX') ||
                        processError.message.includes('VERTEX');
      
      if (isAIError) {
        await fallbackHandler.trigger(supabase, payload);
        return new Response(JSON.stringify({ status: 'fallback_triggered' }), { status: 200 });
      }
      
      return new Response(JSON.stringify({ status: 'error', code: processError.message }), { status: 500 });
    }

  } catch (error: any) {
    console.error('[Edge] Fatal error:', error.message);
    return new Response(JSON.stringify({ status: 'error', code: error.message }), { status: 500 });
  }
});

// Clean response text - remove thinking blocks that leaked through
function cleanResponse(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove thinking tags and content
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove any remaining parenthetical content that looks like thinking artifacts
  cleaned = cleaned.replace(/\([A-Za-z0-9\u00C0-\u024F\u4e00-\u9fff\u0600-\u06FF]{1,100}\)/g, '');
  
  // Remove multiple spaces and newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}