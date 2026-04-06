import { supabaseAdmin } from '../config/supabase';

export type GenerationLogStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreateGenerationLogDto {
  brand_id: string;
  product_id?: string;
  customer_id?: string;
  selfie_url?: string;
  result_url?: string;
  status: GenerationLogStatus;
  error_message?: string;
  model_used?: string;
  processing_time_ms?: number;
  retry_count?: number;
  original_generation_id?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateGenerationLogDto {
  status?: GenerationLogStatus;
  result_url?: string;
  error_message?: string;
  processing_time_ms?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Servicio para logging de generaciones en admin_generations_log
 * Se usa para tener un historial completo de Try-Ons accesible desde el admin
 */
class GenerationsLogService {
  /**
   * Crear un nuevo registro de log para una generación
   */
  async createLog(dto: CreateGenerationLogDto): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_generations_log')
        .insert({
          brand_id: dto.brand_id,
          product_id: dto.product_id || null,
          customer_id: dto.customer_id || null,
          selfie_url: dto.selfie_url || null,
          result_url: dto.result_url || null,
          status: dto.status,
          error_message: dto.error_message || null,
          model_used: dto.model_used || null,
          processing_time_ms: dto.processing_time_ms || null,
          retry_count: dto.retry_count || 0,
          original_generation_id: dto.original_generation_id || null,
          metadata: dto.metadata || {},
        })
        .select('id')
        .single();

      if (error || !data) {
        console.error('[GenerationsLog] createLog error:', error);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('[GenerationsLog] createLog exception:', err);
      return null;
    }
  }

  /**
   * Actualizar un registro de log existente
   */
  async updateLog(logId: string, dto: UpdateGenerationLogDto): Promise<boolean> {
    try {
      const updates: any = {};
      
      if (dto.status) {
        updates.status = dto.status;
        if (dto.status === 'completed' || dto.status === 'failed') {
          updates.finished_at = new Date().toISOString();
        }
      }
      if (dto.result_url !== undefined) {
        updates.result_url = dto.result_url;
      }
      if (dto.error_message !== undefined) {
        updates.error_message = dto.error_message;
      }
      if (dto.processing_time_ms !== undefined) {
        updates.processing_time_ms = dto.processing_time_ms;
      }
      if (dto.metadata) {
        updates.metadata = dto.metadata;
      }

      const { error } = await supabaseAdmin
        .from('admin_generations_log')
        .update(updates)
        .eq('id', logId);

      if (error) {
        console.error('[GenerationsLog] updateLog error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[GenerationsLog] updateLog exception:', err);
      return false;
    }
  }

  /**
   * Obtener log por generation_id original (de la tabla generations)
   */
  async getLogByGenerationId(generationId: string): Promise<any | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('admin_generations_log')
        .select('*')
        .eq('original_generation_id', generationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (err) {
      console.error('[GenerationsLog] getLogByGenerationId error:', err);
      return null;
    }
  }

  /**
   * Helper para crear log desde un job de queue (queue-worker.ts)
   */
  async logFromQueueJob(job: {
    generation_id: string;
    brand_id: string;
    product_id: string;
    selfie_url: string;
    product_image_url?: string;
    retry_count?: number;
    model_used?: string;
  }): Promise<string | null> {
    return this.createLog({
      brand_id: job.brand_id,
      product_id: job.product_id,
      selfie_url: job.selfie_url,
      status: 'processing',
      model_used: job.model_used || 'openrouter',
      retry_count: job.retry_count || 0,
      metadata: {
        original_generation_id: job.generation_id,
        product_image_url: job.product_image_url
      }
    });
  }

  /**
   * Helper para marcar como completado
   */
  async markCompleted(logId: string, resultUrl: string, processingTimeMs?: number): Promise<boolean> {
    return this.updateLog(logId, {
      status: 'completed',
      result_url: resultUrl,
      processing_time_ms: processingTimeMs
    });
  }

  /**
   * Helper para marcar como fallido
   */
  async markFailed(logId: string, errorMessage: string, processingTimeMs?: number): Promise<boolean> {
    return this.updateLog(logId, {
      status: 'failed',
      error_message: errorMessage,
      processing_time_ms: processingTimeMs
    });
  }
}

export const generationsLogService = new GenerationsLogService();
