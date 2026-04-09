import express from 'express';
import { parseUpdate } from './src/telegram-webhook';

const app = express();
app.use(express.json());

const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramAllowedUserIds: new Set<number>(
    (process.env.TELEGRAM_ALLOWED_USER_IDS ?? '1049458877')
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
  ),
  groqApiKey: process.env.GROQ_API_KEY ?? '',
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function queryGroq(message: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are Sammy, the orchestrator agent for Lookitry's AI team. You receive tasks and delegate to the correct specialized agent (WebWizard for frontend/UX, DevGuardian for quality/security, DataAlchemist for DB/AI/n8n, GrowthPilot for CRM/Marketing, ArchitectAI for infrastructure). You NEVER write code directly - only plan, delegate, and coordinate. Be concise and direct.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? 'Lo siento, no pude procesar tu solicitud.';
}

async function sendTelegramMessage(token: string, chatId: number, text: string): Promise<void> {
  const cleanText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: cleanText, parse_mode: 'HTML' }),
  });
}

async function sendTypingAction(token: string, chatId: number): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

app.post('/webhook', async (req, res) => {
  try {
    const update = parseUpdate(req.body);

    if (!update || !update.message?.from || !update.message.text) {
      res.status(200).send('OK');
      return;
    }

    const userId = update.message.from.id;

    if (!config.telegramAllowedUserIds.has(userId)) {
      console.warn(`Unauthorized access from user ID: ${userId}`);
      res.status(200).send('OK');
      return;
    }

    const text = update.message.text;

    if (text.startsWith('/')) {
      res.status(200).send('OK');
      return;
    }

    const chatId = update.message.chat.id;

    // Send initial typing action
    await sendTypingAction(config.telegramBotToken, chatId);

    // Get response from Groq
    const response = await queryGroq(text);

    // Send response to Telegram
    await sendTelegramMessage(config.telegramBotToken, chatId, response);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sammy-webhook' });
});

const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => {
  console.log(`Sammy webhook running on port ${PORT}`);
  console.log(`Telegram bot token: ${config.telegramBotToken ? '✓ configured' : '✗ missing'}`);
  console.log(`Groq API key: ${config.groqApiKey ? '✓ configured' : '✗ missing'}`);
});