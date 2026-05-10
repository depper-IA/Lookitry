/**
 * Servicio de Vertex AI para Try-On
 *
 * Motor principal: SAM 2 (máscara) + Imagen 3 / Nano Banana 2 (generación)
 * Fallback automático: n8n cuando Vertex falla
 *
 * Auth GCP: Bearer token via GOOGLE_API_KEY o ADC via GOOGLE_APPLICATION_CREDENTIALS
 * NO hardcoded credentials. Usa HTTP API directamente (más control que SDK).
 */

import axios from 'axios';
import crypto from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import sharp from 'sharp';

// ============== CONFIGURACIÓN ==============

const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID || '';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const VERTEX_SAM2_ENDPOINT = process.env.VERTEX_SAM2_ENDPOINT || '';
const SAM_LOCAL_URL = process.env.SAM_LOCAL_URL || '';
const VERTEX_IMAGEN_MODEL = process.env.VERTEX_IMAGEN_MODEL || 'imagen-3.0-generate-002';
const VERTEX_TIMEOUT_MS = parseInt(process.env.VERTEX_TIMEOUT_MS || '25000', 10);
const VERTEX_API_KEY = process.env.GOOGLE_API_KEY || '';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'https://minio.wilkiedevs.com';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'lookitry';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'https://minio.wilkiedevs.com';

// ============== ERROR TYPES ==============

export enum VertexAIErrorCode {
  IMAGE_NOT_FOUND = 'IMAGE_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_PROMPT = 'INVALID_PROMPT',
  GENERATION_FAILED = 'GENERATION_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  ENDPOINT_NOT_CONFIGURED = 'ENDPOINT_NOT_CONFIGURED',
}

export class VertexAIError extends Error {
  readonly code: VertexAIErrorCode;
  readonly originalError?: unknown;

  constructor(code: VertexAIErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'VertexAIError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface MaskGenerationResult {
  maskUrl: string;
  processingTimeMs: number;
}

export interface TryOnGenerationResult {
  resultImageUrl: string;
  processingTimeMs: number;
}

// ============== UTILIDADES MINIO (AWS Signature V4) ==============

/**
 * Subir imagen a MinIO usando firma HMAC-SHA256 (mismo patrón que upload.service.ts)
 */
async function saveImageToMinIO(
  imageBuffer: Buffer,
  filename: string,
  mimeType: string = 'image/png'
): Promise<string> {
  if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
    // Sin credenciales — asumir que las imágenes generadas se guardan via n8n o GCS
    // El servicio solo necesita la URL de salida para metadata
    throw new VertexAIError(
      VertexAIErrorCode.ENDPOINT_NOT_CONFIGURED,
      'MINIO credentials no configuradas. No se puede guardar imagen.'
    );
  }

  const host = MINIO_ENDPOINT.replace(/^https?:\/\//, '');
  const url = `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${filename}`;
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const amzDate = now.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';
  const region = 'us-east-1';
  const payloadHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

  const canonicalHeaders =
    `content-type:${mimeType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    `/${MINIO_BUCKET}/${filename}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const kDate = crypto.createHmac('sha256', `AWS4${MINIO_SECRET_KEY}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
  const signingKey = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${MINIO_ACCESS_KEY}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  await axios.put(url, imageBuffer, {
    headers: {
      'Content-Type': mimeType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorization,
    },
    timeout: 15000,
  });

  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${filename}`;
}

/**
 * Descargar imagen desde URL pública o con auth
 */
async function downloadImageFromURL(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new VertexAIError(
          VertexAIErrorCode.IMAGE_NOT_FOUND,
          `Imagen no encontrada: ${imageUrl}`
        );
      }
      throw new VertexAIError(
        VertexAIErrorCode.GENERATION_FAILED,
        `Error al descargar imagen: HTTP ${response.status}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof VertexAIError) throw error;
    throw new VertexAIError(
      VertexAIErrorCode.IMAGE_NOT_FOUND,
      `No se pudo descargar imagen: ${(error as Error).message}`,
      error
    );
  }
}

// ============== AUTH VERTEX AI ==============

const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function getVertexAuthHeaders(): Promise<Record<string, string>> {
  try {
    const client = await googleAuth.getClient();
    const token = await client.getAccessToken();
    if (token.token) {
      return { 'Authorization': `Bearer ${token.token}` };
    }
  } catch (error) {
    console.warn('[VertexAI] No se pudo obtener token de GoogleAuth, intentando fallback con API KEY', (error as Error).message);
  }
  
  if (VERTEX_API_KEY) {
    return { 'Authorization': `Bearer ${VERTEX_API_KEY}` };
  }
  return {};
}

// ============== REQUEST CON TIMEOUT ==============

async function vertexAIRequest<T>(
  url: string,
  body: unknown,
  timeoutMs: number = VERTEX_TIMEOUT_MS
): Promise<T> {
  const authHeaders = await getVertexAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await axios.post<T>(url, body, {
      headers,
      signal: controller.signal,
      timeout: timeoutMs,
    });
    clearTimeout(timeoutId);
    return response.data;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new VertexAIError(
          VertexAIErrorCode.TIMEOUT,
          `Request a Vertex AI timeout después de ${timeoutMs}ms`
        );
      }

      const status = error.response?.status;
      if (status === 429) {
        throw new VertexAIError(
          VertexAIErrorCode.QUOTA_EXCEEDED,
          `Cuota de Vertex AI agotada: ${error.message}`
        );
      }

      if (status === 404) {
        throw new VertexAIError(
          VertexAIErrorCode.ENDPOINT_NOT_CONFIGURED,
          `Endpoint no encontrado: ${error.message}`
        );
      }

      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message;

      throw new VertexAIError(
        VertexAIErrorCode.GENERATION_FAILED,
        `Vertex AI API error: ${errorMessage}`,
        error
      );
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new VertexAIError(
        VertexAIErrorCode.TIMEOUT,
        `Request a Vertex AI timeout después de ${timeoutMs}ms`
      );
    }

    throw new VertexAIError(
      VertexAIErrorCode.GENERATION_FAILED,
      `Error inesperado en request a Vertex AI: ${(error as Error).message}`,
      error
    );
  }
}

// ============== GENERACIÓN DE MÁSCARA (SAM 2) ==============

/**
 * Genera máscara de segmentación usando SAM 2 en Vertex AI Endpoint
 *
 * @param selfieUrl URL de la selfie en MinIO
 * @returns URL de la máscara PNG con canal alfa en MinIO
 */
export async function generateMaskWithSAM2(selfieUrl: string): Promise<MaskGenerationResult> {
  const startTime = Date.now();

  console.log(`[VertexAI] Generando máscara SAM para: ${selfieUrl}`);

  const imageBuffer = await downloadImageFromURL(selfieUrl);
  const base64Image = imageBuffer.toString('base64');

  // Si hay URL local, usarla (Opción 2)
  if (SAM_LOCAL_URL) {
    try {
      console.log(`[SAM-Local] Usando servicio local en: ${SAM_LOCAL_URL}`);
      
      const response = await axios.post(`${SAM_LOCAL_URL}/predict`, {
        image: base64Image,
      }, {
        timeout: 45000,
      });

      const data = response.data;
      const maskBase64 = data.predictions?.[0]?.maskBase64;
      
      if (!maskBase64) throw new Error('SAM Local no devolvió máscara');

      const maskFilename = `mask_local_${Date.now()}.png`;
      const maskUrl = await saveImageToMinIO(Buffer.from(maskBase64, 'base64'), maskFilename, 'image/png');
      
      const processingTimeMs = Date.now() - startTime;
      console.log(`[SAM-Local] Máscara generada localmente: ${maskUrl} (${processingTimeMs}ms)`);
      return { maskUrl, processingTimeMs };
    } catch (localError: any) {
      const errorDetails = axios.isAxiosError(localError) ? (localError.response?.data || localError.message) : (localError.message || localError);
      console.error('[SAM-Local] Falló servicio local, intentando Vertex:', JSON.stringify(errorDetails));
    }
  }

  if (!VERTEX_SAM2_ENDPOINT) {
    throw new VertexAIError(
      VertexAIErrorCode.ENDPOINT_NOT_CONFIGURED,
      'VERTEX_SAM2_ENDPOINT no configurado. Despliega SAM 2 en un Vertex AI Endpoint.'
    );
  }

  const endpointUrl = `${VERTEX_SAM2_ENDPOINT}:predict`;

  try {
    const response = await vertexAIRequest<{ predictions: Array<{ maskBase64?: string; mask?: string }> }>(
      endpointUrl,
      {
        instances: [
          {
            image: base64Image,
          },
        ],
        parameters: {
          confidenceThreshold: 0.5,
          maskBase64: true,
        },
      }
    );

    const predictions = response.predictions || [];
    
    // Si la respuesta incluye 'masks' como array en lugar de maskBase64
    const anyPred = predictions[0] as any;
    let maskUrl = '';
    
    if (anyPred && anyPred.masks && Array.isArray(anyPred.masks)) {
      const masks = anyPred.masks;
      console.log(`[VertexAI] Procesando array booleano de máscaras: ${masks.length}x${masks[0].length}x${masks[0][0].length}`);
      
      // Tomamos la primera máscara (o la que tenga mayor área)
      const targetMask = masks[0]; // array 2D de booleans [height][width]
      const height = targetMask.length;
      const width = targetMask[0].length;
      
      // Crear un buffer de píxeles RGBA (4 bytes por píxel)
      const pixelBuffer = Buffer.alloc(width * height * 4);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const isMasked = targetMask[y][x];
          const idx = (y * width + x) * 4;
          if (isMasked) {
            // Blanco opaco para la máscara
            pixelBuffer[idx] = 255;     // R
            pixelBuffer[idx + 1] = 255; // G
            pixelBuffer[idx + 2] = 255; // B
            pixelBuffer[idx + 3] = 255; // Alpha
          } else {
            // Transparente para el fondo
            pixelBuffer[idx] = 0;
            pixelBuffer[idx + 1] = 0;
            pixelBuffer[idx + 2] = 0;
            pixelBuffer[idx + 3] = 0;
          }
        }
      }
      
      // Convertir el buffer raw a PNG usando sharp
      const maskPngBuffer = await sharp(pixelBuffer, {
        raw: {
          width: width,
          height: height,
          channels: 4
        }
      })
      .png()
      .toBuffer();
      
      const maskFilename = `mask_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
      maskUrl = await saveImageToMinIO(maskPngBuffer, maskFilename, 'image/png');
    } else {
      const maskBase64 = predictions[0]?.maskBase64 || predictions[0]?.mask;

      if (!maskBase64) {
        console.log('Respuesta cruda de SAM:', JSON.stringify(response, null, 2));
        throw new VertexAIError(
          VertexAIErrorCode.GENERATION_FAILED,
          'SAM 2 no devolvió máscara. Respuesta inesperada.'
        );
      }

      const maskFilename = `mask_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
      const maskBuffer = Buffer.from(maskBase64, 'base64');
      maskUrl = await saveImageToMinIO(maskBuffer, maskFilename, 'image/png');
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(`[VertexAI] Máscara generada: ${maskUrl} (${processingTimeMs}ms)`);

    return { maskUrl, processingTimeMs };
  } catch (error) {
    if (error instanceof VertexAIError) throw error;
    throw new VertexAIError(
      VertexAIErrorCode.GENERATION_FAILED,
      `Error en generateMaskWithSAM2: ${(error as Error).message}`,
      error
    );
  }
}

// ============== GENERACIÓN DE TRY-ON (IMAGEN 3) ==============

/**
 * Genera imagen de Try-On usando Imagen 3 en Vertex AI
 *
 * @param selfieUrl URL de la selfie en MinIO
 * @param maskUrl URL de la máscara de SAM 2 en MinIO
 * @param optimizedPrompt Prompt con instrucciones de iluminación y porosidad
 * @returns URL de la imagen generada en MinIO
 */
export async function generateTryOn(
  selfieUrl: string,
  maskUrl: string,
  optimizedPrompt: string
): Promise<TryOnGenerationResult> {
  const startTime = Date.now();

  if (!optimizedPrompt || optimizedPrompt.trim().length === 0) {
    throw new VertexAIError(
      VertexAIErrorCode.INVALID_PROMPT,
      'Prompt no puede estar vacío para generación de Try-On'
    );
  }

  console.log(`[VertexAI] Generando Try-On con Imagen 3`);

  const [selfieBuffer, maskBuffer] = await Promise.all([
    downloadImageFromURL(selfieUrl),
    downloadImageFromURL(maskUrl),
  ]);

  const base64Selfie = selfieBuffer.toString('base64');
  const base64Mask = maskBuffer.toString('base64');

  const enhancedPrompt = `${optimizedPrompt}

IMPORTANTE: Respeta estrictamente los bordes de la máscara de segmentación.
No modifiques el cuerpo de la persona. La prenda debe integrarse naturalmente
con la imagen original, respetando sombras, iluminación y profundidad.
Evita efectos de "calcomanía" (sticker overlay).`;

  const region = VERTEX_LOCATION || 'us-central1';
  const modelId = VERTEX_IMAGEN_MODEL || 'imagen-3.0-generate-002';
  const endpointUrl = `https://${region}-aiplatform.googleapis.com/v1beta2/projects/${VERTEX_PROJECT_ID}/locations/${region}/publishers/google/models/${modelId}:predict`;

  try {
    const response = await vertexAIRequest<{ predictions: Array<{ bytesBase64Encoded?: string }> }>(
      endpointUrl,
      {
        instances: [
          {
            prompt: enhancedPrompt,
            image: { bytesBase64Encoded: base64Selfie },
            mask: { bytesBase64Encoded: base64Mask },
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: { width: 1024, height: 1024 },
          safetySetting: 'block_some',
          personGeneration: 'allow_adult',
        },
      }
    );

    const predictions = response.predictions || [];
    const imageBase64 = predictions[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      throw new VertexAIError(
        VertexAIErrorCode.GENERATION_FAILED,
        'Imagen 3 no devolvió imagen. Respuesta inesperada.'
      );
    }

    const resultFilename = `tryon_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const resultBuffer = Buffer.from(imageBase64, 'base64');
    const resultImageUrl = await saveImageToMinIO(resultBuffer, resultFilename, 'image/png');

    const processingTimeMs = Date.now() - startTime;
    console.log(`[VertexAI] Try-On generado: ${resultImageUrl} (${processingTimeMs}ms)`);

    return { resultImageUrl, processingTimeMs };
  } catch (error) {
    if (error instanceof VertexAIError) throw error;
    throw new VertexAIError(
      VertexAIErrorCode.GENERATION_FAILED,
      `Error en generateTryOn: ${(error as Error).message}`,
      error
    );
  }
}

// ============== GENERACIÓN DE TRY-ON (NANO BANANA / GEMINI) ==============

/**
 * Genera imagen de Try-On usando Nano Banana (Gemini 2.5 Flash Image) en Vertex AI
 *
 * @param selfieUrl URL de la selfie en MinIO
 * @param productImageUrl URL del producto (prenda)
 * @param prompt Prompt descriptivo
 * @param maskUrl URL de la máscara de SAM (opcional)
 * @returns URL de la imagen generada en MinIO
 */
export async function generateWithNanoBanana(
  selfieUrl: string,
  productImageUrl: string,
  prompt: string,
  maskUrl?: string | null
): Promise<TryOnGenerationResult> {
  const startTime = Date.now();

  console.log(`[VertexAI] Generando Try-On con Nano Banana (Gemini)`);

  const [selfieBuffer, productBuffer] = await Promise.all([
    downloadImageFromURL(selfieUrl),
    downloadImageFromURL(productImageUrl),
  ]);

  const base64Selfie = selfieBuffer.toString('base64');
  const base64Product = productBuffer.toString('base64');

  const outputSpecs = `

IMPORTANT OUTPUT SPECS — FOLLOW WITHOUT EXCEPTION:
- Preserve the EXACT aspect ratio of the input selfie.
- Do NOT output square images unless the original selfie is square.
- Do NOT crop, pad, or add borders.
- Maximum 1024px on the longest side.
- Output format: JPEG compressed.
- The product must be proportional to the person's body — natural human proportions only.`;

  const projectId = VERTEX_PROJECT_ID || 'gen-lang-client-0591001769';
  const region = VERTEX_LOCATION || 'us-central1';
  const modelId = 'gemini-2.5-flash-image';
  const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}:generateContent`;

  try {
    const payload: any = {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt + outputSpecs },
          { inlineData: { mimeType: 'image/jpeg', data: base64Selfie } },
          { inlineData: { mimeType: 'image/jpeg', data: base64Product } }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192
      }
    };

    // Si tenemos máscara de SAM, la incluimos como una parte visual extra para guiar al modelo
    if (maskUrl) {
      try {
        const maskBuffer = await downloadImageFromURL(maskUrl);
        payload.contents[0].parts.push({
          inlineData: { mimeType: 'image/png', data: maskBuffer.toString('base64') }
        });
        payload.contents[0].parts[0].text += "\nGUIDE: Use the provided segmentation mask to identify the exact area where the garment should be placed.";
      } catch (e) {
        console.warn('[VertexAI] No se pudo descargar la máscara para Nano Banana, continuando sin ella.');
      }
    }

    const response = await vertexAIRequest<any>(url, payload);

    const candidates = response.candidates || [];
    let imageBase64 = null;
    let mimeType = 'image/jpeg';

    // Buscar la imagen en las partes de la respuesta (Gemini format)
    if (candidates[0] && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/jpeg';
          break;
        }
        // Fallback: algunos modelos devuelven el base64 en texto
        if (part.text && part.text.includes('base64,')) {
          const m = part.text.match(/base64,([A-Za-z0-9+\/=\s]+)/s);
          if (m) imageBase64 = m[1];
        }
      }
    }

    if (!imageBase64) {
      throw new VertexAIError(
        VertexAIErrorCode.GENERATION_FAILED,
        'Nano Banana no devolvió imagen. Respuesta inesperada.'
      );
    }

    const resultFilename = `tryon_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const resultBuffer = Buffer.from(imageBase64.replace(/\s+/g, ''), 'base64');
    const resultImageUrl = await saveImageToMinIO(resultBuffer, resultFilename, mimeType);

    const processingTimeMs = Date.now() - startTime;
    console.log(`[VertexAI] Try-On (Nano Banana) generado: ${resultImageUrl} (${processingTimeMs}ms)`);

    return { resultImageUrl, processingTimeMs };
  } catch (error) {
    if (error instanceof VertexAIError) throw error;
    throw new VertexAIError(
      VertexAIErrorCode.GENERATION_FAILED,
      `Error en generateWithNanoBanana: ${(error as Error).message}`,
      error
    );
  }
}

// ============== VALIDACIÓN ==============

export function validateVertexAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!VERTEX_PROJECT_ID) errors.push('VERTEX_PROJECT_ID no configurado');
  if (!VERTEX_LOCATION) errors.push('VERTEX_LOCATION no configurado');
  if (!VERTEX_SAM2_ENDPOINT) errors.push('VERTEX_SAM2_ENDPOINT no configurado');
  if (!VERTEX_IMAGEN_MODEL) errors.push('VERTEX_IMAGEN_MODEL no configurado');

  const valid = errors.length === 0;
  if (valid) {
    console.log('[VertexAI] Configuración validada correctamente');
  }

  return { valid, errors };
}

// ============== EXPORT ==============

export const vertexAIService = {
  generateMaskWithSAM2,
  generateTryOn,
  generateWithNanoBanana,
  validateConfig: validateVertexAIConfig,
  VertexAIError,
  VertexAIErrorCode,
};

export default vertexAIService;