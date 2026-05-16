/**
 * Controlador de Try-On con circuito fallback: Vertex AI → n8n
 *
 * Estrategia:
 * 1. Si VERTEX_AI_ENABLED=true → intentar Vertex AI (SAM 2 + Imagen 3)
 * 2. Si Vertex falla (cualquier error) → fallback automático a n8n
 * 3. Si ambos fallan → marcar generación como FAILED en Supabase
 *
 * El frontend NUNCA sabe qué motor generó la imagen — transparencia total.
 */

import { GenerationsService } from '../services/generations.service';
import { N8nClient } from '../services/n8n.client';
import { N8nWebhookPayload } from '../types';
import {
  vertexAIService,
  VertexAIError,
  VertexAIErrorCode,
} from '../services/vertex-ai.service';

const generationsService = new GenerationsService();
const n8nClient = new N8nClient();

/**
 * Payload para iniciar pipeline de Try-On
 */
export interface TryOnPipelinePayload {
  generationId: string;
  brandId: string;
  productId: string;
  selfieUrl: string;
  productImageUrl: string;
  prompt: string;
  maskUrl?: string | null;
  skipDbUpdate?: boolean;
}

/**
 * Resultado del pipeline de Try-On
 */
export interface TryOnPipelineResult {
  success: boolean;
  resultImageUrl?: string;
  errorMessage?: string;
  engineUsed?: 'vertex' | 'n8n' | 'none';
}

/**
 * Ejecuta el pipeline completo de Try-On con fallback automático
 *
 * @param payload Datos de la generación
 * @returns Resultado con URL de imagen o error
 */
export async function executeTryOnPipeline(
  payload: TryOnPipelinePayload
): Promise<TryOnPipelineResult> {
  const {
    generationId,
    brandId,
    productId,
    selfieUrl,
    productImageUrl,
    prompt,
  } = payload;

  const startTime = Date.now();
  const vertexEnabled = process.env.VERTEX_AI_ENABLED === 'true';

  console.log(`[TryOnPipeline] Iniciando — generationId: ${generationId}, vertexEnabled: ${vertexEnabled}`);

  // Si Vertex AI está deshabilitado, ir directo a n8n
  if (!vertexEnabled) {
    console.log('[TryOnPipeline] VERTEX_AI_ENABLED=false — ejecutando n8n directamente');
    return executeN8nFallback(payload);
  }

  // ========== PASO 1: Intentar Vertex AI ==========

  let maskUrl: string | null = null;
  let resultImageUrl: string | null = null;

  try {
    // 1a. Generar máscara con SAM 2
    console.log('[TryOnPipeline] Paso 1: Generando máscara con SAM 2...');
    const maskResult = await vertexAIService.generateMaskWithSAM2(selfieUrl);
    maskUrl = maskResult.maskUrl;
    payload.maskUrl = maskUrl; // Guardamos para pasarlo a n8n si Gemini falla
    console.log(`[TryOnPipeline] Máscara generada: ${maskUrl} (${maskResult.processingTimeMs}ms)`);

    // 1b. Generar Try-On con Nano Banana (Gemini)
    console.log('[TryOnPipeline] Paso 2: Generando Try-On con Nano Banana (Gemini)...');
    const tryOnResult = await vertexAIService.generateWithNanoBanana(
      selfieUrl,
      productImageUrl,
      prompt,
      maskUrl
    );
    resultImageUrl = tryOnResult.resultImageUrl;

    // 1c. Éxito — actualizar Supabase
    if (!payload.skipDbUpdate) {
      await generationsService.updateGeneration(generationId, {
        status: 'SUCCESS',
        result_image_url: resultImageUrl,
        processing_time: Date.now() - startTime,
        prompt_used: prompt,
      });
    }

    console.log(`[TryOnPipeline] ✓ Nano Banana éxito — ${resultImageUrl}`);

    return {
      success: true,
      resultImageUrl,
      engineUsed: 'vertex',
    };

  } catch (error) {
    // ========== FALLBACK: Vertex falló → n8n ==========

    if (error instanceof VertexAIError) {
      console.warn(`[TryOnPipeline] Vertex AI falló [${error.code}]: ${error.message} — activando fallback n8n`);
    } else {
      console.error(`[TryOnPipeline] Vertex AI error inesperado: ${(error as Error).message} — activando fallback n8n`);
    }

    return executeN8nFallback(payload, error);
  }
}

/**
 * Ejecuta n8n como fallback — mismo payload, resultado identical para el frontend
 */
async function executeN8nFallback(
  payload: TryOnPipelinePayload,
  vertexError?: unknown
): Promise<TryOnPipelineResult> {
  const { generationId } = payload;
  const startTime = Date.now();

  // Log del error de Vertex para debugging (silent para frontend)
  if (vertexError instanceof VertexAIError) {
    console.warn(`[TryOnPipeline] Fallback a n8n — Vertex error: [${vertexError.code}] ${vertexError.message}`);
  }

  try {
    // Construir payload para n8n
    const n8nPayload: N8nWebhookPayload = {
      brand_id: payload.brandId,
      product_id: payload.productId,
      selfie_url: payload.selfieUrl,
      product_image_url: payload.productImageUrl,
      prompt: payload.prompt,
      mask_url: payload.maskUrl, // Incluimos la máscara si la tenemos
    };

    console.log(`[TryOnPipeline] Llamando n8n webhook...`);

    // Llamar a n8n con reintentos (n8n.client.ts maneja esto)
    const n8nResponse = await n8nClient.callTryOnWebhook(n8nPayload);

    if (n8nResponse.success && n8nResponse.imageUrl) {
      // Éxito con n8n — guardar resultado
      if (!payload.skipDbUpdate) {
        await generationsService.updateGeneration(generationId, {
          status: 'SUCCESS',
          result_image_url: n8nResponse.imageUrl,
          processing_time: Date.now() - startTime,
          prompt_used: payload.prompt,
        });
      }

      console.log(`[TryOnPipeline] ✓ n8n éxito — ${n8nResponse.imageUrl}`);

      return {
        success: true,
        resultImageUrl: n8nResponse.imageUrl,
        engineUsed: 'n8n',
      };
    } else {
      // n8n devolvió error
      throw new Error(n8nResponse.error || 'n8n devolvió respuesta sin imagen');
    }
  } catch (error) {
    // ========== AMBOS FALLARON ==========

    const errorMessage = (error as Error)?.message || 'Error desconocido';
    console.error(`[TryOnPipeline] ✗ Ambos fallaron — n8n error: ${errorMessage}`);

    // Marcar generación como FAILED en Supabase
    if (!payload.skipDbUpdate) {
      await generationsService.updateGeneration(generationId, {
        status: 'FAILED',
        error_message: errorMessage,
        processing_time: Date.now() - startTime,
      });
    }

    return {
      success: false,
      errorMessage,
      engineUsed: 'none',
    };
  }
}

/**
 * Verifica si un error es de Vertex AI (para logging interno)
 */
export function isVertexAIError(error: unknown): error is VertexAIError {
  return error instanceof VertexAIError;
}

/**
 * Obtiene código de error de Vertex o null si no es error de Vertex
 */
export function getVertexErrorCode(error: unknown): VertexAIErrorCode | null {
  if (error instanceof VertexAIError) {
    return error.code;
  }
  return null;
}

export default {
  executeTryOnPipeline,
  isVertexAIError,
  getVertexErrorCode,
};