/**
 * Servicio RAG para enriquecimiento de prompts de generación.
 *
 * Flujo:
 * 1. Genera embedding del prompt base + categoría usando text-embedding-004 (Vertex AI)
 * 2. Busca feedbacks similares en Supabase pgvector
 * 3. Si hay feedbacks relevantes, llama a Gemini 2.0 flash vía vertexService para reescribir el prompt
 * 4. Retorna el prompt enriquecido (o el original si no hay feedbacks o hay timeout)
 */

import { GoogleGenAI } from '@google/genai';
import { FeedbackService, SimilarFeedback } from './feedback.service';
import { vertexService } from './vertex.service';

const feedbackService = new FeedbackService();

const VERTEX_PROJECT = process.env.VERTEX_PROJECT_ID || 'gen-lang-client-0591001769';
const RAG_TIMEOUT_MS = 4000;

function getAI(): GoogleGenAI {
  return new GoogleGenAI({ vertexai: true, project: VERTEX_PROJECT, location: 'us-central1' });
}

export class PromptRagService {
  async enrichPrompt(basePrompt: string, productCategory?: string | null): Promise<string> {
    try {
      const enriched = await Promise.race([
        this._doEnrich(basePrompt, productCategory),
        this._timeout(RAG_TIMEOUT_MS),
      ]);
      return enriched ?? basePrompt;
    } catch (err: any) {
      console.warn('[PromptRAG] Timeout o error en RAG — usando prompt base:', err.message);
      return basePrompt;
    }
  }

  private async _doEnrich(basePrompt: string, productCategory?: string | null): Promise<string> {
    const textToEmbed = [
      productCategory ? `Categoría: ${productCategory}.` : '',
      basePrompt.slice(0, 500),
    ].filter(Boolean).join(' ');

    const embedding = await this._generateEmbedding(textToEmbed);
    if (!embedding) return basePrompt;

    const similarFeedbacks = await feedbackService.searchSimilarFeedback(embedding, 0.3, 5);
    if (similarFeedbacks.length === 0) return basePrompt;

    const learnedRules = this._buildLearnedRulesBlock(similarFeedbacks);
    const enrichedPrompt = await this._rewritePrompt(basePrompt, learnedRules, productCategory);
    return enrichedPrompt ?? basePrompt;
  }

  private async _generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const ai = getAI();
      const result = await (ai.models as any).embedContent({
        model: 'text-embedding-004',
        contents: [{ parts: [{ text }] }],
        taskType: 'RETRIEVAL_QUERY',
      });
      return result?.embeddings?.[0]?.values ?? result?.embedding?.values ?? null;
    } catch {
      return null;
    }
  }

  private _buildLearnedRulesBlock(feedbacks: SimilarFeedback[]): string {
    const errorLabels: Record<string, string> = {
      wrong_clothing_removed: 'Se eliminó ropa que debía conservarse',
      wrong_clothing_kept: 'Se conservó ropa que debía eliminarse',
      body_distortion: 'Distorsión corporal',
      color_wrong: 'Color del producto incorrecto',
      product_not_applied: 'El producto no se aplicó',
      background_changed: 'El fondo cambió incorrectamente',
      other: 'Otro error',
    };

    const rules = feedbacks.map((f, i) => {
      const label = errorLabels[f.error_type] ?? f.error_type;
      const desc = f.description ? ` — "${f.description}"` : '';
      const cat = f.product_category ? ` [${f.product_category}]` : '';
      return `${i + 1}. Error previo${cat}: ${label}${desc}`;
    });

    return `[REGLAS APRENDIDAS DE ERRORES ANTERIORES]\n${rules.join('\n')}`;
  }

  private async _rewritePrompt(basePrompt: string, learnedRules: string, productCategory?: string | null): Promise<string | null> {
    try {
      const systemInstruction = `You are an expert at writing virtual try-on AI prompts.
Your task is to improve a base prompt by incorporating lessons learned from previous generation errors.
Rules:
- Keep the improved prompt in English
- Do NOT change the product description or visual details
- Only add/strengthen instructions to AVOID the reported errors
- Keep the prompt concise — do not add unnecessary text
- Return ONLY the improved prompt, no explanations`;

      const userMessage = `BASE PROMPT:\n${basePrompt}\n\n${learnedRules}${productCategory ? `\nProduct category: ${productCategory}` : ''}\n\nRewrite the base prompt incorporating specific instructions to avoid the reported errors above. Return only the improved prompt.`;

      const result = await vertexService.generateContent({
        model: 'gemini-2.0-flash',
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      });

      return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
    } catch {
      return null;
    }
  }

  private _timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`RAG timeout after ${ms}ms`)), ms)
    );
  }
}
