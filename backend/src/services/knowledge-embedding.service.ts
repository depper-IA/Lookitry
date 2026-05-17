/**
 * KnowledgeEmbeddingService
 *
 * Genera y actualiza embeddings para los items del knowledge base de Rebecca.
 * Usa Gemini text-embedding-004 (768 dimensiones).
 *
 * Se llama de forma asíncrona (fire-and-forget) desde el controller de knowledge
 * para no bloquear la respuesta HTTP al admin.
 */

import { supabaseAdmin } from '../config/supabase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
const GEMINI_BASE    = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'text-embedding-004';

const TABLE = 'lookitry_knowledge';

export class KnowledgeEmbeddingService {
  /**
   * Genera el embedding para un item y lo guarda en Supabase.
   * Se ejecuta de forma asíncrona — no bloquea la respuesta al cliente.
   */
  async generateAndSave(itemId: string, title: string, content: string): Promise<void> {
    if (!GEMINI_API_KEY) {
      console.warn('[KnowledgeEmbedding] GEMINI_API_KEY no configurada — embedding omitido');
      return;
    }

    try {
      const embedding = await this._generateEmbedding(title, content);
      if (!embedding) return;

      const { error } = await supabaseAdmin
        .from(TABLE)
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', itemId);

      if (error) {
        console.error('[KnowledgeEmbedding] Error guardando embedding:', error.message);
      } else {
        console.log(`[KnowledgeEmbedding] Embedding guardado para item "${itemId}"`);
      }
    } catch (err: any) {
      console.error('[KnowledgeEmbedding] Error inesperado:', err.message);
    }
  }

  /**
   * Regenera embeddings para todos los items que no tienen embedding todavía.
   * Útil para backfill después de la migración.
   */
  async backfillMissing(): Promise<{ processed: number; failed: number }> {
    if (!GEMINI_API_KEY) {
      console.warn('[KnowledgeEmbedding] GEMINI_API_KEY no configurada — backfill omitido');
      return { processed: 0, failed: 0 };
    }

    const { data: items, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, title, content')
      .is('embedding', null);

    if (error || !items?.length) {
      console.log('[KnowledgeEmbedding] No hay items sin embedding');
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await this.generateAndSave(item.id, item.title, item.content);
        processed++;
        // Pequeña pausa para respetar el rate limit de Gemini (15 req/min)
        await new Promise(r => setTimeout(r, 200));
      } catch {
        failed++;
      }
    }

    console.log(`[KnowledgeEmbedding] Backfill completo: ${processed} OK, ${failed} fallidos`);
    return { processed, failed };
  }

  /**
   * Genera embedding usando Gemini text-embedding-004.
   * El texto combina título + contenido para mejor representación semántica.
   */
  private async _generateEmbedding(title: string, content: string): Promise<number[] | null> {
    // Combinar título y contenido — el título da contexto semántico al embedding
    const text = `${title}\n\n${content}`.slice(0, 2000); // Límite seguro de tokens

    try {
      const url = `${GEMINI_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT', // DOCUMENT para indexar, QUERY para buscar
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.warn(`[KnowledgeEmbedding] Gemini error ${res.status}:`, body.slice(0, 200));
        return null;
      }

      const json = await res.json() as { embedding?: { values?: number[] } };
      return json?.embedding?.values ?? null;
    } catch (err: any) {
      console.warn('[KnowledgeEmbedding] Error llamando a Gemini:', err.message);
      return null;
    }
  }
}

export const knowledgeEmbeddingService = new KnowledgeEmbeddingService();
