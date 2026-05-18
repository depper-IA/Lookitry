import type { Message } from '../types.ts';

export const leadService = {
  async upsertLead(supabase: any, phone: string, message: string): Promise<void> {
    const now = new Date().toISOString();
    const newMessage: Message = { role: 'user', content: message, timestamp: now };
    
    const { data: existing } = await supabase
      .from('leads')
      .select('whatsapp_conversation')
      .eq('phone', phone)
      .single();
    
    const conversation = existing?.whatsapp_conversation || [];
    conversation.push(newMessage);
    if (conversation.length > 50) conversation = conversation.slice(-50);
    
    await supabase
      .from('leads')
      .upsert({
        phone,
        whatsapp_status: 'engaged',
        whatsapp_conversation: conversation,
        updated_at: now
      }, { onConflict: 'phone' });
  }
};
