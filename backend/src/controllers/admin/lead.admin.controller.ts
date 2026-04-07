import { Request, Response } from 'express';
import { sanitizeError } from '../../utils/sanitizeError';
import { leadService } from '../../services/lead.service';
import { leadSearchService } from '../../services/lead-search.service';
import { leadGenerationService } from '../../services/lead-generation.service';
import { socialApiConfigService } from '../../services/social-api-config.service';

export const getLeads = async (req: any, res: Response) => {
  try {
    const { country, city, business_type, status, source, search_id, page = '1' } = req.query;
    const pageNum = parseInt(page as string) || 1;

    const filters: any = {};
    if (country) filters.country = country;
    if (city) filters.city = city;
    if (business_type) filters.business_type = business_type;
    if (status) filters.status = status;
    if (source) filters.source = source;
    if (search_id) filters.search_id = search_id;

    const { leads, total } = await leadService.getLeads(filters, pageNum);

    return res.json({ leads, total, page: pageNum });
  } catch (err: any) {
    console.error('[Leads] getLeads:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener leads') });
  }
};

export const getLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Lead no encontrado' });
    }

    const outreachLogs = await leadService.getOutreachLogs(id);

    return res.json({ lead, outreachLogs });
  } catch (err: any) {
    console.error('[Leads] getLead:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener lead') });
  }
};

export const createLead = async (req: any, res: Response) => {
  try {
    const lead = await leadService.createLead(req.body);
    return res.status(201).json({ lead });
  } catch (err: any) {
    console.error('[Leads] createLead:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear lead') });
  }
};

export const updateLead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await leadService.updateLead(id, req.body);
    return res.json({ lead });
  } catch (err: any) {
    console.error('[Leads] updateLead:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar lead') });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await leadService.deleteLead(id);
    return res.json({ message: 'Lead eliminado' });
  } catch (err: any) {
    console.error('[Leads] deleteLead:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar lead') });
  }
};

export const getLeadStats = async (_req: Request, res: Response) => {
  try {
    const stats = await leadService.getLeadStats();
    return res.json(stats);
  } catch (err: any) {
    console.error('[Leads] getLeadStats:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener estadísticas') });
  }
};

export const getLeadsByCity = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;
    const cityStats = await leadService.getLeadsByCity(country as string);
    return res.json(cityStats);
  } catch (err: any) {
    console.error('[Leads] getLeadsByCity:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener leads por ciudad') });
  }
};

export const getLeadFilterOptions = async (_req: Request, res: Response) => {
  try {
    const options = await leadService.getLeadFilterOptions();
    return res.json(options);
  } catch (err: any) {
    console.error('[Leads] getLeadFilterOptions:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener opciones de filtro') });
  }
};

export const addOutreachLog = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { outreach_type, details, notes } = req.body;

    if (!outreach_type) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tipo de outreach requerido' });
    }

    const log = await leadService.addOutreachLog(id, outreach_type, details || {}, notes, req.admin?.email);
    await leadService.updateLeadFromOutreach(id, outreach_type);

    return res.status(201).json({ log });
  } catch (err: any) {
    console.error('[Leads] addOutreachLog:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al agregar log') });
  }
};

export const getLeadSearches = async (_req: Request, res: Response) => {
  try {
    const searches = await leadSearchService.getSearches();
    const stats = await leadSearchService.getSearchStats();
    return res.json({ searches, stats });
  } catch (err: any) {
    console.error('[Leads] getLeadSearches:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener búsquedas') });
  }
};

export const createLeadSearch = async (req: any, res: Response) => {
  try {
    const { name, country, city, keywords, business_types, search_radius_km, max_results, schedule_enabled, schedule_cron } = req.body;

    if (!name || !country || !keywords?.length) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Nombre, país y keywords son requeridos' });
    }

    const search = await leadSearchService.createSearch({
      name,
      country,
      city,
      keywords,
      business_types,
      search_radius_km,
      max_results,
      schedule_enabled,
      schedule_cron,
      created_by: req.admin?.email || 'admin',
    });

    return res.status(201).json({ search });
  } catch (err: any) {
    console.error('[Leads] createLeadSearch:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear búsqueda') });
  }
};

export const runLeadSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const canRun = await leadGenerationService.canMakeRequest();
    if (!canRun) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED', message: 'Límite de cuota de Google Places alcanzado. Intenta mañana.' });
    }

    const result = await leadGenerationService.runSearch(id);
    return res.json({ message: 'Búsqueda completada', ...result });
  } catch (err: any) {
    console.error('[Leads] runLeadSearch:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al ejecutar búsqueda') });
  }
};

export const deleteLeadSearch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await leadSearchService.deleteSearch(id);
    return res.json({ message: 'Búsqueda eliminada' });
  } catch (err: any) {
    console.error('[Leads] deleteLeadSearch:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar búsqueda') });
  }
};

export const getGooglePlacesQuota = async (_req: Request, res: Response) => {
  try {
    const quota = await leadGenerationService.getQuotaStatus();
    return res.json(quota);
  } catch (err: any) {
    console.error('[Leads] getGooglePlacesQuota:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener cuota') });
  }
};

export const getSocialApiConfigs = async (_req: Request, res: Response) => {
  try {
    const configs = await socialApiConfigService.getConfigs();
    return res.json({ configs });
  } catch (err: any) {
    console.error('[Leads] getSocialApiConfigs:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener configuraciones') });
  }
};

export const upsertSocialApiConfig = async (req: any, res: Response) => {
  try {
    const { platform, config } = req.body;

    if (!platform || !config) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Platform y config son requeridos' });
    }

    const result = await socialApiConfigService.upsertConfig({
      platform,
      config,
      created_by: req.admin?.email || 'admin',
    });

    return res.json({ config: result });
  } catch (err: any) {
    console.error('[Leads] upsertSocialApiConfig:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al guardar configuración') });
  }
};

export const testSocialApiConfig = async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const result = await socialApiConfigService.testConnection(platform);
    return res.json(result);
  } catch (err: any) {
    console.error('[Leads] testSocialApiConfig:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al probar conexión') });
  }
};

export const deleteSocialApiConfig = async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    await socialApiConfigService.deleteConfig(platform);
    return res.json({ message: 'Configuración eliminada' });
  } catch (err: any) {
    console.error('[Leads] deleteSocialApiConfig:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar configuración') });
  }
};

export const setSocialApiActive = async (req: any, res: Response) => {
  try {
    const { platform } = req.params;
    const { active } = req.body;

    await socialApiConfigService.setActive(platform, active);
    return res.json({ message: active ? 'API activada' : 'API desactivada' });
  } catch (err: any) {
    console.error('[Leads] setSocialApiActive:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar estado') });
  }
};
