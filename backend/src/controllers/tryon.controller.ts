/**
 * Controlador de Try-On con circuito fallback: Vertex AI → n8n
 *
 * Estrategia:
 * 1. Si SAM_LOCAL_URL existe → generar máscara con SAM local (independiente de Vertex)
 * 2. Si VERTEX_AI_ENABLED=true → intentar Vertex AI (NanoBanana/Gemini) con máscara
 * 3. Si Vertex falla o está deshabilitado → fallback a n8n con máscara incluida
 * 4. Si ambos fallan → marcar generación como FAILED en Supabase
 *
 * El frontend NUNCA sabe qué motor generó la imagen — transparencia total.
 */

import { GenerationsService } from '../services/generations.service';
import { N8nClient } from '../services/n8n.client';
import { N8nWebhookPayload } from '../types';
import { UploadService } from '../services/upload.service';
import { supabaseAdmin } from '../config/supabase';
import { generationConsentsService } from '../services/generation-consents.service';
import {
  vertexAIService,
  VertexAIError,
  VertexAIErrorCode,
} from '../services/vertex-ai.service';

const generationsService = new GenerationsService();
const n8nClient = new N8nClient();
const uploadService = new UploadService();

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
  const samLocalUrl = process.env.SAM_LOCAL_URL;

  console.log(`[TryOnPipeline] Iniciando — generationId: ${generationId}, vertexEnabled: ${vertexEnabled}, samLocal: ${!!samLocalUrl}`);

  // Extraer paths para signed URLs (GCS ya no tiene `public: true`)
  const selfiePath = extractPathFromUrl(selfieUrl);
  const maskPath = payload.maskUrl ? extractPathFromUrl(payload.maskUrl) : null;

  // Generar signed URL para selfie (15 min) — usada por SAM local, Vertex y n8n
  // El objeto en GCS está privado; la signed URL da acceso temporal sin exponerlo públicamente
  const selfieSignedUrl = await uploadService.generateSelfieSignedUrl(selfiePath);
  console.log(`[TryOnPipeline] Signed URL para selfie: ${selfieSignedUrl.slice(0, 60)}...`);

  // T-3: Soft validation — verificar consentimiento biométrico antes de procesar
  // No bloquea el pipeline pero genera warning audit trail
  if (generationConsentsService) {
    const hasBiometric = await generationConsentsService.hasBiometricConsent(generationId).catch(() => false);
    if (!hasBiometric) {
      console.warn(`[TryOnPipeline] ⚠️ generation ${generationId}: Sin consentimiento BIOMETRIC registrado (Art. 10-C)`);
    } else {
      console.log(`[TryOnPipeline] Consentimiento BIOMETRIC verificado para ${generationId}`);
    }
  }

  // ========== PASO 0: Generar máscara con SAM local (si está configurado) ==========
  // Corre independientemente de VERTEX_AI_ENABLED — mejora n8n y Vertex por igual
  if (samLocalUrl) {
    try {
      console.log('[TryOnPipeline] Paso 0: Generando máscara con SAM local...');
      const maskResult = await vertexAIService.generateMaskWithMobileSAM(selfieSignedUrl);
      payload.maskUrl = maskResult.maskUrl;
      console.log(`[TryOnPipeline] Máscara SAM generada: ${maskResult.maskUrl} (${maskResult.processingTimeMs}ms)`);
    } catch (samError) {
      console.warn(`[TryOnPipeline] SAM local falló, continuando sin máscara: ${(samError as Error).message}`);
    }
  }

  // Actualizar maskPath si SAM local generó una nueva máscara
  const maskPathUpdated = payload.maskUrl ? extractPathFromUrl(payload.maskUrl) : maskPath;

  // Si Vertex AI está deshabilitado, ir directo a n8n (con máscara si SAM funcionó)
  if (!vertexEnabled) {
    console.log('[TryOnPipeline] VERTEX_AI_ENABLED=false — ejecutando n8n directamente');
    return executeN8nFallback(payload, undefined, selfiePath, maskPathUpdated);
  }

  // ========== PASO 1: Intentar Vertex AI ==========

  let maskUrl: string | null = payload.maskUrl ?? null;
  let resultImageUrl: string | null = null;

  try {
    // 1a. Si no se generó la máscara en el paso 0, generarla ahora con MobileSAM
    if (!maskUrl) {
      console.log('[TryOnPipeline] Paso 1: Generando máscara con MobileSAM...');
      const maskResult = await vertexAIService.generateMaskWithMobileSAM(selfieSignedUrl);
      maskUrl = maskResult.maskUrl;
      payload.maskUrl = maskUrl;
      console.log(`[TryOnPipeline] Máscara generada: ${maskUrl} (${maskResult.processingTimeMs}ms)`);
    } else {
      console.log(`[TryOnPipeline] Paso 1: Usando máscara SAM local ya generada: ${maskUrl}`);
    }

    // Actualizar maskPath después de generar máscara
    const finalMaskPath = maskUrl ? extractPathFromUrl(maskUrl) : null;

    // 1b. Generar Try-On con Nano Banana (Gemini)
    console.log('[TryOnPipeline] Paso 2: Generando Try-On con Nano Banana (Gemini)...');

    // Generar signed URL para máscara (5 min) — suficiente para el procesamiento
    const maskSignedUrl = finalMaskPath ? await uploadService.generateMaskSignedUrl(finalMaskPath) : null;
    console.log(`[TryOnPipeline] Signed URL para máscara: ${maskSignedUrl ? maskSignedUrl.slice(0, 60) + '...' : 'null'}`);

    const tryOnResult = await vertexAIService.generateWithNanoBanana(
      selfieSignedUrl,
      productImageUrl,
      prompt,
      maskSignedUrl
    );
    resultImageUrl = tryOnResult.resultImageUrl;

    // 1c. Éxito — actualizar Supabase
    if (!payload.skipDbUpdate) {
      await generationsService.updateGeneration(generationId, {
        status: 'SUCCESS',
        result_image_url: resultImageUrl,
        processing_time: Date.now() - startTime,
        prompt_used: prompt,
        engine_used: 'vertex',
      });
    }

    console.log(`[TryOnPipeline] ✓ Nano Banana éxito — ${resultImageUrl}`);

    // ── ELIMINACIÓN INLINE: Dato biométrico eliminado tras procesamiento exitoso ──
    // Cumplimiento Ley 1581 de 2012, Art. 10-C
    await cleanupBiometricData(generationId, payload.selfieUrl, payload.maskUrl || null);

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

    return executeN8nFallback(payload, error, selfiePath, maskPathUpdated);
  }
}

/**
 * Ejecuta n8n como fallback — mismo payload, resultado identical para el frontend
 */
async function executeN8nFallback(
  payload: TryOnPipelinePayload,
  vertexError?: unknown,
  selfiePath?: string,
  maskPath?: string | null
): Promise<TryOnPipelineResult> {
  const { generationId } = payload;
  const startTime = Date.now();

  // Log del error de Vertex para debugging (silent para frontend)
  if (vertexError instanceof VertexAIError) {
    console.warn(`[TryOnPipeline] Fallback a n8n — Vertex error: [${vertexError.code}] ${vertexError.message}`);
  }

  try {
    // Generar signed URLs temporales (15 min) para que n8n acceda a las imágenes
    // sin exponerlas públicamente. El objeto en GCS ya no tiene `public: true`.
    const selfieSignedUrl = selfiePath
      ? await uploadService.generateSelfieSignedUrl(selfiePath)
      : payload.selfieUrl; // Fallback si no tenemos el path
    const maskSignedUrl = maskPath
      ? await uploadService.generateMaskSignedUrl(maskPath)
      : payload.maskUrl;
    console.log(`[TryOnPipeline] Signed URLs para n8n — selfie: ${selfieSignedUrl.slice(0, 60)}...`);

    // Construir payload para n8n con signed URLs
    const n8nPayload: N8nWebhookPayload = {
      brand_id: payload.brandId,
      product_id: payload.productId,
      selfie_url: selfieSignedUrl, // Signed URL temporal (15 min)
      selfie_path: selfiePath,
      product_image_url: payload.productImageUrl,
      prompt: payload.prompt,
      mask_url: maskSignedUrl, // Signed URL temporal (5 min)
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
          engine_used: 'n8n',
        });
      }

      console.log(`[TryOnPipeline] ✓ n8n éxito — ${n8nResponse.imageUrl}`);

      // ── ELIMINACIÓN INLINE: Dato biométrico eliminado tras procesamiento exitoso ──
      await cleanupBiometricData(generationId, payload.selfieUrl, payload.maskUrl || null);

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


    // T-1.7: También en FAILED se elimina el dato biométrico (no solo en SUCCESS)
    // La anonimización y logging aplican igual; el selfie NO debe persistir tras un fallo
    await cleanupBiometricData(generationId, payload.selfieUrl, payload.maskUrl || null);

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

/**
 * Elimina datos biométricos (selfie) de MinIO y GCS.
 * También anonimiza el campo selfie_url en la base de datos.
 * Registra todo en biometric_cleanup_log para auditoría.
 *
 * Cumplimiento: Ley 1581 de 2012, Art. 10-C
 * "Los datos biométricos serán eliminados automáticamente tras la generación del resultado."
 */
async function cleanupBiometricData(
  generationId: string,
  selfieUrl: string,
  maskUrl: string | null
): Promise<void> {
  try {
    console.log(`[BiometricCleanup] Iniciando eliminación — generationId: ${generationId}`);

    // Extraer el path (la parte después del dominio/host en la URL)
    // Formato URL esperado: https://storage.lookitry.com/selfies/archivo.jpg
    // o: https://minio.wilkiedevs.com/lookitry/selfies/archivo.jpg
    const selfiePath = extractPathFromUrl(selfieUrl);
    const pathsToDelete: string[] = [selfiePath];

    // También eliminar la máscara SAM si existe (dato biométrico derivado)
    if (maskUrl) {
      const maskPath = extractPathFromUrl(maskUrl);
      if (maskPath && maskPath !== selfiePath) {
        pathsToDelete.push(maskPath);
      }
    }

    // Eliminar archivos de MinIO y GCS
    const results = await uploadService.deleteBiometricDataBatch(pathsToDelete);

    // Anonimizar selfie_url en la base de datos
    // Guardar un hash de referencia para auditoría sin exponer la URL real
    const anonymizedValue = `ANONYMIZED_${generationId}_${Date.now()}`;

    await generationsService.updateGeneration(generationId, {
      selfie_url_anonymized: anonymizedValue,
      selfie_url: `[ELIMINADO-${generationId.slice(0, 8)}]`, // Placeholder visible
      selfie_deleted_at: new Date().toISOString(),
    } as any);

    // Registrar en biometric_cleanup_log
    try {
      await supabaseAdmin.from('biometric_cleanup_log').insert({
        generation_id: generationId,
        selfie_path: selfiePath,
        minio_deleted: results[0]?.result.minio || false,
        gcs_deleted: results[0]?.result.gcs || false,
        selfie_url_anonymized: anonymizedValue,
        cleanup_error: results[0]?.result.error || null,
      });
    } catch (logErr) {
      // No fallar la eliminación si el log falla — el dato biométrico ya fue eliminado
      console.warn(`[BiometricCleanup] No se pudo registrar en biometric_cleanup_log: ${(logErr as Error).message}`);
    }

    console.log(`[BiometricCleanup] ✓ Completado — generationId: ${generationId}, minio: ${results[0]?.result.minio}, gcs: ${results[0]?.result.gcs}`);
  } catch (err) {
    // Error crítico: la selfie podría no haberse eliminado
    console.error(`[BiometricCleanup] ✗ ERROR CRÍTICO — generationId: ${generationId}: ${(err as Error).message}`);
    // Notificar al equipo para intervención manual
    // TODO: Integrar con sistema de alertas (Slack/email)
  }
}

/**
 * Extrae el path relativo de una URL de storage (MinIO o GCS).
 * Ejemplo: https://storage.lookitry.com/selfies/123456.jpg → selfies/123456.jpg
 */
function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Para URLs con path directo: /bucket/path o /path
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // Remover el nombre del bucket si está al inicio (formato MinIO: /bucket/path)
    // Asumimos que el primer segmento es el bucket
    if (pathParts.length >= 2) {
      return pathParts.slice(1).join('/');
    }
    return urlObj.pathname.replace(/^\//, '');
  } catch {
    // Si no es una URL válida, asumir que ya es un path
    return url;
  }
}

export default {
  executeTryOnPipeline,
  isVertexAIError,
  getVertexErrorCode,
};