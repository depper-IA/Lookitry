#!/usr/bin/env node
/**
 * Sammy - Orchestrator Agent
 * Main entry point for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { env } from './config/env.js';
import { Memory } from './memory/sqlite.js';
import { LLMManager, MiniMaxProvider, GroqProvider, OpenRouterProvider } from './llm/index.js';
import { ToolRegistry } from './tools/index.js';
import { Agent } from './agent/index.js';
import { TelegramBot } from './bot/index.js';
import { AgentActivitySync } from './sync/supabase-sync.js';
import { HeartbeatService } from './sync/heartbeat.js';
import type { Config } from './types/index.js';

async function main() {
  console.log('🚀 Sammy Orchestrator starting...');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Project root: ${env.PROJECT_ROOT}`);

  // 1. Load configuration
  const config: Config = {
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramAllowedUserIds: new Set(env.TELEGRAM_ALLOWED_USER_IDS),
    groqApiKey: env.GROQ_API_KEY || '',
    openrouterApiKey: env.OPENROUTER_API_KEY || '',
    openrouterModel: 'openrouter/auto',
    minimaxApiKey: env.MINIMAX_API_KEY || '',
    minimaxModel: 'MiniMax-M2.7',
    dbPath: env.DB_PATH,
    maxAgentIterations: env.MAX_AGENT_ITERATIONS,
    projectRoot: env.PROJECT_ROOT,
    maxAudioFileSizeMb: 50,
    supabaseUrl: env.SUPABASE_URL || '',
    supabaseServiceKey: env.SUPABASE_SERVICE_KEY || '',
    supabaseSyncIntervalMs: 30000,
  };

  // Validate required config
  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  if (config.telegramAllowedUserIds.size === 0) {
    console.warn('⚠️  TELEGRAM_ALLOWED_USER_IDS is empty - bot will reject all users');
  }

  // 2. Initialize memory
  console.log(`Initializing memory at ${config.dbPath}`);
  const memory = new Memory(config.dbPath);

  // 3. Initialize LLM providers
  const providers = [];
  if (config.minimaxApiKey) {
    providers.push(new MiniMaxProvider(config.minimaxApiKey, config.minimaxModel));
    console.log('✅ MiniMax provider enabled');
  }
  if (config.groqApiKey) {
    providers.push(new GroqProvider(config.groqApiKey));
    console.log('✅ Groq provider enabled');
  }
  if (config.openrouterApiKey) {
    providers.push(new OpenRouterProvider(config.openrouterApiKey, config.openrouterModel));
    console.log('✅ OpenRouter provider enabled (will be skipped for general tasks)');
  }
  if (providers.length === 0) {
    throw new Error('At least one LLM provider API key is required (MINIMAX_API_KEY or GROQ_API_KEY)');
  }
  const llmManager = new LLMManager(providers);

  // 4. Initialize tools
  const getProjectContext = () => {
    // Simple context: project root and environment
    return `Project root: ${config.projectRoot}\nEnvironment: ${env.NODE_ENV}\nCurrent time: ${new Date().toISOString()}`;
  };

  const getSystemPrompt = () => {
    try {
      const promptPath = path.join(config.projectRoot, '.opencode', 'agents', 'sammy.md');
      return fs.readFileSync(promptPath, 'utf8');
    } catch (e) {
      console.error('⚠️ Could not read sammy.md prompt file, using fallback');
      return '';
    }
  };

  const toolRegistry = new ToolRegistry(config.projectRoot, getProjectContext, config.supabaseUrl, config.supabaseServiceKey);
  console.log(`✅ Tools registered: ${toolRegistry.getDefinitions().map(t => t.name).join(', ')}`);

  // 5. Initialize agent
  const agent = new Agent(llmManager, toolRegistry, memory, config.maxAgentIterations, getProjectContext, getSystemPrompt);
  console.log('✅ Agent initialized');

  // 6. Initialize bot
  const bot = new TelegramBot(config);
  console.log('✅ Telegram bot initialized');

  // 7. Set up bot handlers
  bot.onText(async (ctx, text) => {
    console.log(`📨 Message from ${ctx.from?.id}: ${text.substring(0, 100)}`);
    try {
      const response = await agent.run(text, `telegram_${ctx.from?.id}`);
      try {
        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (parseError: any) {
        console.warn('Markdown parse failed, sending as plain text', parseError.message);
        await ctx.reply(response);
      }
    } catch (error) {
      console.error('Agent error:', error);
      await ctx.reply('⚠️ Error processing your request. Please try again.');
    }
  });

  bot.onCommand('start', async (ctx) => {
    await ctx.reply('¡Hola! Soy Sammy, tu asistente de IA para Lookitry. Puedes preguntarme sobre el proyecto, revisar archivos, buscar código, etc. Envíame un mensaje y te ayudaré.');
  });

  bot.onCommand('status', async (ctx) => {
    const now = new Date();
    await ctx.reply(`✅ Sammy está activo.\n📅 ${now.toLocaleString('es-CO')}\n💾 Memoria: ${config.dbPath}`);
  });

  bot.onCommand('help', async (ctx) => {
    const helpText = `
<b>Comandos disponibles:</b>
/start - Iniciar conversación
/status - Estado del agente
/help - Esta ayuda

<b>Funcionalidades:</b>
• Puedo leer archivos del proyecto
• Buscar código
• Ver estado de git
• Responder preguntas sobre Lookitry

Envía un mensaje de texto para interactuar con el agente.
    `.trim();
    await ctx.reply(helpText, { parse_mode: 'HTML' });
  });

  // Optional: audio and photo handlers (can be enabled later)
  // bot.onAudio(...);
  // bot.onPhoto(...);

  // 8. Initialize sync services (if credentials provided)
  let activitySync: AgentActivitySync | undefined;
  if (config.supabaseUrl && config.supabaseServiceKey) {
    activitySync = new AgentActivitySync(config.supabaseUrl, config.supabaseServiceKey, config.supabaseSyncIntervalMs);
    activitySync.start();
    console.log('✅ Agent activity sync enabled');
  } else {
    console.log('⚠️  Supabase credentials not provided - agent activity sync disabled');
  }

  let heartbeat: HeartbeatService | undefined;
  if (env.API_BASE_URL && config.supabaseServiceKey) {
    heartbeat = new HeartbeatService({
      apiBaseUrl: env.API_BASE_URL,
      agentName: 'sammy',
      serviceKey: config.supabaseServiceKey,
      intervalMs: 30000,
    });
    heartbeat.start();
    console.log('✅ Heartbeat service enabled');
  } else {
    console.log('⚠️  API_BASE_URL or service key missing - heartbeat disabled');
  }

  // 9. Start bot
  console.log('🤖 Starting Telegram bot...');
  await bot.start();
  console.log('✅ Sammy is running. Press Ctrl+C to stop.');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    bot.stop().catch(() => {});
    activitySync?.stop();
    heartbeat?.stop();
    // Close memory database
    // Note: Memory class doesn't have close method; we assume better-sqlite3 auto-closes on process exit.
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});