import sharp from 'sharp';
import axios from 'axios';
import crypto from 'crypto';

export interface UploadImageDto {
  image_base64: string;
  filename: string;
  temporary?: boolean;
  folder?: string;
}

export interface UploadImageBufferDto {
  buffer: Buffer;
  filename: string;
  temporary?: boolean;
  folder?: string;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  path?: string;
}

/**
 * Sube imágenes a MinIO usando la API S3-compatible con firma HMAC-SHA256.
 * MinIO está en minio.wilkiedevs.com, bucket "images", acceso público de lectura.
 */
export class UploadService {
  private readonly endpoint = process.env.MINIO_ENDPOINT || 'https://minio.wilkiedevs.com';
  private readonly bucket = process.env.MINIO_BUCKET || 'images';
  private readonly accessKey = process.env.MINIO_ACCESS_KEY || 'Wilkiedevs';
  private readonly secretKey = process.env.MINIO_SECRET_KEY || 'Travis2305*';
  private readonly publicUrl = process.env.MINIO_PUBLIC_URL || 'https://minio.wilkiedevs.com';

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
    });
  }

  async uploadImageBuffer(data: UploadImageBufferDto): Promise<UploadResponse> {
    try {
      let { buffer, filename, temporary, folder } = data;
      
      // OPTIMIZACIÓN CON SHARP
      // Si no es temporal, optimizamos para producción (blog/productos)
      if (!temporary) {
        try {
          const image = sharp(buffer);
          const metadata = await image.metadata();
          
          let pipeline = image
            .webp({ quality: 82, lossless: false, smartSubsample: true })
            .rotate(); // Auto-rotate basado en EXIF

          // Redimensionar si es muy grande (max 1400px de ancho)
          if (metadata.width && metadata.width > 1400) {
            pipeline = pipeline.resize(1400, null, { withoutEnlargement: true });
          }

          buffer = await pipeline.toBuffer();
          // Cambiar extensión a .webp en el nombre de destino
          const nameWithoutExt = filename.split('.').slice(0, -1).join('.') || 'image';
          filename = `${nameWithoutExt}.webp`;
        } catch (sharpError) {
          console.error('[Upload Service] Falló Sharp, subiendo original:', sharpError);
        }
      }

      const contentType = this.detectContentType(filename, buffer);
      const ext = this.getExtension(filename, contentType);
      const targetFolder = folder || (temporary ? 'temp' : 'products');
      const uniqueName = `${targetFolder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

      await this.putObject(uniqueName, buffer, contentType);

      const url = `${this.publicUrl}/${this.bucket}/${uniqueName}`;
      console.log('[Upload Service] Imagen subida a MinIO:', url);
      return { success: true, url, path: uniqueName };
    } catch (error: any) {
      console.error('[Upload Service] Error subiendo a MinIO:', error.message);
      throw new Error(error.message || 'Error al subir imagen');
    }
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    const host = this.endpoint.replace(/^https?:\/\//, '');
    const url = `${this.endpoint}/${this.bucket}/${key}`;

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
}
