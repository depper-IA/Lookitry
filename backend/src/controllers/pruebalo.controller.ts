import { Request, Response } from 'express';
import { getCachedBrandConfig, setCachedBrandConfig, invalidateBrandConfigCache } from '../utils/brandConfigCache';
import { BrandsService } from '../services/brands.service';
import { ProductsService } from '../services/products.service';
import { UsageService } from '../services/usage.service';
import { GenerationsService } from '../services/generations.service';
import { N8nClient } from '../services/n8n.client';
import {
  NotFoundError,
  ValidationError,
  LimitExceededError,
  ExternalServiceError,
  asyncHandler,
} from '../middleware/errorHandler';

const brandsService = new BrandsService();
const productsService = new ProductsService();
const usageService = new UsageService();
const generationsService = new GenerationsService();
const n8nClient = new N8nClient();

export class PruebaloController {
  /**
   * GET /api/pruebalo/:brandSlug
   * Endpoint público para obtener configuración de marca y productos
   * No requiere autenticación
   */
  getBrandConfig = asyncHandler(async (req: Request, res: Response) => {
    const { brandSlug } = req.params;

    if (!brandSlug) {
      throw new ValidationError('El slug de la marca es requerido');
    }

    // Intentar obtener del caché
    const cached = getCachedBrandConfig(brandSlug);
    if (cached) {
      // Invalidar si las URLs de productos tienen el proxy antiguo
      const hasProxyUrls = cached.products?.some((p: any) =>
        p.image_url && String(p.image_url).includes('/api/img-proxy')
      );
      if (!hasProxyUrls) {
        return res.status(200).json(cached);
      }
      // Caché contaminado — invalidar y reconstruir
      invalidateBrandConfigCache(brandSlug);
    }

    // Buscar marca por slug
    const brand = await brandsService.getBrandBySlug(brandSlug);

    if (!brand) {
      throw new NotFoundError('Marca no encontrada');
    }

    // Obtener productos activos de la marca
    const products = await productsService.getProductsByBrand(brand.id);

    // Preparar respuesta con configuración visual y productos
    const response = {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        widget_template: brand.widget_template,
        button_text: brand.button_text,
        welcome_message: brand.welcome_message,
        // Campos de mini-landing (task 33)
        brand_description: (brand as any).brand_description ?? null,
        whatsapp_contact: (brand as any).whatsapp_contact ?? null,
        cover_image_url: (brand as any).cover_image_url ?? null,
        social_links: (brand as any).social_links ?? {},
        has_landing_page: (brand as any).has_landing_page ?? false,
      },
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.imageUrl,   // el servicio devuelve camelCase
        category: product.category,
      })),
    };

    // Guardar en caché antes de responder
    setCachedBrandConfig(brandSlug, response);

    return res.status(200).json(response);
  });

  /**
   * POST /api/pruebalo/:brandSlug/generate
   * Endpoint público para generar una imagen de try-on
   * No requiere autenticación
   */
  generateTryOn = asyncHandler(async (req: Request, res: Response) => {
    const { brandSlug } = req.params;
    const { productId } = req.body;
    const selfieFile = req.file; // Multer manejará el archivo

    // 1. Validar marca existe por slug
    const brand = await brandsService.getBrandBySlug(brandSlug);
    if (!brand) {
      throw new NotFoundError('Marca no encontrada');
    }

    // 2. Validar producto existe y pertenece a la marca
    const product = await productsService.getProductById(productId);
    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    if (product.brand_id !== brand.id) {
      throw new NotFoundError('Producto no encontrado para esta marca');
    }

    // 3. Verificar límites de plan
    const canGenerate = await usageService.checkGenerationLimit(brand.id);
    if (!canGenerate) {
      const usage = await usageService.getUsageStats(brand.id);
      throw new LimitExceededError(
        `Has excedido el límite de ${usage.currentMonth.generationsLimit} generaciones mensuales`,
        {
          used: usage.currentMonth.generationsUsed,
          limit: usage.currentMonth.generationsLimit,
        }
      );
    }

    // 4. Validar archivo
    if (!selfieFile) {
      throw new ValidationError('Debes subir una selfie');
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selfieFile.mimetype)) {
      throw new ValidationError('Solo se permiten archivos JPG, PNG o WEBP');
    }

    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selfieFile.size > maxSize) {
      throw new ValidationError('El archivo no debe superar 5MB');
    }

    // 5. Convertir imagen a base64
    const selfieBase64 = selfieFile.buffer.toString('base64');

    // 6. Crear registro en tabla generations (status PENDING)
    const generation = await generationsService.createGeneration({
      brand_id: brand.id,
      product_id: product.id,
      selfie_url: 'pending', // Se actualizará después
      status: 'PENDING',
    });

    // 7. Llamar a n8n con selfieBase64 y prompt
    const startTime = Date.now();
    try {
      const prompt = buildTryOnPrompt(product);

      const n8nResult = await n8nClient.callTryOnWebhook({
        brandId: brand.id,
        productId: product.id,
        selfieBase64,
        productImageUrl: product.image_url,
        prompt,
      });

      if (!n8nResult.success || !n8nResult.imageUrl) {
        throw new Error(n8nResult.error || 'Error desconocido en generación');
      }

      const processingTime = Date.now() - startTime;

      // 8. Actualizar registro con resultado (SUCCESS/FAILED)
      await generationsService.updateGeneration(generation.id, {
        status: 'SUCCESS',
        result_image_url: n8nResult.imageUrl,
        selfie_url: n8nResult.imageUrl, // n8n ya subió la selfie
        processing_time: processingTime,
      });

      // 9. Retornar imageUrl al frontend
      return res.status(200).json({
        success: true,
        generationId: generation.id,
        imageUrl: n8nResult.imageUrl,
        processingTime,
      });

    } catch (n8nError: any) {
      // Error en n8n
      await generationsService.updateGeneration(generation.id, {
        status: 'FAILED',
        error_message: n8nError.message,
      });

      throw new ExternalServiceError(
        'Error al generar la imagen. Por favor intenta de nuevo.',
        'n8n'
      );
    }
  });
}

/**
 * Construye el prompt de try-on para Gemini.
 * Si el producto tiene descripción generada por IA, la usa de forma estructurada
 * para maximizar la fidelidad visual del resultado.
 */
function buildTryOnPrompt(product: { name: string; category?: string; description?: string | null }): string {
  const lines: string[] = [
    `You are a professional virtual try-on AI specialized in fashion photography.`,
    `Your task: generate a single photorealistic image of the person in the selfie wearing the exact product shown in the reference image.`,
    `Product: "${product.name}"${product.category ? ` (${product.category})` : ''}.`,
  ];

  if (product.description) {
    lines.push(`Product visual details (reproduce every single one accurately): ${product.description}`);
  }

  lines.push(
    `ABSOLUTE RULES — follow all of them without exception:`,

    `[COMPOSITION & FRAMING]`,
    `- The input photo may be a close-up selfie (face/bust) OR a full-body shot. Detect which type it is and preserve that exact framing.`,
    `- If it is a full-body photo: show the person completely from head to toe. Never crop feet, legs, or any body part.`,
    `- If it is a close-up selfie: keep the same tight framing around the face and upper body.`,
    `- Maintain the exact same pose, body position, background, and spatial composition as the original photo.`,
    `- Fill every pixel of the frame with the scene — no empty space, no unused canvas area.`,

    `[OUTPUT DIMENSIONS]`,
    `- The output image MUST match the EXACT aspect ratio of the input selfie (e.g. if the selfie is portrait 3:4, output must be portrait 3:4).`,
    `- NEVER add white borders, black bars, gray padding, letterboxing, pillarboxing, or any kind of margin. The image must bleed to all four edges.`,

    `[PRODUCT FIDELITY]`,
    `- Reproduce the garment or accessory EXACTLY as shown in the reference image: same colors, patterns, textures, logos, stitching, cuts, fit, and every design detail.`,
    `- Do NOT invent, simplify, or alter any visual element of the product.`,
    `- If a description is provided above, cross-reference it with the reference image to ensure maximum accuracy.`,

    `[PERSON & REALISM]`,
    `- Keep the person's face, skin tone, hair, body proportions, and expression IDENTICAL to the selfie.`,
    `- The product must fit naturally on the body with correct perspective, lighting, and shadows matching the original photo.`,
    `- Photorealistic quality only — no illustrations, no stylization.`,

    `Output: the final try-on image only. No text, no watermarks, no UI overlays.`,
  );

  return lines.join(' ');
}
