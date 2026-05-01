import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import axios from 'axios';
import crypto from 'crypto';


import crypto from 'crypto';



export interface UploadImageDto {

  image_base64: string;

  filename: string;

  temporary?: boolean;

  folder?: string;

  assetType?: UploadAssetType;

}



export interface UploadImageBufferDto {

  buffer: Buffer;

  filename: string;

  temporary?: boolean;

  folder?: string;

  assetType?: UploadAssetType;

}



export interface UploadResponse {

  success: boolean;

  url: string;

  path?: string;

}



export type UploadAssetType =

  | 'general'

  | 'blog-inline'

  | 'blog-social'

  | 'download-safe';



/**

 * Sube imágenes a MinIO usando la API S3-compatible con firma HMAC-SHA256.

 * MinIO está en minio.wilkiedevs.com, bucket "images", acceso público de lectura.

 */

export class UploadService {

  private readonly endpoint = process.env.MINIO_ENDPOINT;

  private readonly bucket = process.env.MINIO_BUCKET;

  private readonly accessKey = process.env.MINIO_ACCESS_KEY;

  private readonly secretKey = process.env.MINIO_SECRET_KEY;

  private readonly publicUrl = process.env.MINIO_PUBLIC_URL;

  private storage: Storage;
  private gcsBucketName = 'lookitry-vertex'; // Bucket público para Vertex AI

  constructor() {
    if (!this.endpoint || !this.bucket || !this.accessKey || !this.secretKey || !this.publicUrl) {
      throw new Error(
        'Variables de entorno de MinIO requeridas: MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_PUBLIC_URL'
      );
    }

    // Inicializar Google Cloud Storage
    this.storage = new Storage({
      keyFilename: 'gcs-credentials.json',
    });
  }

  }



  async uploadImage(data: UploadImageDto): Promise<UploadResponse> {

    const base64Data = data.image_base64.includes(',')

      ? data.image_base64.split(',')[1]

      : data.image_base64;

    const buffer = Buffer.from(base64Data, 'base64');

    return this.uploadImageBuffer({

      buffer,

      filename: data.filename,

      temporary: data.temporary,

      folder: data.folder,

      assetType: data.assetType,

    });

  }



  async uploadImageBuffer(data: UploadImageBufferDto): Promise<UploadResponse> {
    try {
      let { buffer, filename, temporary, folder, assetType } = data;

      // === VALIDACIÓN DE MAGIC BYTES CON SHARP ===
      // Verificar que el buffer es una imagen válida antes de procesarla
      // Esto previene uploads de archivos maliciosos con extensiones falsificadas
      try {
        const validatedImage = sharp(buffer);
        const metadata = await validatedImage.metadata();

        // Verificar que sharp puede identificar el formato de imagen
        if (!metadata.format) {
          throw new Error('No se pudo identificar el formato de imagen');
        }

        // Lista de formatos de imagen permitidos por sharp
        const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'tiff'];
        if (!allowedFormats.includes(metadata.format)) {
          throw new Error(`Formato de imagen no permitido: ${metadata.format}`);
        }

        console.log(`[Upload Service] Magic bytes validados: ${metadata.format}, ${buffer.length} bytes`);
      } catch (sharpError: any) {
        console.error('[Upload Service] Validación de imagen falló:', sharpError.message);
        throw new Error('El archivo no es una imagen válida o está corrupto');
      }

      // OPTIMIZACIÓN CON SHARP

      

      // OPTIMIZACIÑN CON SHARP

      // Si no es temporal, optimizamos para producción (blog/productos)

      if (!temporary) {

        try {

          const image = sharp(buffer);

          const metadata = await image.metadata();



          const targetAssetType = assetType || 'general';

          let pipeline = image.rotate(); // Auto-rotate basado en EXIF

          let targetExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';



          // Redimensionar si es muy grande (max 1400px de ancho)

          if (metadata.width && metadata.width > 1400) {

            pipeline = pipeline.resize(1400, null, { withoutEnlargement: true });

          }



          if (targetAssetType === 'blog-social' || targetAssetType === 'download-safe') {

            pipeline = pipeline.jpeg({ quality: 86, mozjpeg: true, progressive: true });

            targetExtension = 'jpg';

          } else {

            pipeline = pipeline.webp({ quality: 82, lossless: false, smartSubsample: true });

            targetExtension = 'webp';

          }



          buffer = await pipeline.toBuffer();

          const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || 'image';

          filename = `${nameWithoutExt}.${targetExtension}`;

        } catch (sharpError) {

          console.error('[Upload Service] Falló Sharp, subiendo original:', sharpError);

        }

      }



      const contentType = this.detectContentType(filename, buffer);

      const ext = this.getExtension(filename, contentType);

      const targetFolder = folder || (temporary ? 'temp' : 'products');

      const uniqueName = `${targetFolder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;



      // 1. Subir a MinIO como respaldo interno
      await this.putObject(uniqueName, buffer, contentType);
      console.log(`[Upload Service] Imagen subida a MinIO (respaldo): ${uniqueName}`);

      // 2. Subir a GCS para acceso público de Vertex AI
      const gcsUrl = await this.uploadToGCS(buffer, uniqueName, contentType);
      console.log(`[Upload Service] Imagen subida a GCS (público): ${gcsUrl}`);

      // 3. Retornar la URL pública de GCS
      return { success: true, url: gcsUrl, path: uniqueName };
    } catch (error: any) {
      console.error('[Upload Service] Error en el proceso de subida:', error.message);
      throw new Error(error.message || 'Error al subir imagen');
    }
  }

  /**
   * Sube un buffer a Google Cloud Storage y retorna su URL pública.
   */
  private async uploadToGCS(buffer: Buffer, destination: string, contentType: string): Promise<string> {
    const bucket = this.storage.bucket(this.gcsBucketName);
    const file = bucket.file(destination);

    try {
      await file.save(buffer, {
        public: true,
        contentType: contentType,
        // Opcional: metadata para debug
        metadata: {
          cacheControl: 'public, max-age=3600',
          metadata: {
            source: 'lookitry-backend',
            timestamp: new Date().toISOString(),
          }
        }
      });
      return file.publicUrl();
    } catch (error: any) {
      console.error(`[Upload Service] Error subiendo a GCS bucket "${this.gcsBucketName}":`, error);
      throw new Error(`Fallo al subir a Google Cloud Storage: ${error.message}`);
    }
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<void> {

    const host = this.endpoint!.replace(/^https?:\/\//, '');

    const url = `${this.endpoint!}/${this.bucket!}/${key}`;



    const now = new Date();

    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');

    const amzDate = now.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';

    const region = 'us-east-1';



    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');



    const canonicalHeaders =

      `content-type:${contentType}\n` +

      `host:${host}\n` +

      `x-amz-content-sha256:${payloadHash}\n` +

      `x-amz-date:${amzDate}\n`;



    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';



    const canonicalRequest = [

      'PUT',

      `/${this.bucket}/${key}`,

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



    const signingKey = this.getSigningKey(dateStamp, region);

    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');



    const authorization =

      `AWS4-HMAC-SHA256 Credential=${

this.accessKey}/${credentialScope}, ` +

      `SignedHeaders=${signedHeaders}, Signature=${signature}`;



    await axios.put(url, body, {

      headers: {

        'Content-Type': contentType,

        'x-amz-date': amzDate,

        'x-amz-content-sha256': payloadHash,

        Authorization: authorization,

      },

      maxBodyLength: 10 * 1024 * 1024,

      timeout: 30000,

    });

  }



  private getSigningKey(dateStamp: string, region: string): Buffer {

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretKey}`).update(dateStamp).digest();

    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();

    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();

    return crypto.createHmac('sha256', kService).update('aws4_request').digest();

  }



  private detectContentType(filename: string, buffer: Buffer): string {

    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';

    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';

    if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';

    if (buffer[0] === 0x52 && buffer[4] === 0x57) return 'image/webp';

    const ext = filename.split('.').pop()?.toLowerCase();

    const map: Record<string, string> = {

      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',

      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',

    };

    return map[ext || ''] || 'image/jpeg';

  }



private getExtension(filename: string, contentType: string): string {
    const fromFile = filename.includes('.') ? `.${filename.split('.').pop()?.toLowerCase()}` : '';
    if (fromFile) return fromFile;
    const map: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png',
      'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg',
    };
    return map[contentType] || '.jpg';
  }

  async cleanupTempFiles(paths: string[]): Promise<{ deleted: number; errors: number }> {

    let deleted = 0;

    let errors = 0;



    for (const path of paths) {

      try {

        await this.deleteObject(path);

        deleted++;

        console.log(`[Cleanup] Eliminado: ${path}`);

      } catch (error: any) {

        errors++;

        console.error(`[Cleanup] Error eliminando ${path}:`, error.message);

      }

    }



    return { deleted, errors };

  }



  private async deleteObject(key: string): Promise<void> {

    const host = this.endpoint!.replace(/^https?:\/\//, '');

    const url = `${this.endpoint!}/${this.bucket!}/${key}`;



    const now = new Date();

    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');

    const amzDate = now.toISOString().replace(/[:-]/g, '').slice(0, 15) + 'Z';

    const region = 'us-east-1';

    const payloadHash = 'UNSIGNED-PAYLOAD';



    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;

    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';



    const canonicalRequest = [

      'DELETE',

      `/${this.bucket!}/${key}`,

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



    const signingKey = this.getSigningKey(dateStamp, region);

    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');



    const authorization =

      `AWS4-HMAC-SHA256 Credential=${this.accessKey!}/${credentialScope}, ` +

      `SignedHeaders=${signedHeaders}, Signature=${signature}`;



    await axios.delete(url, {

      headers: {

        'x-amz-date': amzDate,

        'x-amz-content-sha256': payloadHash,

        Authorization: authorization,

      },

      timeout: 30000,

    });

  }

}

