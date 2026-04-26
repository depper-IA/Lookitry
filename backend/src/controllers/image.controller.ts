import { Request, Response } from 'express';
import { ImageService } from '../services/image.service';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import crypto from 'crypto';

const imageService = new ImageService();

export class ImageController {
  /**
   * GET /api/images/render
   * Renderiza una imagen con marca de agua dinámica.
   */
  renderImage = asyncHandler(async (req: Request, res: Response) => {
    const { src, plan, download } = req.query as { src: string; plan: string; download?: string };

    if (!src || !plan) {
      throw new ValidationError('Faltan parámetros: src y plan son requeridos');
    }

    // Validar que la URL sea de nuestro MinIO para evitar SSRF
    const allowedHost = process.env.MINIO_PUBLIC_URL || 'https://minio.wilkiedevs.com';
    if (!src.startsWith(allowedHost)) {
      throw new ValidationError('URL de imagen no permitida');
    }

    // ââ Lógica de Caché con Redis âââââââââââââââââââââââââââââââââââââ
    const cacheKey = `img:${plan}:${crypto.createHash('md5').update(src).digest('hex')}`;
    
    try {
      // Intentar obtener de Redis (fallback silencioso si falla la conexión)
      const cached = await redis.getBuffer(cacheKey).catch(() => null);
      
      if (cached) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache persistente del navegador (1 semana)
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        if (download === 'true') {
          res.setHeader('Content-Disposition', 'attachment; filename="lookitry-result.jpg"');
        }

        return res.send(cached);
      }
    } catch (e) {
      console.warn('[Redis] Fallo en lectura de caché:', e);
    }
    // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

    try {
      const processedBuffer = await imageService.processWithWatermark(src, plan);
      
      // Guardar en Redis de forma asíncrona (sin bloquear el response)
      redis.set(cacheKey, processedBuffer, 'EX', 86400).catch(e => {
        console.warn('[Redis] Fallo al guardar en caché:', e);
      });

      // Headers de seguridad y caché
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      if (download === 'true') {
        res.setHeader('Content-Disposition', 'attachment; filename="lookitry-result.jpg"');
      }
      
      return res.send(processedBuffer);
    } catch (error: any) {
      console.error('[ImageController] Error en render:', error.message);
      return res.redirect(src);
    }
  });
}
