// Main Deno.serve handler for YCloud webhook
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { CONFIG } from './config.ts';
import { leadService } from './services/lead.service.ts';
import { ragService } from './services/rag.service.ts';
import { minimaxService } from './services/minimax.service.ts';
import { ycloudService } from './services/ycloud.service.ts';
import { fallbackHandler } from './utils/fallback-handler.ts';
import { promptBuilder } from './utils/prompt-builder.ts';
import type { YCloudWebhookPayload } from './types.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req: Request) => {
  const startTime = Date.now();
  
  try {
    // 1. Parse YCloud payload
    const payload: YCloudWebhookPayload = await req.json();
    const { from: phone, content: { text: message }, id: messageId } = payload.payload;
    
    // 2. Validate
    if (!phone?.trim()) {
      return new Response(JSON.stringify({ status: 'error', code: 'MISSING_PHONE' }), { status: 400 });
    }
    
    // 3. Upsert lead + append message
    await leadService.upsertLead(supabase, phone, message);
    
    // 4. RAG context (vector search)
    const ragContext = await ragService.getKnowledgeContext(supabase, message);
    
    // 5. Build prompts
    const systemPrompt = promptBuilder.buildSystemPrompt(ragContext);
    const userMessage = promptBuilder.buildUserMessage(message);
    
    // 6. Call MiniMax (5s timeout)
    const response = await minimaxService.callMiniMax(systemPrompt, userMessage);
    
    // 7. Send via YCloud
    await ycloudService.sendMessage(phone, response);
    
    const latency = Date.now() - startTime;
    console.log(JSON.stringify({ event: 'success', latency_ms: latency, phone }));
    
    return new Response(JSON.stringify({ status: 'ok', message_id: messageId }), { status: 200 });
    
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const errorCode = error.message || 'INTERNAL_ERROR';
    
    // Check if MiniMax timeout
    if (errorCode.includes('timeout') || errorCode.includes('TIMEOUT')) {
      console.log(JSON.stringify({ event: 'fallback', reason: 'MINIMAX_TIMEOUT', latency_ms: latency }));
      await fallbackHandler.trigger(supabase, payload);
      return new Response(JSON.stringify({ status: 'error', code: 'MINIMAX_TIMEOUT' }), { status: 504 });
    }
    
    console.log(JSON.stringify({ event: 'error', error: errorCode, latency_ms: latency }));
    return new Response(JSON.stringify({ status: 'error', code: errorCode }), { status: 500 });
  }
});
