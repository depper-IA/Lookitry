import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '../config/supabase';

const VERTEX_PROJECT = process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769';
const RAG_MATCH_THRESHOLD = 0.5;
const RAG_TOP_K = 5;

function getAI(): GoogleGenAI {
  return new GoogleGenAI({ vertexai: true, project: VERTEX_PROJECT, location: 'us-central1' });
}

/**
 * Get RAG context from lookitry_knowledge table
 */
export async function getRagContext(query: string): Promise<string> {
  try {
    // Generate query embedding
    const embedding = await generateEmbedding(query);
    if (!embedding) return '';

    // Search in Supabase
    const { data, error } = await supabaseAdmin.rpc('search_lookitry_knowledge', {
      query_embedding: embedding,
      match_threshold: RAG_MATCH_THRESHOLD,
      match_count: RAG_TOP_K
    });

    if (error || !data || data.length === 0) return '';

    return data.map((item: any) => item.content).join('\n\n');
  } catch (err) {
    console.error('[RAG] Error:', err);
    return '';
  }
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const ai = getAI();
    const result = await (ai.models as any).embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
      taskType: 'RETRIEVAL_QUERY',
    });
    return result?.embeddings?.[0]?.values ?? result?.embedding?.values ?? null;
  } catch (err) {
    console.error('[RAG] Embedding error:', err);
    return null;
  }
}