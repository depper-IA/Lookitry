/**
 * YCloud WhatsApp API Service
 * Sends messages via YCloud WhatsApp Business API
 */

const YCLOUD_API_URL = 'https://api.ycloud.com/v2/whatsapp/messages';

// Default FROM number - must be a registered YCloud WhatsApp Business number
const DEFAULT_FROM_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '+573248507947';

export const ycloudSendMessage = async (to: string, text: string, _from?: string): Promise<void> => {
  // Always send FROM our registered business number, not the passed _from param
  const businessNumber = DEFAULT_FROM_NUMBER.replace('+', '');
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

  const response = await fetch(YCLOUD_API_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.YCLOUD_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[YCloud] Send failed:', response.status, errorText);
    throw new Error(`YCLOUD_ERROR: ${response.status}`);
  }

  console.log('[YCloud] Message sent successfully');
};