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
      offset = '0',
      page = '1'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offsetNum = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('admin_generations_log')
      .select(`
        *,
        brands(id, name, slug),
        products(id, name)
      `, { count: 'exact' });

    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error('[GenerationsAdmin] getGenerations:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener generaciones' });
    }

    // Transformar datos con nombres relacionados
    const generations = (data || []).map((row: any) => ({
      id: row.id,
      brand_id: row.brand_id,
      brand_name: row.brands?.name || null,
      brand_slug: row.brands?.slug || null,
      product_id: row.product_id,
      product_name: row.products?.name || null,
      status: row.status,
      model_provider: row.model_used || null,
      selfie_url: row.selfie_url,
      result_url: row.result_url,
      error_message: row.error_message,
      processing_time_ms: row.processing_time_ms,
      metadata: row.metadata,
      created_at: row.created_at,
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
      .from('admin_generations_log')
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
      .from('admin_generations_log')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !generation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Generación no encontrada' });
    }

    // 2. Validar que esté fallida
    if (generation.status !== 'failed') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Solo se pueden reintentar generaciones con estado failed'
      });
    }

    // 3. Crear nueva entrada para el retry
    const { data: newGeneration, error: createError } = await supabaseAdmin
      .from('admin_generations_log')
      .insert({
        brand_id: generation.brand_id,
        product_id: generation.product_id,
        customer_id: generation.customer_id,
        selfie_url: generation.selfie_url,
        status: 'pending',
        model_used: generation.model_used,
        retry_count: (generation.retry_count || 0) + 1,
        original_generation_id: generation.original_generation_id || id,
        metadata: {
          ...(generation.metadata || {}),
          retry_reason: reason || null,
          retried_by: admin?.email || 'unknown'
        }
      })
      .select()
      .single();

    if (createError || !newGeneration) {
      console.error('[GenerationsAdmin] retryGeneration - create:', createError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear retry' });
    }

    // 4. Disparar webhook de n8n si tenemos la configuración
    if (n8nClient.isConfigured()) {
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

      if (brand && product) {
        try {
          await n8nClient.callTryOnWebhook({
            brand_id: generation.brand_id,
            product_id: generation.product_id,
            selfie_url: generation.selfie_url,
            product_image_url: product.image_url,
            prompt: (generation.metadata as any)?.prompt || 'Try-on virtual'
          });
        } catch (n8nErr: any) {
          console.error('[GenerationsAdmin] n8n retry error:', n8nErr.message);
          // No fallamos la request, el retry quedó registrado
        }
      }
    }

    // 5. Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'generation.retry' as any,
      target_brand_id: generation.brand_id,
      details: {
        original_generation_id: id,
        new_generation_id: newGeneration.id,
        reason
      }
    });

    return res.json({
      success: true,
      new_generation_id: newGeneration.id
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
      .from('admin_generations_log')
      .select('*', { count: 'exact' })
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
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
      .from('admin_generations_log')
      .select('status, created_at, completed_at');

    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GenerationsAdmin] getGenerationsStats:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' });
    }

    const pending = data.filter(g => g.status === 'pending').length;
    const processing = data.filter(g => g.status === 'processing').length;
    const completed = data.filter(g => g.status === 'completed').length;
    const failed = data.filter(g => g.status === 'failed').length;

    // Calcular tiempo promedio de procesamiento (para completados)
    const completedWithTime = data.filter(g => 
      g.status === 'completed' && g.created_at && g.completed_at
    );

    let avgProcessingTimeMs = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((acc, g) => {
        const start = new Date(g.created_at).getTime();
        const end = new Date(g.completed_at).getTime();
        return acc + (end - start);
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
