/**
 * RebeccaMessageRatingsService
 *
 * Gestiona ratings de mensajes de Rebecca para human-in-the-loop feedback.
 * Permite marcar respuestas como 👍👎 y reportar para revisión.
 */

import { supabaseAdmin } from '../config/supabase';

export interface RatingEntry {
  id?: string;
  session_id: string;
  brand_id?: string;
  message_index: number;
  message_content: string;
  rebecca_response?: string;
  rating: number; // 1-5
  rating_label: 'thumbs_up' | 'thumbs_down';
  lead_intent?: string;
  conversation_outcome?: 'converted' | 'abandoned' | 'pending';
  admin_reviewed?: boolean;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RatingStats {
  total: number;
  positive: number;
  negative: number;
  avg_rating: number;
  unreviewed: number;
  by_intent: Record<string, { count: number; avg_rating: number }>;
}

export class RebeccaMessageRatingsService {
  /**
   * Registra un rating de un mensaje de Rebecca.
   */
  async rateMessage(entry: Omit<RatingEntry, 'id' | 'created_at' | 'updated_at'>): Promise<RatingEntry | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rebecca_message_ratings')
        .insert({
          session_id: entry.session_id,
          brand_id: entry.brand_id || null,
          message_index: entry.message_index,
          message_content: entry.message_content,
          rebecca_response: entry.rebecca_response || null,
          rating: entry.rating,
          rating_label: entry.rating_label,
          lead_intent: entry.lead_intent || null,
          conversation_outcome: entry.conversation_outcome || 'pending',
          admin_reviewed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[RatingsService] Error inserting rating:', error);
        return null;
      }

      return data as RatingEntry;
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return null;
    }
  }

  /**
   * Obtiene ratings sin revisar (para admin dashboard).
   */
  async getUnreviewed(limit: number = 50): Promise<RatingEntry[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rebecca_message_ratings')
        .select('*')
        .eq('admin_reviewed', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[RatingsService] Error fetching unreviewed:', error);
        return [];
      }

      return (data || []) as RatingEntry[];
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return [];
    }
  }

  /**
   * Marca un rating como revisado con notas opcionales.
   */
  async markReviewed(id: string, adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('rebecca_message_ratings')
        .update({
          admin_reviewed: true,
          admin_notes: adminNotes || null,
        })
        .eq('id', id);

      if (error) {
        console.error('[RatingsService] Error marking reviewed:', error);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return false;
    }
  }

  /**
   * Actualiza el outcome de la conversación (para tracking de conversión).
   */
  async updateOutcome(sessionId: string, outcome: 'converted' | 'abandoned'): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('rebecca_message_ratings')
        .update({ conversation_outcome: outcome })
        .eq('session_id', sessionId);

      if (error) {
        console.error('[RatingsService] Error updating outcome:', error);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de ratings.
   */
  async getStats(since?: string): Promise<RatingStats> {
    try {
      let query = supabaseAdmin
        .from('rebecca_message_ratings')
        .select('rating, lead_intent, admin_reviewed, conversation_outcome');

      if (since) {
        query = query.gte('created_at', since);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[RatingsService] Error fetching stats:', error);
        return { total: 0, positive: 0, negative: 0, avg_rating: 0, unreviewed: 0, by_intent: {} };
      }

      const ratings = data || [];
      const total = ratings.length;
      const positive = ratings.filter(r => r.rating >= 4).length;
      const negative = ratings.filter(r => r.rating <= 2).length;
      const avg_rating = total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const unreviewed = ratings.filter(r => !r.admin_reviewed).length;

      // Group by intent
      const by_intent: Record<string, { count: number; total_rating: number }> = {};
      for (const r of ratings) {
        if (r.lead_intent) {
          if (!by_intent[r.lead_intent]) {
            by_intent[r.lead_intent] = { count: 0, total_rating: 0 };
          }
          by_intent[r.lead_intent].count++;
          by_intent[r.lead_intent].total_rating += r.rating;
        }
      }

      // Calculate avg per intent
      const by_intent_final: Record<string, { count: number; avg_rating: number }> = {};
      for (const [intent, vals] of Object.entries(by_intent)) {
        by_intent_final[intent] = {
          count: vals.count,
          avg_rating: vals.total_rating / vals.count,
        };
      }

      return { total, positive, negative, avg_rating, unreviewed, by_intent: by_intent_final };
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return { total: 0, positive: 0, negative: 0, avg_rating: 0, unreviewed: 0, by_intent: {} };
    }
  }

  /**
   * Obtiene conversaciones con ratings negativos (para revisión prioritaria).
   */
  async getNegativeConversations(limit: number = 20): Promise<RatingEntry[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rebecca_message_ratings')
        .select('*')
        .lte('rating', 2)
        .eq('admin_reviewed', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[RatingsService] Error fetching negatives:', error);
        return [];
      }

      return (data || []) as RatingEntry[];
    } catch (err: any) {
      console.error('[RatingsService] Unexpected error:', err.message);
      return [];
    }
  }
}

export const rebeccaMessageRatingsService = new RebeccaMessageRatingsService();