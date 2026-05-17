import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { rebeccaChatService } from '../services/rebecca-chat.service';

type ConversationStatus = 'new' | 'in_progress' | 'classified' | 'resolved' | 'escalated';

interface UpdateConversationStatusBody {
  last_response?: string;
  status?: ConversationStatus;
  lead_category?: string;
  bot_status?: string;
}

/**
 * PATCH /api/chat/conversations/:id/status
 * Called by n8n WhatsApp workflow. :id is the contact phone number.
 * Accepts any combination of: last_response, status, lead_category, bot_status.
 */
export const updateConversationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateConversationStatusBody;

    const update: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      update.status = body.status;
    }

    if (body.last_response) {
      update.internal_notes = body.last_response;
    }

    if (body.lead_category) {
      update.business_type_confirmed = body.lead_category;
    }

    const fieldCount = Object.keys(update).length - 1; // exclude updated_at

    const { error } = await supabaseAdmin
      .from('leads')
      .update(update)
      .eq('phone', id);

    if (error) throw error;

    return res.status(200).json({ success: true, updated: fieldCount });
  } catch (error: any) {
    console.error('[Chat] updateConversationStatus:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/chat/webhook
 * Receives incoming WhatsApp messages from a gateway
 */
export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    // Assuming a generic webhook format. 
    // The user will need to map their WhatsApp gateway payload to this.
    const { platform_id, content, metadata } = req.body;

    if (!platform_id || !content) {
      return res.status(400).json({ error: 'Missing platform_id or content' });
    }

    // Find or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('lead_conversations')
      .select('*')
      .eq('platform_id', platform_id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('lead_conversations')
        .insert({
          platform_id,
          status: 'active',
          source: 'whatsapp'
        })
        .select()
        .single();
        
      if (convError) throw convError;
      conversation = newConv;
    }

    // Insert message
    const { error: msgError } = await supabaseAdmin
      .from('lead_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'lead',
        content,
        metadata: metadata || {}
      });

    if (msgError) throw msgError;

    // Trigger n8n workflow for AI processing? 
    // (This would be configured on the n8n side or called via HTTP, 
    // but the instructions say to detail n8n changes manually).

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in chat webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/chat/conversations
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lead_conversations')
      .select('*, brands:lead_id(name, email)')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ conversations: data });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/chat/conversations/:id
 */
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('lead_messages')
      .select('*, lead_attachments(*)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ messages: data });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/chat/widget
 * Public stateless endpoint for the Rebecca web chat widget.
 */
export const widgetReply = async (req: Request, res: Response) => {
  try {
    const { session_id, message, history } = req.body as {
      session_id?: unknown;
      message?: unknown;
      history?: unknown;
    };

    if (typeof session_id !== 'string' || session_id.trim().length === 0) {
      return res.status(400).json({ error: 'invalid_input', details: 'session_id is required and must be a string' });
    }
    if (session_id.length > 128) {
      return res.status(400).json({ error: 'invalid_input', details: 'session_id exceeds 128 characters' });
    }
    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'invalid_input', details: 'message is required and must be a non-empty string' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'invalid_input', details: 'message exceeds 1000 characters' });
    }

    const parsedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (history !== undefined) {
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: 'invalid_input', details: 'history must be an array' });
      }
      if (history.length > 10) {
        return res.status(400).json({ error: 'invalid_input', details: 'history exceeds 10 items' });
      }
      for (const item of history) {
        if (
          typeof item !== 'object' ||
          item === null ||
          (item.role !== 'user' && item.role !== 'assistant') ||
          typeof item.content !== 'string'
        ) {
          return res.status(400).json({ error: 'invalid_input', details: 'each history item must have role (user|assistant) and content (string)' });
        }
        parsedHistory.push({ role: item.role, content: item.content });
      }
    }

    const reply = await rebeccaChatService.replyForChannel('web', session_id, message, parsedHistory);
    return res.status(200).json({ reply, session_id });
  } catch (error: any) {
    console.error('[Chat] widgetReply:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/chat/conversations/:id/reply
 */
export const replyToConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // 1. Insert message into DB
    const { data: message, error } = await supabaseAdmin
      .from('lead_messages')
      .insert({
        conversation_id: id,
        sender_type: 'agent',
        content
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Update conversation updated_at (handled by trigger but good to ensure status is active)
    await supabaseAdmin
      .from('lead_conversations')
      .update({ status: 'active' })
      .eq('id', id);

    // 3. Send message via WhatsApp Gateway
    // Depending on the gateway, an API call would happen here.
    // e.g. await sendWhatsAppMessage(conversation.platform_id, content);
    
    return res.status(200).json({ success: true, message });
  } catch (error: any) {
    console.error('Error replying to conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
