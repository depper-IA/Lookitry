export const fallbackHandler = {
  async trigger(supabase: any, payload: any): Promise<void> {
    const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nUrl) {
      console.error('[Fallback] N8N_WEBHOOK_URL not configured');
      return;
    }
    
    await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
};
