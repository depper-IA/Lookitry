/**
 * Servicio de Vertex AI para Try-On
 *
 * Motor principal: MobileSAM (máscara) + Nano Banana / Gemini 2.5 Flash Image (generación)
 * Fallback automático: n8n cuando Vertex falla
 *
 * Auth GCP: Bearer token via GOOGLE_API_KEY o ADC via GOOGLE_APPLICATION_CREDENTIALS
 * NO hardcoded credentials. Usa HTTP API directamente (más control que SDK).
 */

import axios from 'axios';
import crypto from 'crypto';
import { GoogleAuth } from 'google-auth-library';

// ============== CONFIGURACIÓN ==============

const VERTEX_PROJECT_ID = process.env.VERTEX_PROJECT_ID || '';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const SAM_LOCAL_URL = process.env.SAM_LOCAL_URL || '';
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

// ============== GENERACIÓN DE MÁSCARA (MobileSAM) ==============

/**
 * Genera máscara de segmentación con MobileSAM (servicio local en sam-service).
 *
 * @param selfieUrl URL de la selfie en MinIO
 * @returns URL de la máscara PNG con canal alfa en MinIO
 */
export async function generateMaskWithMobileSAM(selfieUrl: string): Promise<MaskGenerationResult> {
  const startTime = Date.now();

  console.log(`[VertexAI] Generando máscara con MobileSAM para: ${selfieUrl}`);

  if (!SAM_LOCAL_URL) {
    throw new VertexAIError(
      VertexAIErrorCode.ENDPOINT_NOT_CONFIGURED,
      'SAM_LOCAL_URL no configurado. El servicio MobileSAM local es requerido para generar la máscara.'
    );
  }

  const imageBuffer = await downloadImageFromURL(selfieUrl);
  const base64Image = imageBuffer.toString('base64');

  try {
    console.log(`[SAM-Local] Usando servicio MobileSAM local en: ${SAM_LOCAL_URL}`);

    const response = await axios.post(`${SAM_LOCAL_URL}/predict`, {
      image: base64Image,
    }, {
      timeout: 45000,
    });

    const data = response.data;
    const maskBase64 = data.predictions?.[0]?.maskBase64;

    if (!maskBase64) throw new Error('MobileSAM no devolvió máscara');

    const maskFilename = `mask_local_${Date.now()}.png`;
    const maskUrl = await saveImageToMinIO(Buffer.from(maskBase64, 'base64'), maskFilename, 'image/png');

    const processingTimeMs = Date.now() - startTime;
    console.log(`[SAM-Local] Máscara generada localmente: ${maskUrl} (${processingTimeMs}ms)`);
    return { maskUrl, processingTimeMs };
  } catch (error) {
    if (error instanceof VertexAIError) throw error;
    throw new VertexAIError(
      VertexAIErrorCode.GENERATION_FAILED,
      `Error generando máscara con MobileSAM: ${(error as Error).message}`,
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
  if (!SAM_LOCAL_URL) errors.push('SAM_LOCAL_URL no configurado');

  const valid = errors.length === 0;
  if (valid) {
    console.log('[VertexAI] Configuración validada correctamente');
  }

  return { valid, errors };
}

// ============== EXPORT ==============

export const vertexAIService = {
  generateMaskWithMobileSAM,
  generateWithNanoBanana,
  validateConfig: validateVertexAIConfig,
  VertexAIError,
  VertexAIErrorCode,
};

export default vertexAIService;