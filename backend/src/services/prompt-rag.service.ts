/**

 * Servicio RAG para enriquecimiento de prompts de generación.

 *

 * Flujo:

 * 1. Genera embedding del prompt base + categoría usando Gemini text-embedding-004 (gratuito)

 * 2. Busca feedbacks similares en Supabase pgvector

 * 3. Si hay feedbacks relevantes, llama a Gemini 2.0 flash para reescribir el prompt

 * 4. Retorna el prompt enriquecido (o el original si no hay feedbacks o hay timeout)

 *

 * Costo: $0 â usa únicamente APIs gratuitas de Google.

 */



import { FeedbackService, SimilarFeedback } from './feedback.service';
import { vertexService } from './vertex.service';


const feedbackService = new FeedbackService();


const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '';
const VERTEX_EMBEDDING_ENABLED = !!process.env.VERTEX_PROJECT_ID; // Use Vertex if configured
const EMBEDDING_MODEL = 'gemini-embedding-001';

const CHAT_MODEL = 'gemini-2.0-flash';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';



/** Timeout máximo para el RAG completo â no debe bloquear la generación */

const RAG_TIMEOUT_MS = 4000;



export class PromptRagService {

  /**

   * Enriquece un prompt base con reglas aprendidas de feedbacks anteriores.

   * Si no hay API key, feedbacks relevantes, o se supera el timeout, retorna el prompt original.

   */

  async enrichPrompt(

    basePrompt: string,

    productCategory?: string | null

  ): Promise<string> {

    if (!GEMINI_API_KEY) {

      console.warn('[PromptRAG] GEMINI_API_KEY no configurada â usando prompt base');

      return basePrompt;

    }



    try {

      const enriched = await Promise.race([

        this._doEnrich(basePrompt, productCategory),

        this._timeout(RAG_TIMEOUT_MS),

      ]);

      return enriched ?? basePrompt;

    } catch (err: any) {

      console.warn('[PromptRAG] Timeout o error en RAG â usando prompt base:', err.message);

      return basePrompt;

    }

  }



  private async _doEnrich(

    basePrompt: string,

    productCategory?: string | null

  ): Promise<string> {

    // 1. Construir texto para embedding

    const textToEmbed = [

      productCategory ? `Categoría: ${productCategory}.` : '',

      basePrompt.slice(0, 500), // Limitar para no exceder tokens

    ].filter(Boolean).join(' ');



    // 2. Generar embedding

    const embedding = await this._generateEmbedding(textToEmbed);

    if (!embedding) return basePrompt;



    // 3. Buscar feedbacks similares

    const similarFeedbacks = await feedbackService.searchSimilarFeedback(embedding, 0.3, 5);

    if (similarFeedbacks.length === 0) return basePrompt;



    // 4. Construir bloque de reglas aprendidas

    const learnedRules = this._buildLearnedRulesBlock(similarFeedbacks);



    // 5. Reescribir prompt con Gemini 2.0 flash

    const enrichedPrompt = await this._rewritePrompt(basePrompt, learnedRules, productCategory);

    return enrichedPrompt ?? basePrompt;

  }



  /**

   * Genera embedding usando Gemini gemini-embedding-001 (gratuito, 768 dimensiones).

   */

  private async _generateEmbedding(text: string): Promise<number[] | null> {

    try {

      const url = `${GEMINI_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

      const res = await fetch(url, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          model: `models/${EMBEDDING_MODEL}`,

          content: { parts: [{ text }] },

          taskType: 'RETRIEVAL_QUERY',

        }),

      });



      if (!res.ok) {

        console.warn('[PromptRAG] Error generando embedding:', res.status);

        return null;

      }



      const json = await res.json() as { embedding?: { values?: number[] } };

      return json?.embedding?.values ?? null;

    } catch {

      return null;

    }

  }



  /**

   * Construye el bloque de reglas aprendidas a partir de feedbacks similares.

   */

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

      const desc = f.description ? ` â "${f.description}"` : '';

      const cat = f.product_category ? ` [${f.product_category}]` : '';

      return `${i + 1}. Error previo${cat}: ${label}${desc}`;

    });



    return `[REGLAS APRENDIDAS DE ERRORES ANTERIORES]\n${rules.join('\n')}`;

  }



  /**

   * Reescribe el prompt usando Gemini 2.0 flash incorporando las reglas aprendidas.

   * Modelo gratuito â no genera costos.

   */

  private async _rewritePrompt(

    basePrompt: string,

    learnedRules: string,

    productCategory?: string | null

  ): Promise<string | null> {

    try {

      const url = `${GEMINI_BASE}/models/${CHAT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;



      const systemInstruction = `You are an expert at writing virtual try-on AI prompts. 

Your task is to improve a base prompt by incorporating lessons learned from previous generation errors.

Rules:

- Keep the improved prompt in English

- Do NOT change the product description or visual details

- Only add/strengthen instructions to AVOID the reported errors

- Keep the prompt concise â do not add unnecessary text

- Return ONLY the improved prompt, no explanations`;



      const userMessage = `BASE PROMPT:

${basePrompt}



${learnedRules}

${productCategory ? `\nProduct category: ${productCategory}` : ''}



Rewrite the base prompt incorporating specific instructions to avoid the reported errors above. Return only the improved prompt.`;



      const res = await fetch(url, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          system_instruction: { parts: [{ text: systemInstruction }] },

          contents: [{ role: 'user', parts: [{ text: userMessage }] }],

          generationConfig: {

            temperature: 0.2,

            maxOutputTokens: 1024,

          },

        }),

      });



      if (!res.ok) {

        console.warn('[PromptRAG] Error reescribiendo prompt:', res.status);

        return null;

      }



      const json = await res.json() as {

        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;

      };

      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      return text?.trim() ?? null;

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

