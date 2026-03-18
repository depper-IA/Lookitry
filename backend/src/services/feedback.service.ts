import { supabaseAdmin } from '../config/supabase';
import { createAdminNotification } from '../utils/adminNotifications';

export type GenerationErrorType =
  | 'wrong_clothing_removed'
  | 'wrong_clothing_kept'
  | 'body_distortion'
  | 'color_wrong'
  | 'product_not_applied'
  | 'background_changed'
  | 'other';

export interface CreateFeedbackDto {
  generation_id: string;
  brand_id: string;
  error_type: GenerationErrorType;
  description?: string;
  product_category?: string;
  prompt_used?: string;
}

export interface FeedbackRecord {
  id: string;
  generation_id: string;
  brand_id: string;
  error_type: GenerationErrorType;
  description: string | null;
  product_category: string | null;
  prompt_used: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface SimilarFeedback {
  id: string;
  error_type: GenerationErrorType;
  description: string | null;
  product_category: string | null;
  prompt_used: string | null;
  similarity: number;
}

export class FeedbackService {
  /**
   * Crea un registro de feedback para una generación fallida.
   * Dispara el webhook de n8n para generar el embedding de forma asíncrona.
   */
  async createFeedback(data: CreateFeedbackDto): Promise<FeedbackRecord> {
    const { data: record, error } = await supabaseAdmin
      .from('generation_feedback')
      .insert({
        generation_id: data.generation_id,
        brand_id: data.brand_id,
        error_type: data.error_type,
        description: data.description ?? null,
        product_category: data.product_category ?? null,
        prompt_used: data.prompt_used ?? null,
      })
      .select()
      .single();

    if (error || !record) {
      throw new Error('Error al guardar feedback: ' + error?.message);
    }

    // Disparar embedding de forma asíncrona (fire-and-forget)
    this.triggerEmbeddingAsync(record as FeedbackRecord).catch(() => {
      // No bloquear la respuesta si falla el embedding
    });

    // Verificar si se deben notificar errores frecuentes (task 51.9)
    this.checkAndNotifyFrequentErrors(record as FeedbackRecord).catch(() => {});

    return record as FeedbackRecord;
  }

  /**
   * Verifica si hay 3+ feedbacks del mismo tipo en las últimas 24h y notifica al admin.
   * Task 51.9
   */
  private async checkAndNotifyFrequentErrors(feedback: FeedbackRecord): Promise<void> {
    const THRESHOLD = 3;
    const count = await this.countRecentByType(
      feedback.error_type,
      feedback.product_category,
      24
    );

    if (count < THRESHOLD) return;

    // Evitar notificaciones duplicadas: verificar si ya existe una notificación
    // del mismo tipo en las últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('admin_notifications')
      .select('id')
      .eq('type', 'high_usage')
      .gte('created_at', twoHoursAgo)
      .ilike('message', `%${feedback.error_type}%${feedback.product_category ?? ''}%`)
      .limit(1);

    if (existing && existing.length > 0) return;

    const categoryLabel = feedback.product_category
      ? ` en categoría '${feedback.product_category}'`
      : '';

    await createAdminNotification({
      type: 'high_usage',
      title: 'Errores frecuentes detectados',
      message: `Alerta: ${count}+ errores de tipo '${feedback.error_type}'${categoryLabel} en las últimas 24h`,
      severity: 'warning',
      metadata: {
        error_type: feedback.error_type,
        product_category: feedback.product_category,
        count,
        triggered_by_feedback_id: feedback.id,
      },
    });
  }

  /**
   * Llama al webhook de n8n para generar el embedding del feedback.
   * Se ejecuta de forma asíncrona — no bloquea la respuesta al cliente.
   */
  private async triggerEmbeddingAsync(feedback: FeedbackRecord): Promise<void> {
    const n8nUrl = process.env.N8N_WEBHOOK_URL?.replace('/tryon', '/feedback-embedding');
    if (!n8nUrl) return;

    const bearerToken = process.env.N8N_BEARER_TOKEN;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    await fetch(n8nUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        feedback_id: feedback.id,
        error_type: feedback.error_type,
        description: feedback.description,
        product_category: feedback.product_category,
        prompt_used: feedback.prompt_used,
      }),
      signal: AbortSignal.timeout(5000),
    });
  }

  /**
   * Busca feedbacks similares usando pgvector similarity search.
   * Usado por el servicio RAG para enriquecer prompts.
   */
  async searchSimilarFeedback(
    queryEmbedding: number[],
    threshold = 0.3,
    limit = 5
  ): Promise<SimilarFeedback[]> {
    const { data, error } = await supabaseAdmin.rpc('search_similar_feedback', {
      query_embedding: queryEmbedding,
      similarity_threshold: threshold,
      max_results: limit,
    });

    if (error) {
      console.error('[FeedbackService] Error en similarity search:', error.message);
      return [];
    }

    return (data || []) as SimilarFeedback[];
  }

  /**
   * Obtiene feedbacks sin resolver para el panel admin.
   */
  async getUnresolvedFeedbacks(limit = 50): Promise<FeedbackRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('generation_feedback')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('Error al obtener feedbacks: ' + error.message);
    return (data || []) as FeedbackRecord[];
  }

  /**
   * Obtiene todos los feedbacks con filtros opcionales para el panel admin.
   * Incluye result_image_url de la generación relacionada.
   */
  async getFeedbacks(filters: {
    error_type?: GenerationErrorType;
    brand_id?: string;
    resolved?: boolean;
    limit?: number;
  } = {}): Promise<(FeedbackRecord & { result_image_url?: string | null })[]> {
    let query = supabaseAdmin
      .from('generation_feedback')
      .select('*, generations(result_image_url)')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 100);

    if (filters.error_type) query = query.eq('error_type', filters.error_type);
    if (filters.brand_id) query = query.eq('brand_id', filters.brand_id);
    if (filters.resolved !== undefined) query = query.eq('resolved', filters.resolved);

    const { data, error } = await query;
    if (error) throw new Error('Error al obtener feedbacks: ' + error.message);

    // Aplanar el join: generations es un objeto o null
    return (data || []).map((row: any) => ({
      ...row,
      result_image_url: row.generations?.result_image_url ?? null,
      generations: undefined,
    }));
  }

  /**
   * Marca un feedback como resuelto.
   */
  async resolveFeedback(feedbackId: string, resolvedBy: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('generation_feedback')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', feedbackId);

    if (error) throw new Error('Error al resolver feedback: ' + error.message);
  }

  /**
   * Cuenta feedbacks del mismo tipo en las últimas N horas.
   * Usado para detectar errores frecuentes y notificar al admin.
   */
  async countRecentByType(
    errorType: GenerationErrorType,
    productCategory: string | null,
    hoursBack = 24
  ): Promise<number> {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin
      .from('generation_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('error_type', errorType)
      .gte('created_at', since);

    if (productCategory) {
      query = query.eq('product_category', productCategory);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  }

  /**
   * Elimina un feedback del RAG (borra el registro completo).
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('generation_feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) throw new Error('Error al eliminar feedback: ' + error.message);
  }

  /**
   * Estadísticas agrupadas por tipo de error para el panel admin.
   */
  async getErrorStats(): Promise<{ error_type: string; product_category: string | null; count: number }[]> {
    const { data, error } = await supabaseAdmin
      .from('generation_feedback')
      .select('error_type, product_category')
      .eq('resolved', false);

    if (error || !data) return [];

    // Agrupar en memoria
    const groups: Record<string, number> = {};
    for (const row of data) {
      const key = `${row.error_type}||${row.product_category ?? ''}`;
      groups[key] = (groups[key] ?? 0) + 1;
    }

    return Object.entries(groups)
      .map(([key, count]) => {
        const [error_type, product_category] = key.split('||');
        return { error_type, product_category: product_category || null, count };
      })
      .sort((a, b) => b.count - a.count);
  }
}
