import cron from 'node-cron';
import { emailCampaignService } from '../services/email-campaign.service';

/**
 * Job para procesar campañas de email programadas.
 * Se ejecuta cada 5 minutos para:
 * 1. Activar campañas cuya hora programada ya pasó
 * 2. Procesar el siguiente batch de emails pendientes
 */
export async function startEmailCampaignJob() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[EmailCampaign Job] Verificando campañas programadas...');

    try {
      const toActivate = await emailCampaignService.processScheduledCampaigns();

      for (const campaignId of toActivate) {
        console.log(`[EmailCampaign Job] Activando campaña: ${campaignId}`);
      }

      if (toActivate.length > 0) {
        console.log(`[EmailCampaign Job] ${toActivate.length} campaña(s) activada(s)`);
      }

      const { data: processingCampaigns } = await (await import('../config/supabase')).supabaseAdmin
        .from('email_campaigns')
        .select('id')
        .eq('status', 'processing');

      for (const campaign of processingCampaigns || []) {
        const result = await emailCampaignService.processNextBatch(campaign.id);
        console.log(
          `[EmailCampaign Job] Campaña ${campaign.id}: ${result.processed} enviados, ${result.remaining} restantes, completada=${result.completed}`
        );
      }
    } catch (err: any) {
      console.error('[EmailCampaign Job] Error:', err.message);
    }
  });

  console.log('[EmailCampaign Job] Procesamiento de campañas de email iniciado (cada 5 minutos).');
}
