import { Request, Response } from 'express';
import { sanitizeError } from '../../utils/sanitizeError';
import { emailCampaignService } from '../../services/email-campaign.service';
import { brevoCampaignService } from '../../services/brevo-campaign.service';

export const getEmailCampaigns = async (_req: Request, res: Response) => {
  try {
    const campaigns = await emailCampaignService.getCampaigns();
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (c) => ({
        ...c,
        stats: await emailCampaignService.getCampaignStats(c.id),
      }))
    );
    const remainingQuota = await emailCampaignService.getRemainingDailyQuota();
    return res.json({ campaigns: campaignsWithStats, remainingDailyQuota: remainingQuota });
  } catch (err: any) {
    console.error('[EmailCampaign] getEmailCampaigns:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener campañas') });
  }
};

export const getEmailCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await emailCampaignService.getCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Campaña no encontrada' });
    }
    const stats = await emailCampaignService.getCampaignStats(id);
    return res.json({ campaign: { ...campaign, stats } });
  } catch (err: any) {
    console.error('[EmailCampaign] getEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener campaña') });
  }
};

export const createEmailCampaign = async (req: any, res: Response) => {
  try {
    const { name, subject, htmlTemplate, filterType, filterPlan, filterCreatedAfter } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre es requerido' });
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El asunto es requerido' });
    }
    if (!htmlTemplate || typeof htmlTemplate !== 'string' || htmlTemplate.trim().length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El template HTML es requerido' });
    }

    const campaign = await emailCampaignService.createCampaign({
      name: name.trim(),
      subject: subject.trim(),
      htmlTemplate: htmlTemplate.trim(),
      filterType: filterType || 'all',
      filterPlan,
      filterCreatedAfter,
      createdBy: req.admin?.email || 'admin',
    });

    return res.status(201).json({ message: 'Campaña creada', campaign });
  } catch (err: any) {
    console.error('[EmailCampaign] createEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear campaña') });
  }
};

export const previewEmailCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const previews = await emailCampaignService.previewCampaign(id, 3);
    return res.json({ previews });
  } catch (err: any) {
    console.error('[EmailCampaign] previewEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al previsualizar') });
  }
};

export const launchEmailCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const canSend = await emailCampaignService.canSendMore();
    if (!canSend) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: `Límite diario de ${300} emails alcanzado. Intenta mañana.`,
      });
    }
    const result = await emailCampaignService.launchCampaignNow(id);
    return res.json({ message: 'Campaña iniciada', ...result });
  } catch (err: any) {
    console.error('[EmailCampaign] launchEmailCampaign:', err);
    if (err.message.includes('Solo campañas en draft')) {
      return res.status(400).json({ error: 'INVALID_STATE', message: err.message });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al iniciar campaña') });
  }
};

export const scheduleEmailCampaign = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'La fecha de programación es requerida' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Fecha de programación inválida o pasada' });
    }

    await emailCampaignService.scheduleCampaign(id, scheduledAt);
    return res.json({ message: 'Campaña programada', scheduledAt });
  } catch (err: any) {
    console.error('[EmailCampaign] scheduleEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al programar campaña') });
  }
};

export const cancelEmailCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await emailCampaignService.cancelCampaign(id);
    return res.json({ message: 'Campaña cancelada' });
  } catch (err: any) {
    console.error('[EmailCampaign] cancelEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al cancelar campaña') });
  }
};

export const deleteEmailCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await emailCampaignService.deleteCampaign(id);
    return res.json({ message: 'Campaña eliminada' });
  } catch (err: any) {
    console.error('[EmailCampaign] deleteEmailCampaign:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar campaña') });
  }
};

export const getEmailCampaignQuota = async (_req: Request, res: Response) => {
  try {
    const remaining = await emailCampaignService.getRemainingDailyQuota();
    return res.json({ dailyLimit: 300, remaining, resetHour: 0 });
  } catch (err: any) {
    console.error('[EmailCampaign] getEmailCampaignQuota:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener cuota') });
  }
};

export const verifyBrevoConnection = async (_req: Request, res: Response) => {
  try {
    const isConnected = await brevoCampaignService.verifyConnection();
    return res.json({ connected: isConnected });
  } catch (err: any) {
    console.error('[EmailCampaign] verifyBrevoConnection:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al verificar conexión') });
  }
};
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email de prueba inválido' });
    }

    const result = await emailCampaignService.sendTestEmail(id, email.trim());
    return res.status(200).json({ message: 'Email de prueba enviado', messageId: result.messageId });
  } catch (err: any) {
    console.error('[EmailCampaign] sendTestEmail:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al enviar email de prueba') });
  }
};

export const sendAdHocTestEmail = async (req: Request, res: Response) => {
  try {
    const { subject, htmlTemplate, email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email de prueba inválido' });
    }
    if (!subject) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Asunto de prueba inválido' });
    }
    if (!htmlTemplate) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Template HTML de prueba inválido' });
    }

    const result = await emailCampaignService.sendAdHocTest(subject.trim(), htmlTemplate.trim(), email.trim());
    return res.status(200).json({ message: 'Email de prueba enviado', messageId: result.messageId });
  } catch (err: any) {
    console.error('[EmailCampaign] sendAdHocTestEmail:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al enviar email de prueba') });
  }
};
