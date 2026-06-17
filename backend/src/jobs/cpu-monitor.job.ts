import cron from 'node-cron';
import os from 'os';

import { EmailService } from '../services/email.service';

const ALERT_EMAIL = 'samwilkiedevs@gmail.com';
// Alert when normalized load (load1 / vCPUs) exceeds this ratio
const LOAD_RATIO_THRESHOLD = 0.8;
// Minimum time between alert emails (1 hour)
const EMAIL_COOLDOWN_MS = 60 * 60 * 1000;

let lastAlertSentAt: number | null = null;
const emailService = new EmailService();

async function checkCpuLoad(): Promise<void> {
  const [load1, load5, load15] = os.loadavg();
  const cpuCount = os.cpus().length;
  const ratio = load1 / cpuCount;

  if (ratio < LOAD_RATIO_THRESHOLD) return;

  const now = Date.now();
  if (lastAlertSentAt !== null && now - lastAlertSentAt < EMAIL_COOLDOWN_MS) return;

  lastAlertSentAt = now;

  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const usedMb = totalMb - freeMb;
  const memPct = Math.round((usedMb / totalMb) * 100);
  const timestamp = new Date().toISOString();

  try {
    await emailService.sendEmail({
      to: ALERT_EMAIL,
      subject: `[Lookitry VPS] CPU alert — load ${load1.toFixed(2)} on ${cpuCount} vCPUs`,
      html: `
        <h2 style="color:#d32f2f">CPU Alert — Lookitry VPS</h2>
        <p>Load average exceeded <strong>${Math.round(LOAD_RATIO_THRESHOLD * 100)}%</strong> of total CPU capacity.</p>
        <table cellpadding="6" style="border-collapse:collapse;font-family:monospace">
          <tr><td><b>Load avg 1 min</b></td><td>${load1.toFixed(2)}</td></tr>
          <tr><td><b>Load avg 5 min</b></td><td>${load5.toFixed(2)}</td></tr>
          <tr><td><b>Load avg 15 min</b></td><td>${load15.toFixed(2)}</td></tr>
          <tr><td><b>vCPUs</b></td><td>${cpuCount}</td></tr>
          <tr><td><b>Memory used</b></td><td>${usedMb} MB / ${totalMb} MB (${memPct}%)</td></tr>
          <tr><td><b>Triggered at</b></td><td>${timestamp}</td></tr>
        </table>
        <p style="margin-top:16px">
          <a href="https://api.lookitry.com/health">https://api.lookitry.com/health</a>
        </p>
        <p style="color:#888;font-size:12px">Next alert suppressed for 1 hour after this one.</p>
      `,
    });
    console.log(`[cpu-monitor] Alert sent — load1=${load1.toFixed(2)} ratio=${ratio.toFixed(2)}`);
  } catch (err: any) {
    console.error('[cpu-monitor] Failed to send alert:', err?.message || err);
  }
}

export function startCpuMonitorJob(): void {
  cron.schedule('*/5 * * * *', () => {
    checkCpuLoad().catch((err) =>
      console.error('[cpu-monitor] Unexpected error:', err?.message || err),
    );
  });
  console.log(
    `[cpu-monitor] Started — checks every 5 min, threshold ${Math.round(LOAD_RATIO_THRESHOLD * 100)}% load, alerts to ${ALERT_EMAIL}`,
  );
}
