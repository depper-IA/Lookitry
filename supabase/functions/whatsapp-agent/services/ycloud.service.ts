export const ycloudService = {
  async sendMessage(to: string, text: string): Promise<void> {
    const response = await fetch('https://api.ycloud.com/v2/whatsapp/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('YCLOUD_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        type: 'text',
        content: { text }
      })
    });
    
    if (!response.ok) {
      throw new Error(`YCLOUD_ERROR: ${response.status}`);
    }
  }
};
