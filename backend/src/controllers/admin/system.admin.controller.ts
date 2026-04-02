import { Request, Response } from 'express';
import { systemService } from '../../services/system.service';

/**
 * GET /api/admin/system/stats
 * Obtener estadísticas de RAM y uptime del servidor
 */
export const getSystemStats = async (_req: Request, res: Response) => {
  try {
    const stats = await systemService.getStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('[system.admin.controller] getSystemStats error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas del sistema' });
  }
};

/**
 * GET /api/admin/openrouter-credits
 * Obtener información de créditos de OpenRouter
 */
export const getOpenRouterCredits = async (_req: Request, res: Response) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_TOKEN || process.env.OPENROUTER_API_KEY;
  const configuredLimit = OPENROUTER_API_KEY ? parseInt(process.env.OPENROUTER_LIMIT || '500000', 10) : null;
  const costPerGeneration = 0.0005;

  if (!OPENROUTER_API_KEY) {
    return res.status(200).json({
      provider: 'openrouter',
      status: 'not_configured',
      configured: false,
      label: 'OpenRouter',
      usage: null,
      limit: configuredLimit,
      balance: configuredLimit,
      usage_percent: null,
      estimated_generations_remaining: configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null,
      cost_per_generation: costPerGeneration,
      low_balance_alert: false,
      critical_balance_alert: false,
      can_top_up: true,
      settings_url: 'https://openrouter.ai/account',
      message: 'OPENROUTER_API_TOKEN no configurado.',
    });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/user', {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error('Error al conectar con OpenRouter');
    }

    const data = await response.json() as any;
    const usage = data.data?.total_usage ? Number(data.data.total_usage) / 100 : 0;
    const limit = configuredLimit || 500000;
    const balance = Math.max(0, limit - usage);
    const usagePercent = limit > 0 ? (usage / limit) * 100 : 0;
    const estimatedGenerationsRemaining = Math.floor(balance / costPerGeneration);
    const lowBalanceAlert = balance > 0 && balance < limit * 0.2;
    const criticalBalanceAlert = balance > 0 && balance < limit * 0.05;

    return res.status(200).json({
      provider: 'openrouter',
      status: 'ok',
      configured: true,
      label: 'OpenRouter',
      usage,
      limit,
      balance,
      usage_percent: usagePercent,
      estimated_generations_remaining: estimatedGenerationsRemaining,
      cost_per_generation: costPerGeneration,
      low_balance_alert: lowBalanceAlert,
      critical_balance_alert: criticalBalanceAlert,
      can_top_up: true,
      settings_url: 'https://openrouter.ai/account',
      message: balance < limit * 0.1 
        ? `Alerta: Solo quedan $${balance.toFixed(2)} USD (${estimatedGenerationsRemaining} generaciones estimadas)` 
        : 'CréditosOK',
    });
  } catch (error: any) {
    console.error('Error fetching OpenRouter credits:', error);
    return res.status(200).json({
      provider: 'openrouter',
      status: 'error',
      configured: true,
      label: 'OpenRouter',
      usage: null,
      limit: configuredLimit,
      balance: configuredLimit,
      usage_percent: null,
      estimated_generations_remaining: configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null,
      cost_per_generation: costPerGeneration,
      low_balance_alert: false,
      critical_balance_alert: false,
      can_top_up: true,
      settings_url: 'https://openrouter.ai/account',
      message: `Error al obtener créditos: ${error.message}`,
    });
  }
};

/**
 * GET /api/admin/replicate-credits
 * Obtener información de créditos de Replicate
 */
export const getReplicateCredits = async (_req: Request, res: Response) => {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  const configuredLimit = REPLICATE_API_TOKEN ? parseInt(process.env.REPLICATE_LIMIT || '500000', 10) : null;
  const costPerGeneration = 0.0025;

  if (!REPLICATE_API_TOKEN) {
    return res.status(200).json({
      provider: 'replicate',
      status: 'not_configured',
      configured: false,
      label: null,
      usage: null,
      limit: configuredLimit,
      balance: configuredLimit,
      usage_percent: null,
      estimated_generations_remaining: configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null,
      cost_per_generation: costPerGeneration,
      low_balance_alert: false,
      critical_balance_alert: false,
      can_top_up: true,
      settings_url: 'https://replicate.com/account/billing',
      message: 'REPLICATE_API_TOKEN no configurado.',
    });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/credits', {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error('Error al conectar con Replicate');
    }

    const data = await response.json() as any;
    const usage = data.current_usage_usd || 0;
    const limit = configuredLimit || 500000;
    const balance = Math.max(0, limit - usage);
    const usagePercent = limit > 0 ? (usage / limit) * 100 : 0;
    const estimatedGenerationsRemaining = Math.floor(balance / costPerGeneration);
    const lowBalanceAlert = balance > 0 && balance < limit * 0.2;
    const criticalBalanceAlert = balance > 0 && balance < limit * 0.05;

    return res.status(200).json({
      provider: 'replicate',
      status: 'ok',
      configured: true,
      label: 'Replicate',
      usage,
      limit,
      balance,
      usage_percent: usagePercent,
      estimated_generations_remaining: estimatedGenerationsRemaining,
      cost_per_generation: costPerGeneration,
      low_balance_alert: lowBalanceAlert,
      critical_balance_alert: criticalBalanceAlert,
      can_top_up: true,
      settings_url: 'https://replicate.com/account/billing',
      message: balance < limit * 0.1 
        ? `Alerta: Solo quedan $${balance.toFixed(2)} USD (${estimatedGenerationsRemaining} generaciones estimadas)` 
        : 'CréditosOK',
    });
  } catch (error: any) {
    console.error('Error fetching Replicate credits:', error);
    return res.status(200).json({
      provider: 'replicate',
      status: 'error',
      configured: true,
      label: 'Replicate',
      usage: null,
      limit: configuredLimit,
      balance: configuredLimit,
      usage_percent: null,
      estimated_generations_remaining: configuredLimit !== null ? Math.floor(configuredLimit / costPerGeneration) : null,
      cost_per_generation: costPerGeneration,
      low_balance_alert: false,
      critical_balance_alert: false,
      can_top_up: true,
      settings_url: 'https://replicate.com/account/billing',
      message: `Error al obtener créditos: ${error.message}`,
    });
  }
};