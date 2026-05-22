import { Request, Response } from 'express';

import { GenerationsService } from '../services/generations.service';

import { ProductsService } from '../services/products.service';

import { asyncHandler, ValidationError } from '../middleware/errorHandler';



const generationsService = new GenerationsService();

const productsService = new ProductsService();



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
    const result = generations

      .map(g => ({

        id: g.id,

        productId: g.product_id,

        productName: productMap[g.product_id]?.name ?? 'Producto eliminado',

        productImageUrl: productMap[g.product_id]?.imageUrl ?? null,

        resultImageUrl: g.result_image_url,
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

