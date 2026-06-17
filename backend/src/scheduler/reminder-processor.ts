/**
 * Reminder Processor - Phase 1
 * 
 * Cron job que procesa recordatorios pendientes para leads inactivos.
 * Se ejecuta cada hora.
 * 
 * Flujo:
 * 1. Obtiene todos los pendientes de queue:pending_reminders
 * 2. Verifica si el lead compró en las últimas 24h
 * 3. Si no compró, guarda en reminder:pending:{session_id} con TTL 7 días
 * 4. Elimina de la queue
 */

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase';
import { redis } from '../config/redis';

interface PendingReminder {
  session_id: string;
  type: 'plans_visit' | 'checkout_abandoned' | 'page_visit';
  visited_at: string;
  page_url?: string;
}

const PENDING_REMINDER_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Verifica si el lead ya compró después de la visita.
 */
async function hasLeadPurchasedSince(visitedAt: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscription_payments')
      .select('id')
      .gte('created_at', visitedAt)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error(`[ReminderProcessor] Error checking purchase: ${error.message}`);
      return false;
    }

    return data !== null;
  } catch (err) {
    console.error(`[ReminderProcessor] Exception checking purchase:`, err);
    return false;
  }
}

/**
 * Guarda el recordatorio pendiente en Redis.
 */
async function savePendingReminder(sessionId: string, reminder: PendingReminder): Promise<void> {
  try {
    const key = `reminder:pending:${sessionId}`;
    const value = JSON.stringify({
      type: reminder.type,
      visited_at: reminder.visited_at,
      page_url: reminder.page_url,
    });

    await redis.set(key, value, 'EX', PENDING_REMINDER_TTL);
    console.log(`[ReminderProcessor] Saved pending reminder for session: ${sessionId}`);
  } catch (err) {
    console.error(`[ReminderProcessor] Error saving pending reminder:`, err);
  }
}

/**
 * Obtiene el mensaje de recordatorio según el tipo.
 */
export function getReminderMessage(type: string, pageUrl?: string): string {
  switch (type) {
    case 'checkout_abandoned':
      return "Vi que quedaste en el checkout ayer. ¿Necesitás ayuda con el proceso de activación?";
    case 'plans_visit':
      return "Vi que viste los planes hace un rato. ¿Tenés alguna duda antes de elegir el tuyo?";
    case 'page_visit':
      if (pageUrl === '/demo') {
        return "Vi que probaste la demo. ¿Te gustaría ver cómo Lookitry puede ayudar a tu tienda?";
      }
      return "Vi que estuviste mirando opciones. ¿Hay algo en lo que te pueda ayudar?";
    default:
      return "Vi que estuviste por aquí. ¿Hay algo en lo que te pueda ayudar?";
  }
}

/**
 * Procesa un recordatorio individual.
 */
async function processReminder(reminderStr: string): Promise<boolean> {
  try {
    const reminder: PendingReminder = JSON.parse(reminderStr);
    
    // Verificar si el lead ya compró
    const hasPurchased = await hasLeadPurchasedSince(reminder.visited_at);
    if (hasPurchased) {
      console.log(`[ReminderProcessor] Lead already purchased, skipping reminder for session: ${reminder.session_id}`);
      return true; // Completed (no need to add to pending)
    }

    // Guardar como recordatorio pendiente
    await savePendingReminder(reminder.session_id, reminder);

    return true;
  } catch (err) {
    console.error(`[ReminderProcessor] Error processing reminder:`, err);
    return false;
  }
}

/**
 * Ejecuta el procesamiento de recordatorios.
 */
export async function runReminderProcessor(): Promise<void> {
  console.log('[ReminderProcessor] Starting reminder processing...');

  try {
    // Obtener todos los recordatorios pendientes de la cola
    const pendingReminders = await redis.lrange('queue:pending_reminders', 0, -1);

    if (!pendingReminders || pendingReminders.length === 0) {
      console.log('[ReminderProcessor] No pending reminders to process.');
      return;
    }

    console.log(`[ReminderProcessor] Found ${pendingReminders.length} reminders to process.`);

    let processedCount = 0;
    let errorCount = 0;

    for (const reminderStr of pendingReminders) {
      const success = await processReminder(reminderStr);
      
      if (success) {
        // Eliminar de la cola
        await redis.lrem('queue:pending_reminders', 1, reminderStr);
        processedCount++;
      } else {
        errorCount++;
      }
    }

    console.log(`[ReminderProcessor] Processed: ${processedCount}, Errors: ${errorCount}`);
    console.log('[ReminderProcessor] Reminder processing completed.');
  } catch (err) {
    console.error('[ReminderProcessor] Reminder processing failed:', err);
    throw err;
  }
}

/**
 * Agrega un recordatorio a la cola para procesamiento.
 */
export async function enqueueReminder(sessionId: string, type: PendingReminder['type'], pageUrl?: string): Promise<void> {
  try {
    const reminder: PendingReminder = {
      session_id: sessionId,
      type,
      visited_at: new Date().toISOString(),
      page_url: pageUrl,
    };

    await redis.lpush('queue:pending_reminders', JSON.stringify(reminder));
    console.log(`[ReminderProcessor] Enqueued reminder for session: ${sessionId}, type: ${type}`);
  } catch (err) {
    console.error(`[ReminderProcessor] Error enqueueing reminder:`, err);
    throw err;
  }
}

/**
 * Inicializa el cron job de procesamiento de recordatorios.
 * Se ejecuta cada hora.
 */
export function initReminderProcessor(): void {
  // Cron: 0 * * * * = Every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[ReminderProcessor] Cron triggered - processing reminders...');
    try {
      await runReminderProcessor();
    } catch (err) {
      console.error('[ReminderProcessor] Cron execution failed:', err);
    }
  });

  console.log('[ReminderProcessor] Scheduled: Every hour at minute 0');
}