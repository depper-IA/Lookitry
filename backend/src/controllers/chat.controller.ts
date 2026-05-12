import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

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
