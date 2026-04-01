import TelegramBot from 'node-telegram-bot-api';
import {
  auditPayments,
  auditSubscriptions,
  auditAI,
  auditSecurity,
  auditHealth,
} from '../auditor';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

let bot: TelegramBot | null = null;

function isAdmin(chatId: number | string): boolean {
  if (!TELEGRAM_ADMIN_CHAT_ID) return true;
  return String(chatId) === TELEGRAM_ADMIN_CHAT_ID;
}

function formatAuditResult(title: string, sections: string[]): string {
  const divider = '---';
  const body = sections.join('\n\n');
  return `${title}\n${divider}\n${body}`;
}

async function handleCommand(msg: TelegramBot.Message, command: string) {
  const chatId = msg.chat.id;

  if (!isAdmin(chatId)) {
    await bot!.sendMessage(chatId, 'No tienes permiso para usar este bot.');
    return;
  }

  let result: { summary: string; sections: string[] };

  switch (command) {
    case '/start':
      await sendMainMenu(chatId);
      return;

    case '/pagos':
      result = await auditPayments();
      break;

    case '/suscripciones':
      result = await auditSubscriptions();
      break;

    case '/ia':
      result = await auditAI();
      break;

    case '/seguridad':
      result = await auditSecurity();
      break;

    case '/health':
      result = await auditHealth();
      break;

    case '/full':
      const payments = await auditPayments();
      const subscriptions = await auditSubscriptions();
      const ai = await auditAI();
      const security = await auditSecurity();
      const health = await auditHealth();

      const fullReport = [
        `REPORTE COMPLETO - LOOKITRY`,
        `Fecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`,
        '',
        ...payments.sections,
        '',
        '========================',
        ...subscriptions.sections,
        '',
        '========================',
        ...ai.sections,
        '',
        '========================',
        ...security.sections,
        '',
        '========================',
        ...health.sections,
      ];

      await bot!.sendMessage(chatId, fullReport.join('\n'), { parse_mode: 'HTML' });
      return;

    default:
      await bot!.sendMessage(chatId, 'Comando no reconocido. Usa /start para ver las opciones disponibles.');
      return;
  }

  const message = formatAuditResult(result.summary, result.sections);
  await bot!.sendMessage(chatId, message, { parse_mode: 'HTML' });
}

async function sendMainMenu(chatId: number) {
  const menu = `Auditor Lookitry

Comandos disponibles:

/pagos - Auditoria de pagos ultimas 24h
/suscripciones - Estado de suscripciones y trials
/ia - Metricas de generaciones IA
/seguridad - Alertas de seguridad y accesos
/health - Estado de todos los servicios
/full - Reporte completo de todo

Usa los botones de abajo o escribe el comando.`;

  await bot!.sendMessage(chatId, menu, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Pagos', callback_data: '/pagos' },
          { text: 'Suscripciones', callback_data: '/suscripciones' },
        ],
        [
          { text: 'IA', callback_data: '/ia' },
          { text: 'Seguridad', callback_data: '/seguridad' },
        ],
        [
          { text: 'Health', callback_data: '/health' },
          { text: 'FULL REPORT', callback_data: '/full' },
        ],
      ],
    },
  });
}

export function startTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram] TELEGRAM_BOT_TOKEN no definido. Bot deshabilitado.');
    return;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    bot.on('message', async (msg) => {
      if (!msg.text) return;
      const command = msg.text.trim().toLowerCase();
      await handleCommand(msg, command);
    });

    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message;
      const data = callbackQuery.data;
      if (!msg || !data) return;

      await bot!.answerCallbackQuery(callbackQuery.id);
      await handleCommand(msg, data);
    });

    bot.on('polling_error', (error) => {
      console.error('[Telegram] Polling error:', error.message);
    });

    console.log('[Telegram] Bot iniciado correctamente.');
  } catch (error) {
    console.error('[Telegram] Error iniciando el bot:', error);
  }
}

export { bot };
