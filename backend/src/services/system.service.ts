import os from 'os';

import fs from 'fs';

import { supabaseAdmin } from '../config/supabase';



export interface SystemStats {

  ram: {

    total: number;

    free: number;

    used: number;

    percentage: number;

  };

  uptime: number;

  platform: string;

}



export class SystemService {

  /**

   * Obtiene estadísticas de RAM leyendo de /proc/meminfo (Linux)

   */

  async getStats(): Promise<SystemStats> {

    const isLinux = process.platform === 'linux';

    let ram = { total: 0, free: 0, used: 0, percentage: 0 };



    if (isLinux) {

      try {

        const meminfo = await fs.promises.readFile('/proc/meminfo', 'utf8');

        const lines = meminfo.split('\n');

        

        const memTotalLine = lines.find(l => l.startsWith('MemTotal:'));

        const memAvailableLine = lines.find(l => l.startsWith('MemAvailable:'));



        if (memTotalLine && memAvailableLine) {

          const total = parseInt(memTotalLine.replace(/\D/g, '')) * 1024; // Convert to bytes

          const available = parseInt(memAvailableLine.replace(/\D/g, '')) * 1024;

          const used = total - available;

          const percentage = (used / total) * 100;



          ram = { total, free: available, used, percentage };

        }

      } catch (error) {

        console.error('[System] Error reading /proc/meminfo:', error);

        // Fallback en caso de error en Linux

        const total = os.totalmem();

        const free = os.freemem();

        ram = { total, free, used: total - free, percentage: ((total - free) / total) * 100 };

      }

    } else {

      // Fallback para desarrollo (Windows/Mac)

      const total = os.totalmem();

      const free = os.freemem();

      const used = total - free;

      ram = { total, free, used, percentage: (used / total) * 100 };

    }



    return {

      ram,

      uptime: process.uptime(),

      platform: process.platform

    };

  }



  /**

   * Verifica la RAM y crea una notificación si supera el umbral

   */

  async checkRamThreshold() {

    const stats = await this.getStats();

    const THRESHOLD = 90;



    if (stats.ram.percentage >= THRESHOLD) {

      console.warn(`[System] ALERTA: RAM al ${stats.ram.percentage.toFixed(2)}%`);

      

      // Evitar notificaciones duplicadas muy seguidas (cada hora)

      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

      const { data: existing } = await supabaseAdmin

        .from('admin_notifications')

        .select('id')

        .eq('type', 'system_alert_ram')

        .gte('created_at', oneHourAgo)

        .limit(1);



      if (!existing || existing.length === 0) {

        await supabaseAdmin

          .from('admin_notifications')

          .insert({

            type: 'system_alert_ram',

            title: 'â ï¸ Uso crítico de RAM',

            message: `El servidor está usando el ${stats.ram.percentage.toFixed(1)}% de la RAM (${(stats.ram.used / 1024 / 1024 / 1024).toFixed(2)} GB). Considera reiniciar servicios.`,

            severity: 'error',

            metadata: { stats }

          });

      }

    }

  }

}



export const systemService = new SystemService();

