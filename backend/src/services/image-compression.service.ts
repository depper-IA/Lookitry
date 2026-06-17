import sharp from 'sharp';
import axios from 'axios';
import https from 'https';
import crypto from 'crypto';
import { UploadService } from './upload.service';

/**
 * Downloads an image from a URL and compresses it using sharp.
 * @param url URL of the image (must be publicly accessible)
 * @param maxPx Maximum pixels on longest side (default: 1024)
 * @returns Buffer of the compressed image in JPEG quality 85
 */
export async function compressImageFromUrl(url: string, maxPx: number = 1024): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number }> {
  let finalUrl = url;
  try {
    const parsed = new URL(finalUrl);
    if (parsed.pathname.includes('/img-proxy')) {
      const originalUrl = parsed.searchParams.get('url');
      if (originalUrl) {
        finalUrl = originalUrl;
      }
    }
  } catch (err) {
    // URL parsing failed, keep using original url
  }

  console.log(`[ImageCompression] Descargando imagen para comprimir: ${finalUrl}`);

  const isInternalService = finalUrl.includes('wilkiedevs.com') || finalUrl.includes('minio.wilkiedevs.com');
  const httpsAgent = isInternalService ? new https.Agent({ rejectUnauthorized: false }) : undefined;

  const response = await axios.get(finalUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
    httpsAgent,
  });

  const originalBuffer = Buffer.from(response.data);
  const originalSize = originalBuffer.length;

  console.log(`[ImageCompression] Imagen descargada: ${originalSize} bytes, procesando con sharp...`);

  const compressedBuffer = await sharp(originalBuffer)
    .resize(maxPx, maxPx, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  const compressedSize = compressedBuffer.length;

  console.log(`[ImageCompression] Compresión completa: ${originalSize} bytes → ${compressedSize} bytes (${Math.round((1 - compressedSize / originalSize) * 100)}% reducción)`);

  return { buffer: compressedBuffer, originalSize, compressedSize };
}

/**
 * Sube una imagen comprimida a MinIO en la carpeta temp/ y retorna la URL pública.
 * @param buffer Buffer de la imagen comprimida
 * @param originalUrl URL original para derivar el nombre
 * @returns URL pública del archivo subido
 */
export async function uploadCompressedToMinio(buffer: Buffer, _originalUrl: string): Promise<string> {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const filename = `temp/compressed-${timestamp}-${random}.jpg`;

  // Upload using the existing UploadService
  const uploadService = new UploadService();
  const result = await uploadService.uploadImageBuffer({
    buffer,
    filename,
    temporary: true,
  });

  console.log(`[ImageCompression] Imagen comprimida subida a: ${result.url}`);
  return result.url;
}

/**
 * Comprime y sube una imagen, retornando la URL de la versión comprimida.
 * Si la compresión falla, retorna la URL original.
 * @param url URL original de la imagen
 * @param maxPx Máximo de píxeles (default: 1024)
 * @returns URL de la imagen comprimida (o original si falló)
 */
export async function compressAndUpload(url: string, maxPx: number = 1024): Promise<{ compressedUrl: string; originalUrl: string; success: boolean; sizeBefore?: number; sizeAfter?: number }> {
  let unproxiedUrl = url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes('/img-proxy')) {
      const origUrl = parsed.searchParams.get('url');
      if (origUrl) unproxiedUrl = origUrl;
    }
  } catch (err) {
    // Keep unproxiedUrl as is
  }

  try {
    const { buffer, originalSize, compressedSize } = await compressImageFromUrl(unproxiedUrl, maxPx);
    const compressedUrl = await uploadCompressedToMinio(buffer, unproxiedUrl);
    return {
      compressedUrl,
      originalUrl: unproxiedUrl,
      success: true,
      sizeBefore: originalSize,
      sizeAfter: compressedSize,
    };
  } catch (error: any) {
    console.error(`[ImageCompression] Error comprimiendo imagen ${unproxiedUrl}:`, error.message);
    return {
      compressedUrl: unproxiedUrl,
      originalUrl: unproxiedUrl,
      success: false,
    };
  }
}

/**
 * Comprime ambas imágenes (selfie y producto) en paralelo y retorna las URLs comprimidas.
 * Si alguna compresión falla, usa la URL original como fallback.
 */
export async function compressImagesForN8N(
  selfieUrl: string,
  productImageUrl: string,
  maxPx: number = 1024
): Promise<{ selfie_url: string; product_image_url: string; compressionStats: CompressionStats }> {
  console.log('[ImageCompression] Iniciando compresión de imágenes para n8n...');
  console.log(`[ImageCompression] Selfie: ${selfieUrl}`);
  console.log(`[ImageCompression] Producto: ${productImageUrl}`);

  const results = await Promise.allSettled([
    compressAndUpload(selfieUrl, maxPx),
    compressAndUpload(productImageUrl, maxPx),
  ]);

  const selfieResult = results[0].status === 'fulfilled' ? results[0].value : { compressedUrl: selfieUrl, success: false };
  const productResult = results[1].status === 'fulfilled' ? results[1].value : { compressedUrl: productImageUrl, success: false };

  const compressionStats: CompressionStats = {
    selfie: {
      success: selfieResult.success,
      originalSize: (selfieResult as any).sizeBefore,
      compressedSize: (selfieResult as any).sizeAfter,
    },
    product: {
      success: productResult.success,
      originalSize: (productResult as any).sizeBefore,
      compressedSize: (productResult as any).sizeAfter,
    },
  };

  if (selfieResult.success) {
    console.log(`[ImageCompression] Selfie comprimida: ${compressionStats.selfie.originalSize} → ${compressionStats.selfie.compressedSize} bytes`);
  } else {
    console.warn(`[ImageCompression] Selfie no se pudo comprimir, usando original`);
  }

  if (productResult.success) {
    console.log(`[ImageCompression] Producto comprimido: ${compressionStats.product.originalSize} → ${compressionStats.product.compressedSize} bytes`);
  } else {
    console.warn(`[ImageCompression] Producto no se pudo comprimir, usando original`);
  }

  return {
    selfie_url: selfieResult.compressedUrl,
    product_image_url: productResult.compressedUrl,
    compressionStats,
  };
}

export interface CompressionStats {
  selfie: {
    success: boolean;
    originalSize?: number;
    compressedSize?: number;
  };
  product: {
    success: boolean;
    originalSize?: number;
    compressedSize?: number;
  };
}