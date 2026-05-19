/**
 * KnowledgeEmbeddingService
 *
 * Genera y actualiza embeddings para los items del knowledge base de Rebecca.
 * Usa text-embedding-004 vía Vertex AI (768 dimensiones).
 */

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '../config/supabase';

const TABLE = 'lookitry_knowledge';

function getAI(): GoogleGenAI {
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769',
    location: 'us-central1',
  });
}

async function generateEmbedding(text: string, taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'): Promise<number[] | null> {
  try {
    const ai = getAI();
    const result = await (ai.models as any).embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
      taskType,
    });
    return result?.embeddings?.[0]?.values ?? result?.embedding?.values ?? null;
  } catch (err: any) {
    console.warn('[KnowledgeEmbedding] Error generando embedding:', err.message);
    return null;
  }
}

export class KnowledgeEmbeddingService {
  async generateAndSave(itemId: string, title: string, content: string): Promise<void> {
    try {
      const text = `${title}\n\n${content}`.slice(0, 2000);
      const embedding = await generateEmbedding(text);
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

  async backfillMissing(): Promise<{ processed: number; failed: number }> {
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
        await new Promise(r => setTimeout(r, 300));
      } catch {
        failed++;
      }
    }

    console.log(`[KnowledgeEmbedding] Backfill completo: ${processed} OK, ${failed} fallidos`);
    return { processed, failed };
  }
}

export const knowledgeEmbeddingService = new KnowledgeEmbeddingService();
