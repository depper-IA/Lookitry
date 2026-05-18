import { CONFIG } from '../config.ts';
import type { KnowledgeItem } from '../types.ts';

// Generate embedding for query using Gemini Embedding API
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    console.warn('[RAG] GOOGLE_API_KEY not set, using dummy embedding');
    return new Array(768).fill(0);
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/embedding-001:embedText?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query
        })
      }
    );
    
    if (!response.ok) {
      console.warn('[RAG] Embedding API failed:', response.status);
      return new Array(768).fill(0);
    }
    
    const result = await response.json();
    return result.embedding || new Array(768).fill(0);
  } catch (err) {
    console.error('[RAG] Embedding error:', err);
    return new Array(768).fill(0);
  }
}

export const ragService = {
  async getKnowledgeContext(supabase: any, query: string): Promise<string> {
    try {
      // Generate query embedding using Gemini
      const queryEmbedding = await generateQueryEmbedding(query);
      
      const { data, error } = await supabase.rpc('search_lookitry_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: CONFIG.RAG_MATCH_THRESHOLD,
        match_count: CONFIG.RAG_TOP_K
      });
      
      if (error || !data || data.length === 0) return '';
      
      return data.map((item: KnowledgeItem) => item.content).join('\n\n');
    } catch (err) {
      console.error('[RAG] Error:', err);
      return ''; // Fallback to hardcoded pricing in prompt
    }
  }
};
