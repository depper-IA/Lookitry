import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { minimaxService } from '../services/minimax.service';
import { vertexService } from '../services/vertex.service';
import { ycloudSendMessage } from '../services/ycloud.service';
import { rebeccaIdentityService } from '../services/rebecca-identity.service';
import { getRagContext } from '../services/rag-context.service';

// In-memory dedup cache
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

/**
 * POST /api/chat/ycloud-webhook
 * Receives YCloud WhatsApp webhook calls and processes with MiniMax AI
 * Uses SAME Rebecca prompt as web chat for unified experience
 */
export const handleYCloudWebhook = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const rawPayload = req.body;
    
    console.log('[YCloud-Webhook] Raw payload keys:', Object.keys(rawPayload));

    // Normalize YCloud webhook payload
    const msg = rawPayload?.whatsappMessage || rawPayload?.whatsappInboundMessage || rawPayload?.payload;
    if (!msg) {
      console.error('[YCloud-Webhook] No message found in payload');
      return res.status(400).json({ status: 'error', code: 'INVALID_PAYLOAD' });
    }

    // Extract fields
    const customerPhone = msg.from || msg.fromUserId;
    const businessPhone = msg.to;
    const message = msg.text?.body || msg.content?.text || '';
    const messageId = msg.id;

    console.log('[YCloud-Webhook] Message from:', customerPhone, '| content:', message.substring(0, 50));

    // DEDUPLICATION
    const contentHash = hashMessage(customerPhone || '', message);
    
    if (processedMessages.has(contentHash)) {
      console.log('[YCloud-Webhook] Dropping duplicate message:', contentHash);
      return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
    }
    
    if (messageId && processedMessages.has(messageId)) {
      console.log('[YCloud-Webhook] Dropping duplicate by ID:', messageId);
      return res.status(200).json({ status: 'ignored', reason: 'duplicate_id' });
    }
    
    processedMessages.add(contentHash);
    if (messageId) processedMessages.add(messageId);
    
    // Keep cache manageable
    if (processedMessages.size > 500) {
      const arr = Array.from(processedMessages);
      processedMessages.clear();
      arr.slice(-300).forEach(h => processedMessages.add(h));
    }

    if (!customerPhone?.trim()) {
      return res.status(400).json({ status: 'error', code: 'MISSING_PHONE' });
    }

    // Get customer name if available
    const customerName = rawPayload?.whatsappMessage?.customerProfile?.name || 
                         rawPayload?.whatsappInboundMessage?.customerProfile?.name;

    // 1. Find or create conversation (using phone as platform_id for WhatsApp)
    let { data: conversation } = await supabaseAdmin
      .from('lead_conversations')
      .select('*')
      .eq('platform_id', customerPhone)
      .eq('status', 'active')
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('lead_conversations')
        .insert({
          platform_id: customerPhone,
          status: 'active',
          source: 'whatsapp'
        })
        .select()
        .single();
        
      if (convError) {
        console.error('[YCloud-Webhook] Conversation creation error:', convError);
      } else {
        conversation = newConv;
      }
    }

    // 2. Insert message
    if (conversation) {
      const { error: msgError } = await supabaseAdmin
        .from('lead_messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'lead',
          content: message,
          metadata: { messageId, raw: rawPayload }
        });

      if (msgError) {
        console.error('[YCloud-Webhook] Message insertion error:', msgError);
      }
    }

    // 3. Upsert lead for CRM
    const { error: leadError } = await supabaseAdmin
      .from('leads')
      .upsert({
        phone: customerPhone,
        name: customerName || null,
        internal_notes: `Último mensaje: ${message}`,
        source: 'whatsapp',
        status: 'new',
        country: 'Colombia' // Default for now
      }, {
        onConflict: 'phone',
        ignoreDuplicates: true
      });

    if (leadError) {
      console.error('[YCloud-Webhook] Lead upsert error:', leadError);
    }

    // 4. RAG context (vector search) - SAME as web chat
    const ragContext = await getRagContext(message);

    // 3. Detect locale for Rebecca identity - SAME as web chat
    const locale = rebeccaIdentityService.detectLocale(message);

    // 4. Build system prompt using SAME service as web chat
    const systemPrompt = rebeccaIdentityService.getSystemPrompt(
      'whatsapp',  // channel: whatsapp
      ragContext,  // knowledge context
      locale       // detected locale (es-AR, es-CO, etc)
    );

    const userMessage = message;

    // 5. Call AI (MiniMax primary, Vertex fallback)
    let response: string;
    try {
      console.log('[YCloud-Webhook] Calling MiniMax... locale:', locale);
      response = await minimaxService.callMiniMax(systemPrompt, userMessage);
    } catch (minimaxError: any) {
      console.warn('[YCloud-Webhook] MiniMax failed, falling back to Vertex:', minimaxError.message);
      try {
        response = await vertexService.callVertex(systemPrompt, userMessage);
      } catch (vertexError: any) {
        console.error('[YCloud-Webhook] Vertex also failed:', vertexError.message);
        // Trigger n8n fallback
        const n8nUrl = process.env.N8N_WEBHOOK_URL;
        if (n8nUrl) {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rawPayload)
          });
        }
        return res.status(200).json({ status: 'fallback_triggered' });
      }
    }

    // 6. Clean response
    response = cleanResponse(response);

    if (!response || response.trim().length === 0) {
      console.error('[YCloud-Webhook] Empty response');
      return res.status(200).json({ status: 'ignored', reason: 'empty_response' });
    }

    // 7. Send via YCloud - ONLY ONCE
    console.log('[YCloud-Webhook] Sending to YCloud - customer:', customerPhone, 'business:', businessPhone);
    await ycloudSendMessage(customerPhone, response, businessPhone);

    const latency = Date.now() - startTime;
    console.log(JSON.stringify({ event: 'success', latency_ms: latency }));

    return res.status(200).json({ status: 'ok' });

  } catch (error: any) {
    console.error('[YCloud-Webhook] Fatal error:', error.message);
    return res.status(500).json({ status: 'error', code: error.message });
  }
};

function cleanResponse(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove thinking tags and content
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove any remaining parenthetical content
  cleaned = cleaned.replace(/\([A-Za-z0-9\u00C0-\u024F\u4e00-\u9fff\u0600-\u06FF]{1,100}\)/g, '');
  
  // Remove multiple spaces and newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}