import type { Message } from '../types.ts';

export const leadService = {
  async upsertLead(supabase: any, phone: string, message: string, customerName?: string): Promise<void> {
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

    const updateData: any = {
      phone,
      whatsapp_status: 'engaged',
      whatsapp_conversation: conversation,
      updated_at: now
    };

    // Add customer name if available
    if (customerName) {
      updateData.name = customerName;
    }

    await supabase
      .from('leads')
      .upsert(updateData, { onConflict: 'phone' });
  }
};
