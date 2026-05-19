export const ycloudService = {
  async sendMessage(to: string, text: string, from?: string): Promise<void> {
    if (!from) {
      throw new Error('YCLOUD_ERROR: Missing business number (from) in webhook payload');
    }

    // YCloud expects numbers in format without + for from, but with + for to
    const businessNumber = from.replace('+', '');
    const customerNumber = to.startsWith('+') ? to : `+${to}`;

    console.log('[YCloud] to:', customerNumber, 'from:', businessNumber);

    const payload = {
      to: customerNumber,
      from: businessNumber,
      type: 'text',
      text: {
        body: text
      }
    };

    const response = await fetch('https://api.ycloud.com/v2/whatsapp/messages', {
      method: 'POST',
      headers: {
        'X-API-Key': Deno.env.get('YCLOUD_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[YCloud] Send failed:', response.status, errorText);
      throw new Error(`YCLOUD_ERROR: ${response.status}`);
    }
  }
};
