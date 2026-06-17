import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { sanitizeError } from '../../utils/sanitizeError';
import { N8nClient } from '../../services/n8n.client';
import { auditService } from '../../services/audit.service';

const n8nClient = new N8nClient();

/**
 * GET /api/admin/generations
 * Lista todas las generaciones con filtros y datos relacionados
 */
export const getGenerations = async (req: any, res: Response) => {
  try {
    const {
      brand_id,
      status,
      start_date,
      end_date,
      limit = '20',
      page = '1'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offsetNum = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact' });

    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }
    if (status) {
      // Mapear status externo (frontend) a interno (DB)
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'completed': 'SUCCESS',
        'failed': 'FAILED'
      };
      const dbStatus = statusMap[status as string] || status;
      query = query.eq('status', dbStatus);
    }
    if (start_date) {
      query = query.gte('generated_at', start_date);
    }
    if (end_date) {
      query = query.lte('generated_at', end_date);
    }

    const { data, error, count } = await query
      .order('generated_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error('[GenerationsAdmin] getGenerations:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener generaciones' });
    }

    // Obtener brands y products para mostrar nombres
    const brandIds = [...new Set((data || []).map((g: any) => g.brand_id).filter(Boolean))];
    const productIds = [...new Set((data || []).map((g: any) => g.product_id).filter(Boolean))];

    const [brandsResult, productsResult] = await Promise.all([
      brandIds.length > 0
        ? supabaseAdmin.from('brands').select('id, name, slug').in('id', brandIds)
        : { data: [], error: null },
      productIds.length > 0
        ? supabaseAdmin.from('products').select('id, name').in('id', productIds)
        : { data: [], error: null },
    ]);

    const brandsMap: Record<string, any> = {};
    (brandsResult.data || []).forEach((b: any) => { brandsMap[b.id] = b; });

    const productsMap: Record<string, any> = {};
    (productsResult.data || []).forEach((p: any) => { productsMap[p.id] = p; });

    // Mapear status interno a status externo (PENDINGâpending, SUCCESSâcompleted, FAILEDâfailed)
    const mapStatus = (s: string) => {
      if (s === 'PENDING') return 'pending';
      if (s === 'SUCCESS') return 'completed';
      if (s === 'FAILED') return 'failed';
      return s;
    };

    // Transformar datos con nombres relacionados
    const generations = (data || []).map((row: any) => ({
      id: row.id,
      brand_id: row.brand_id,
      brand_name: brandsMap[row.brand_id]?.name || null,
      brand_slug: brandsMap[row.brand_id]?.slug || null,
      product_id: row.product_id,
      product_name: productsMap[row.product_id]?.name || null,
      status: mapStatus(row.status),
      model_provider: row.prompt_used ? 'n8n-ai' : null,
      selfie_url: row.selfie_url,
      result_url: row.result_image_url,
      error_message: row.error_message,
      processing_time_ms: row.processing_time,
      metadata: null,
      created_at: row.generated_at,
    }));

    return res.json({
      generations,
      total: count || 0,
      has_more: (count || 0) > offsetNum + limitNum
    });
  } catch (err: any) {
    console.error('[GenerationsAdmin] getGenerations:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener generaciones') });
  }
};

/**
 * GET /api/admin/generations/:id
 * Detalle de una generación
 */
export const getGenerationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Generación no encontrada' });
    }

    return res.json({ data });
  } catch (err: any) {
    console.error('[GenerationsAdmin] getGenerationById:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener generación') });
  }
};

/**
 * PATCH /api/admin/generations/:id/retry
 * Reintentar una generación fallida
 */
export const retryGeneration = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const admin = req.admin;

    // 1. Obtener la generación original
    const { data: generation, error: fetchError } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !generation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Generación no encontrada' });
    }

    // 2. Validar que esté fallida
    if (generation.status !== 'FAILED') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Solo se pueden reintentar generaciones con estado FAILED'
      });
    }

    // 3. Obtener brand y product para el webhook
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, slug')
      .eq('id', generation.brand_id)
      .single();

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, image_url')
      .eq('id', generation.product_id)
      .single();

    if (!brand || !product) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Brand o product no encontrados' });
    }

    // 4. Disparar webhook de n8n para re-procesar
    if (n8nClient.isConfigured()) {
      try {
        await n8nClient.callTryOnWebhook({
          brand_id: generation.brand_id,
          product_id: generation.product_id,
          selfie_url: generation.selfie_url,
          product_image_url: product.image_url,
          prompt: generation.prompt_used || 'Try-on virtual'
        });
      } catch (n8nErr: any) {
        console.error('[GenerationsAdmin] n8n retry error:', n8nErr.message);
        return res.status(500).json({ error: 'N8N_ERROR', message: 'Error al disparar webhook de retry' });
      }
    } else {
      return res.status(500).json({ error: 'N8N_NOT_CONFIGURED', message: 'n8n no está configurado' });
    }

    // 5. Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'generation.retry' as any,
      target_brand_id: generation.brand_id,
      details: {
        generation_id: id,
        reason
      }
    });

    return res.json({
      success: true,
      generation_id: id,
      message: 'Retry iniciado correctamente'
    });
  } catch (err: any) {
    console.error('[GenerationsAdmin] retryGeneration:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al reintentar generación') });
  }
};

/**
 * GET /api/admin/brands/:brandId/generations
 * Generaciones de una marca específica
 */
export const getBrandGenerations = async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const {
      status,
      start_date,
      end_date,
      limit = '50',
      offset = '0'
    } = req.query;

    // Verificar que la brand existe
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id, name')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('brand_id', brandId);

    if (status) {
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'completed': 'SUCCESS',
        'failed': 'FAILED'
      };
      const dbStatus = statusMap[status as string] || status;
      query = query.eq('status', dbStatus);
    }
    if (start_date) {
      query = query.gte('generated_at', start_date);
    }
    if (end_date) {
      query = query.lte('generated_at', end_date);
    }

    const { data, error, count } = await query
      .order('generated_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error('[GenerationsAdmin] getBrandGenerations:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener generaciones' });
    }

    return res.json({
      data: data || [],
      total: count || 0,
      has_more: (count || 0) > offsetNum + limitNum,
      brand: {
        id: brand.id,
        name: brand.name
      }
    });
  } catch (err: any) {
    console.error('[GenerationsAdmin] getBrandGenerations:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener generaciones') });
  }
};

/**
 * GET /api/admin/generations/stats
 * Estadísticas de generaciones
 */
export const getGenerationsStats = async (req: any, res: Response) => {
  try {
    const { brand_id } = req.query;

    let query = supabaseAdmin
      .from('generations')
      .select('status, generated_at');

    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GenerationsAdmin] getGenerationsStats:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' });
    }

    // Map status to external format
    const mapStatus = (s: string) => {
      if (s === 'PENDING') return 'pending';
      if (s === 'SUCCESS') return 'completed';
      if (s === 'FAILED') return 'failed';
      return s;
    };

    const mappedData = (data || []).map((g: any) => ({
      ...g,
      status: mapStatus(g.status)
    }));

    const pending = mappedData.filter(g => g.status === 'pending').length;
    const processing = mappedData.filter(g => g.status === 'processing').length;
    const completed = mappedData.filter(g => g.status === 'completed').length;
    const failed = mappedData.filter(g => g.status === 'failed').length;

    // Calcular tiempo promedio de procesamiento (para completados)
    const completedWithTime = mappedData.filter(g =>
      g.status === 'completed' && g.generated_at && g.processing_time
    );

    let avgProcessingTimeMs = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((acc: number, g: any) => {
        return acc + (g.processing_time || 0);
      }, 0);
      avgProcessingTimeMs = Math.round(totalTime / completedWithTime.length);
    }

    return res.json({
      total: data.length,
      pending,
      processing,
      completed,
      failed,
      avg_processing_time_ms: avgProcessingTimeMs
    });
  } catch (err: any) {
    console.error('[GenerationsAdmin] getGenerationsStats:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener estadísticas') });
  }
};
