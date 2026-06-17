import { Request, Response } from 'express';

import { GenerationsService } from '../services/generations.service';

import { ProductsService } from '../services/products.service';

import { asyncHandler, ValidationError } from '../middleware/errorHandler';



const generationsService = new GenerationsService();

const productsService = new ProductsService();

const MINIO_PUBLIC = process.env.MINIO_PUBLIC_URL || 'https://minio.wilkiedevs.com';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * En produccion, proxea URLs de MinIO a traves del backend para evitar CORS/hotlinking.
 * En desarrollo, retorna la URL directa de MinIO (sin restricciones).
 */
function toProxiedUrl(url: string | null): string | null {
  if (!url || url === '[EXPIRADO]' || url.startsWith('[')) return url;
  if (url.startsWith('data:')) return url;
  // En desarrollo, cargar directo de MinIO (no hay restricciones CORS en localhost)
  if (!IS_PROD) return url;
  // En produccion, proxear a traves del backend
  if (url.includes(MINIO_PUBLIC) || url.includes('minio.wilkiedevs.com')) {
    return `${process.env.API_URL || 'https://api.lookitry.com'}/api/pruebalo/img-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}


export class GenerationsController {

  getGenerations = asyncHandler(async (req: Request, res: Response) => {

    const brandId = (req as any).brand?.id;

    const limit = Math.min(Number(req.query.limit) || 50, 100);



    const status = (req.query.status as string) || 'SUCCESS';

    const generations = await generationsService.getGenerationsByBrand(brandId, limit, status);



    const productIds = [...new Set(generations.map(g => g.product_id).filter(Boolean))];

    const productMap: Record<string, { name: string; imageUrl: string }> = {};



    await Promise.all(

      productIds.map(async id => {

        try {

          const p = await productsService.getProductById(id);

          if (p) productMap[id] = { name: p.name, imageUrl: p.image_url };

        } catch { /* producto eliminado */ }

      })

    );



    // Ley 1581 Art. 10-C: solo resultImageUrl (imagen generada sintética), nunca selfie_url
    // Proxear URLs de MinIO para evitar bloqueos CORS/hotlinking en el frontend
    const result = generations.map(g => ({

      id: g.id,
      productId: g.product_id,
      productName: productMap[g.product_id]?.name ?? 'Producto eliminado',
      productImageUrl: toProxiedUrl(productMap[g.product_id]?.imageUrl ?? null),
      resultImageUrl: toProxiedUrl(g.result_image_url),
      resultImageDeletedAt: (g as any).result_image_deleted_at ?? null,
      status: g.status,
      error_message: g.error_message,
      generatedAt: g.generated_at,
      processingTime: g.processing_time ?? null,
      has_feedback: g.has_feedback ?? false,
      feedback_types: g.feedback_types ?? [],
      feedback_count: g.feedback_count ?? 0,
    }));



    return res.status(200).json({ generations: result, total: result.length });

  });



  /** DELETE /api/generations/:id — borrar una generación */

  deleteGeneration = asyncHandler(async (req: Request, res: Response) => {

    const brandId = (req as any).brand?.id;

    const { id } = req.params;

    if (!id) throw new ValidationError('ID requerido');

    await generationsService.deleteGeneration(id, brandId);

    return res.status(200).json({ success: true });

  });



  /** DELETE /api/generations — borrado masivo por IDs */

  deleteGenerations = asyncHandler(async (req: Request, res: Response) => {

    const brandId = (req as any).brand?.id;

    const { ids } = req.body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) throw new ValidationError('Se requiere un array de IDs');

    if (ids.length > 100) throw new ValidationError('Máximo 100 generaciones por operación');

    const deleted = await generationsService.deleteGenerations(ids, brandId);

    return res.status(200).json({ success: true, deleted });

  });

}

