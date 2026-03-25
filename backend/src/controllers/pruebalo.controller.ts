import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { getCachedBrandConfig, setCachedBrandConfig, invalidateBrandConfigCache } from '../utils/brandConfigCache';
import { BrandsService } from '../services/brands.service';
import { ProductsService } from '../services/products.service';
import { UsageService } from '../services/usage.service';
import { GenerationsService } from '../services/generations.service';
import { N8nClient } from '../services/n8n.client';
import { PaymentSettingsService } from '../services/paymentSettings.service';
import { FeedbackService, GenerationErrorType } from '../services/feedback.service';
import { PromptRagService } from '../services/prompt-rag.service';
import { UploadService } from '../services/upload.service';
import { buildCategoryRulesBlock, getPromptRules } from '../config/prompt-rules';
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
const paymentSettingsService = new PaymentSettingsService();
const feedbackService = new FeedbackService();
const promptRagService = new PromptRagService();
const uploadService = new UploadService();

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

    // Obtener configuración global de pagos y modal
    const paymentSettings = await paymentSettingsService.getSettings();
    const footerBrandUrl = paymentSettings.footer_brand_url || 'https://lookitry.com';
    // El timer global es de 3 minutos (180 segundos)
    const globalTimerSeconds = (paymentSettings as any).landing_preview_timer_seconds || 180;

    // La lógica de previsualización se maneja en el frontend usando localStorage
    // Calcularlo por created_at bloqueaba al usuario si no la veía el mismo día de registro.
    let isPreviewExpired = false;

    // Obtener productos activos de la marca (Solo si no ha expirado o si ya pagó)
    const products = isPreviewExpired ? [] : await productsService.getProductsByBrand(brand.id);

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
        // Mini-landing
        brand_description: (brand as any).brand_description ?? null,
        whatsapp_contact: (brand as any).whatsapp_contact ?? null,
        cover_image_url: (brand as any).cover_image_url ?? null,
        social_links: (brand as any).social_links ?? {},
        has_landing_page: (brand as any).has_landing_page ?? false,
        landing_suspended_at: (brand as any).landing_suspended_at ?? null,
        // Nuevos campos
        city_display: (brand as any).city_display ?? null,
        national_shipping: (brand as any).national_shipping ?? false,
        whatsapp_message: (brand as any).whatsapp_message ?? null,
        cta_button_text: (brand as any).cta_button_text ?? 'Probarme esto',
        rating: (brand as any).rating ?? null,
        total_reviews: (brand as any).total_reviews ?? 0,
        landing_template: (brand as any).landing_template ?? 'classic',
        schedule: (brand as any).schedule ?? null,
        slogan: (brand as any).slogan ?? null,
        // Configuración del modal (Desde settings globales o marca)
        modal_title: (brand as any).modal_title || (paymentSettings as any).landing_modal_title || 'Vista previa agotada',
        modal_description: (brand as any).modal_description || (paymentSettings as any).landing_modal_description || 'Tu tiempo de prueba ha terminado. Activa tu mini-landing para continuar.',
        modal_features: (brand as any).modal_features || (paymentSettings as any).landing_modal_features || ['URL personalizada', 'Catálogo IA ilimitado', 'Branding propio'],
        preview_timer_seconds: globalTimerSeconds,
        is_preview_expired: isPreviewExpired,
        logo_light: (brand as any).logo_light ?? null,
        logo_dark: (brand as any).logo_dark ?? null,
        cover_bg_color: (brand as any).cover_bg_color ?? null,
        cover_overlay_opacity: (brand as any).cover_overlay_opacity ?? 0.55,
        show_brand_name: (brand as any).show_brand_name ?? true,
        header_color: (brand as any).header_color ?? null,
        plan: brand.plan ?? 'BASIC',
      },
      footer_brand_url: footerBrandUrl,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.imageUrl,
        category: product.category,
        price: (product as any).price ?? null,
        badge: (product as any).badge ?? null,
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

    // 5. Subir imagen a MinIO en carpeta temporal
    const uploadResult = await uploadService.uploadImageBuffer({
      buffer: selfieFile.buffer,
      filename: selfieFile.originalname || 'selfie.jpg',
      temporary: true,
    });

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
      // 7.1 Obtener configuración de IA desde payment_settings para refinamiento global
      const { data: globalSettings } = await supabaseAdmin
        .from('payment_settings')
        .select('ai_prompt_master, ai_prompt_negative')
        .eq('id', 1)
        .single();

      // 7.2 Construir prompt base con reglas de categoría
      let finalPrompt = buildTryOnPrompt(product);

      // 7.3 Aplicar refinamientos globales del Administrador (Master Prompt)
      if (globalSettings?.ai_prompt_master) {
        finalPrompt += `\n\n[ADMIN MASTER RULES — HIGHEST PRIORITY]\n- ${globalSettings.ai_prompt_master}`;
      }

      // 7.4 Aplicar prompt negativo global
      if (globalSettings?.ai_prompt_negative) {
        finalPrompt += `\n\n[NEGATIVE PROMPT — DO NOT GENERATE]\n${globalSettings.ai_prompt_negative}`;
      }

      // 7.5 Enriquecer con RAG (aprendizaje de errores anteriores) — timeout 4s, no bloquea
      const prompt = await promptRagService.enrichPrompt(finalPrompt, product.category ?? null);

      const n8nResult = await n8nClient.callTryOnWebhook({
        brand_id: brand.id,
        product_id: product.id,
        selfie_url: uploadResult.url,
        product_image_url: product.image_url,
        prompt,
      });

      if (!n8nResult.success || !n8nResult.imageUrl) {
        throw new Error(n8nResult.error || 'Error desconocido en generación');
      }

      const processingTime = Date.now() - startTime;
      // 8. Actualizar registro con resultado (SUCCESS/FAILED) — guardar prompt para trazabilidad RAG
      await generationsService.updateGeneration(generation.id, {
        status: 'SUCCESS',
        result_image_url: n8nResult.imageUrl,
        selfie_url: n8nResult.imageUrl,
        processing_time: processingTime,
        prompt_used: prompt,
      });

      // 9. Retornar imageUrl al frontend
      return res.status(200).json({
        success: true,
        generationId: generation.id,
        imageUrl: n8nResult.imageUrl,
        processingTime,
      });

    } catch (n8nError: any) {
      const processingTime = Date.now() - startTime;

      // ── Debugging detallado para trazabilidad ──────────────────────────────
      const isCreditsError =
        n8nError.statusCode === 402 ||
        n8nError.statusCode === 429 ||
        (n8nError.message || '').toLowerCase().includes('insufficient') ||
        (n8nError.message || '').toLowerCase().includes('credits') ||
        (n8nError.message || '').toLowerCase().includes('quota') ||
        (n8nError.message || '').toLowerCase().includes('out of credits') ||
        (n8nError.message || '').toLowerCase().includes('402') ||
        JSON.stringify(n8nError.n8nBody ?? {}).toLowerCase().includes('credits');

      console.error('[pruebalo] Error en generación', {
        brandSlug,
        brandId: brand.id,
        productId: product.id,
        generationId: generation.id,
        errorType: isCreditsError ? 'CREDITS_EXHAUSTED' : 'GENERATION_FAILED',
        statusCode: n8nError.statusCode ?? null,
        message: n8nError.message,
        n8nBody: n8nError.n8nBody ?? null,
        processingTimeMs: processingTime,
      });

      // Guardar en BD con tipo de error para debugging
      await generationsService.updateGeneration(generation.id, {
        status: 'FAILED',
        error_message: isCreditsError
          ? `CREDITS_EXHAUSTED: ${n8nError.message}`
          : n8nError.message,
      });

      if (isCreditsError) {
        throw new ExternalServiceError(
          'SERVICE_CREDITS_EXHAUSTED',
          'openrouter'
        );
      }

      throw new ExternalServiceError(
        'Error al generar la imagen. Por favor intenta de nuevo.',
        'n8n'
      );
    }
  });

  /**
   * POST /api/pruebalo/:brandSlug/generation/:generationId/feedback
   * Endpoint público para reportar un error en una generación.
   * No requiere autenticación — el cliente del widget puede reportar directamente.
   */
  reportGenerationFeedback = asyncHandler(async (req: Request, res: Response) => {
    const { brandSlug, generationId } = req.params;
    const { error_type, description } = req.body;

    const validErrorTypes: GenerationErrorType[] = [
      'wrong_clothing_removed',
      'wrong_clothing_kept',
      'body_distortion',
      'color_wrong',
      'product_not_applied',
      'background_changed',
      'other',
    ];

    if (!error_type || !validErrorTypes.includes(error_type)) {
      throw new ValidationError(
        `Tipo de error inválido. Valores permitidos: ${validErrorTypes.join(', ')}`
      );
    }

    // Verificar que la generación existe y pertenece a esta marca
    const brand = await brandsService.getBrandBySlug(brandSlug);
    if (!brand) throw new NotFoundError('Marca no encontrada');

    const generation = await generationsService.getGenerationById(generationId);
    if (!generation) throw new NotFoundError('Generación no encontrada');
    if (generation.brand_id !== brand.id) throw new NotFoundError('Generación no encontrada');

    // Obtener categoría del producto para el RAG
    let productCategory: string | undefined;
    try {
      const product = await productsService.getProductById(generation.product_id);
      productCategory = product?.category ?? undefined;
    } catch { /* producto eliminado */ }

    // Guardar feedback (dispara embedding async vía n8n)
    const feedback = await feedbackService.createFeedback({
      generation_id: generationId,
      brand_id: brand.id,
      error_type,
      description: description?.trim() || undefined,
      product_category: productCategory,
      prompt_used: (generation as any).prompt_used ?? undefined,
    });

    // Verificar si hay errores frecuentes del mismo tipo → notificar admin
    feedbackService.countRecentByType(error_type, productCategory ?? null, 24)
      .then(async (count) => {
        if (count >= 3) {
          const { createAdminNotification } = await import('../utils/adminNotifications');
          await createAdminNotification({
            type: 'high_usage',
            severity: 'warning',
            title: 'Errores frecuentes de generación',
            message: `Se han reportado ${count} errores de tipo "${error_type}"${productCategory ? ` en categoría "${productCategory}"` : ''} en las últimas 24h.`,
          });
        }
      })
      .catch(() => { /* silencioso */ });

    return res.status(201).json({
      success: true,
      id: feedback.id,
      message: 'Gracias por tu reporte. Lo usaremos para mejorar las generaciones.',
    });
  });

  /**
   * GET /api/pruebalo/resolve-domain?host=...
   * Resuelve una marca a partir de su dominio personalizado.
   */
  resolveDomain = asyncHandler(async (req: Request, res: Response) => {
    const host = req.query.host as string;
    if (!host) {
      return res.status(400).json({ error: 'HOST_REQUIRED', message: 'Host es requerido' });
    }

    // Limpiar host: remover puertos o prefijos
    const cleanHost = host.split(':')[0].toLowerCase();
    
    // Si es el dominio base o localhost, no hay nada que resolver aquí
    const baseDomain = process.env.BASE_DOMAIN || 'lookitry.com';
    if (cleanHost === baseDomain || cleanHost === 'localhost') {
      return res.status(200).json({ slug: null });
    }

    const brand = await brandsService.getBrandByCustomDomain(cleanHost);
    
    if (!brand) {
      return res.status(200).json({ slug: null });
    }

    return res.status(200).json({ slug: brand.slug });
  });

  /**
   * GET /api/pruebalo/validate-api-key?key=...
   * Endpoint público para validar una clave de API desde el plugin
   */
  validateApiKey = asyncHandler(async (req: Request, res: Response) => {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ valid: false, message: 'Clave de API requerida' });
    }

    const brand = await brandsService.getBrandByApiKey(key);
    if (!brand) {
      return res.status(200).json({ valid: false, message: 'Clave de API inválida' });
    }

    return res.status(200).json({ 
      valid: true, 
      brandName: brand.name,
      plan: brand.plan 
    });
  });
}

/**
 * Construye el prompt de try-on para Gemini.
 * Aplica reglas base por categoría de prenda para evitar errores comunes
 * (ej: vestido que deja pantalón visible, zapatos eliminados incorrectamente).
 */
function buildTryOnPrompt(product: { name: string; category?: string; description?: string | null }): string {
  const rules = getPromptRules(product.category);
  const categoryRulesBlock = buildCategoryRulesBlock(product.category);

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

    `[CLOTHING REPLACEMENT — MANDATORY]`,
    categoryRulesBlock,
    `- ${rules.replace}`,
    `- ${rules.keep}`,
    `- Do NOT leave any clothing item from the original photo visible if the product replaces it.`,
  );

  // Refuerzo extra para vestidos: el modelo tiende a dejar chaquetas y pantalones
  const cat = (product.category || '').toUpperCase();
  if (cat.includes('VESTIDO') || cat.includes('DRESS')) {
    lines.push(
      `[DRESS OVERRIDE — HIGHEST PRIORITY]`,
      `- The person may be wearing a jacket, denim jacket, cardigan, or coat in the original photo. REMOVE IT COMPLETELY.`,
      `- The person may be wearing pants, jeans, or leggings in the original photo. REMOVE THEM COMPLETELY.`,
      `- After applying the dress, NO jacket, NO pants, NO jeans, NO leggings should be visible anywhere in the image.`,
      `- The dress is the SOLE garment on the body. Treat this as a non-negotiable hard rule.`,
    );
  }

  lines.push(
    `[COMPOSITION & FRAMING]`,
    `- The input photo may be a close-up selfie (face/bust) OR a full-body shot. Detect which type it is and preserve that exact framing.`,
    `- If it is a full-body photo: show the person completely from head to toe. Never crop feet, legs, or any body part.`,
    `- If it is a close-up selfie: keep the same tight framing around the face and upper body.`,
    `- Maintain the exact same pose, body position, background, and spatial composition as the original photo.`,
    `- Fill every pixel of the frame with the scene — no empty space, no unused canvas area.`,

    `[OUTPUT DIMENSIONS]`,
    `- The output image MUST match the EXACT aspect ratio of the input selfie.`,
    `- NEVER add white borders, black bars, gray padding, letterboxing, pillarboxing, or any kind of margin.`,

    `[PRODUCT FIDELITY]`,
    `- Reproduce the garment EXACTLY as shown in the reference image: same colors, patterns, textures, logos, stitching, cuts, and fit.`,
    `- Do NOT invent, simplify, or alter any visual element of the product.`,

    `[PERSON & REALISM]`,
    `- Keep the person's face, skin tone, hair, body proportions, and expression IDENTICAL to the selfie.`,
    `- The product must fit naturally on the body with correct perspective, lighting, and shadows.`,
    `- Photorealistic quality only — no illustrations, no stylization.`,

    `Output: the final try-on image only. No text, no watermarks, no UI overlays.`,
  );

  return lines.join('\n');
}
