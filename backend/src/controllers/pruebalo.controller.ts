import { Request, Response } from 'express';

import { createHash } from 'crypto';

import jwt from 'jsonwebtoken';

import { supabaseAdmin } from '../config/supabase';

import { getCachedBrandConfig, setCachedBrandConfig, invalidateBrandConfigCache } from '../utils/brandConfigCache';

import { BrandsService } from '../services/brands.service';

import { ProductsService } from '../services/products.service';

import { UsageService } from '../services/usage.service';

import { GenerationsService } from '../services/generations.service';

import { N8nClient } from '../services/n8n.client';

import { sanitizeError } from '../utils/sanitizeError';

import { PaymentSettingsService } from '../services/paymentSettings.service';

import { FeedbackService, GenerationErrorType } from '../services/feedback.service';

import { PromptRagService } from '../services/prompt-rag.service';

import { UploadService } from '../services/upload.service';
import { compressImagesForN8N } from '../services/image-compression.service';

import { buildCategoryRulesBlock, getPromptRules } from '../config/prompt-rules';

import { createAdminNotification } from '../utils/adminNotifications';

import { generationConcurrencyService } from '../services/generation-concurrency.service';

import {

  getBrandAllowedOrigins,

  getExpectedStoreHost,

  getIncomingStoreHost,

  isAllowedStoreHost,

  normalizeOrigin,

  sanitizeDomainList,

} from '../utils/storeDomain';

import {

  NotFoundError,

  ValidationError,

  LimitExceededError,

  ConcurrencyLimitError,

  ExternalServiceError,

  asyncHandler,

} from '../middleware/errorHandler';

import { getBrandSocialLinks, recordTrialEvent } from '../utils/brandLifecycle';

import {

  sanitizePromptForGeneration,

  addAntiInjectionInstructions,

} from '../utils/promptSecurity';

import { isWhitelistedSync } from '../middleware/rateLimiter';



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

  private assertPluginOperational(brand: any) {

    const socialLinks = getBrandSocialLinks(brand);

    if (socialLinks.app_uninstalled_at || socialLinks.integration_paused_at) {

      throw new ValidationError('La integración está pausada o desinstalada para esta tienda');

    }

    

    // Plugin solo funciona con planes PRO o ENTERPRISE

    const allowedPlans = ['PRO', 'ENTERPRISE'];

    if (!allowedPlans.includes(brand.plan)) {

      throw new ValidationError('El plugin de WooCommerce requiere un plan PRO o ENTERPRISE. Tu plan actual es ' + brand.plan + '.');

    }

  }



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



    // Intentar obtener del cach©

    const cached = getCachedBrandConfig(brandSlug);

    if (cached) {

      // Invalidar si las URLs de productos tienen el proxy antiguo

      const hasProxyUrls = cached.products?.some((p: any) =>

        p.image_url && String(p.image_url).includes('/api/img-proxy')

      );

      if (!hasProxyUrls) {

        return res.status(200).json(cached);

      }

      // Cach© contaminado — invalidar y reconstruir

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

    const isPreviewExpired = false;



    // Obtener productos activos de la marca (Solo si no ha expirado o si ya pagó)

    // Si la marca tiene widget_product_ids definidos, usar solo esos productos

    const widgetProductIds = (brand as any).widget_product_ids || [];

    let products = isPreviewExpired ? [] : await productsService.getProductsByBrand(brand.id);



    // Filtrar productos si widget_product_ids está definido y no está vacío

    if (widgetProductIds.length > 0) {

      products = products.filter(p => widgetProductIds.includes(p.id));

      // Mantener el orden definido en widget_product_ids

      products = widgetProductIds

        .map((id: string) => products.find((p: any) => p.id === id))

        .filter(Boolean);

    }



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

        landing_font: (brand as any).landing_font ?? null,

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

        widget_cover_image: (brand as any).widget_cover_image ?? null,

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



    // Guardar en cach© antes de responder

    setCachedBrandConfig(brandSlug, response);



    return res.status(200).json(response);

  });



  /**

   * GET /api/pruebalo/allowed-origins

   * Devuelve una lista de todos los dominios registrados en "Sitio Web" (social_links.website).

   * Usado por el Edge Middleware para la Lista Blanca Dinámica de iframes.

   */

  getAllowedOrigins = asyncHandler(async (req: Request, res: Response) => {

    const { data, error } = await supabaseAdmin

      .from('brands')

      .select('social_links, custom_domain');



    if (error) {

      console.error('[getAllowedOrigins] Error fetch:', error);

      return res.status(500).json({ origins: [] });

    }



    const origins = new Set<string>();

    

    // Siempre permitimos locahost para pruebas y los dominios de la misma plataforma

    origins.add('http://localhost:3000');

    origins.add('http://127.0.0.1:3000');

    origins.add('https://lookitry.com');

    origins.add('https://www.lookitry.com');



    data?.forEach(brand => {

      getBrandAllowedOrigins(brand).forEach((origin) => origins.add(origin));

    });



    return res.status(200).json({ origins: Array.from(origins) });

  });



  /**

   * POST /api/pruebalo/:brandSlug/generate

   * Endpoint público para generar una imagen de try-on

   * No requiere autenticación

   */

  generateTryOn = asyncHandler(async (req: Request, res: Response) => {

    const { brandSlug } = req.params;

    const { productId, clientFingerprint } = req.body;

    const imageFile = req.file; // Multer manejará el archivo



    // 1. Validar marca existe por slug

    const brand = await brandsService.getBrandBySlug(brandSlug);

    if (!brand) {

      throw new NotFoundError('Marca no encontrada');

    }



    if (brand.email_verified === false) {

      throw new ValidationError(

        'Debes confirmar el correo de esta cuenta para habilitar los cr©ditos y usar el probador virtual.'

      );

    }



    // 2. Validar producto existe y pertenece a la marca

    const product = await productsService.getProductById(productId);

    if (!product) {

      throw new NotFoundError('Producto no encontrado');

    }



    if (product.brandId !== brand.id) {

      throw new NotFoundError('Producto no encontrado para esta marca');

    }



    // 3. Validar archivo

    if (!imageFile) {

      throw new ValidationError('Debes subir una foto o imagen');

    }



    // Validar tipo de archivo

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validTypes.includes(imageFile.mimetype)) {

      throw new ValidationError('Solo se permiten archivos JPG, PNG o WEBP');

    }



    // Validar tamaño máximo (5MB)

    const maxSize = 5 * 1024 * 1024; // 5MB

    if (imageFile.size > maxSize) {

      throw new ValidationError('El archivo no debe superar 5MB');

    }



    // 3.1 Control de concurrencia: adquirir slot antes de procesar

    const slot = await generationConcurrencyService.acquireSlot(brand.id, brand.plan);

    if (!slot.acquired) {

      const slotInfo = await generationConcurrencyService.getSlotInfo(brand.id, brand.plan);

      throw new ConcurrencyLimitError(

        `El probador está ocupado con ${slotInfo.active} generación(es). Intenta en ${Math.ceil(slot.waitTimeMs / 1000)}s.`,

        slotInfo.queueTimeoutMs

      );

    }



    let slotReleased = false;

    const releaseSlot = async () => {

      if (!slotReleased) {

        slotReleased = true;

        await generationConcurrencyService.releaseSlot(brand.id, slot.slotId).catch(() => {});

      }

    };



    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';

    const whitelisted = isWhitelistedSync(ip);



    const inputFingerprint = createHash('sha256')

      .update(imageFile.buffer)

      .digest('hex');



    const existingGeneration = await generationsService.getSuccessfulGenerationByFingerprint(

      brand.id,

      product.id,

      inputFingerprint

    );



    if (existingGeneration?.result_image_url) {

      return res.status(200).json({

        success: true,

        generationId: existingGeneration.id,

        imageUrl: existingGeneration.result_image_url,

        processingTime: existingGeneration.processing_time ?? 0,

        reused: true,

        message: 'Ya habías generado este producto con esta misma imagen. Te mostramos el resultado guardado sin costo adicional.',

      });

    }



    // 4. Verificar límite de intentos del cliente (3 intentos máx por producto en 30 días)

    if (clientFingerprint && !whitelisted) {

      const { data: clientAttempts } = await supabaseAdmin.rpc('check_client_product_attempts', {

        p_brand_id: brand.id,

        p_product_id: product.id,

        p_client_fingerprint: clientFingerprint,

      });



      if (clientAttempts !== null && clientAttempts >= 3) {

        await generationConcurrencyService.releaseSlot(brand.id, slot.slotId).catch(() => {});

        return res.status(429).json({

          success: false,

          error: 'CLIENT_ATTEMPT_LIMIT_EXCEEDED',

          message: 'Ya usaste tus 3 intentos para este producto. Prueba otro o vuelve mañana.',

          attemptsUsed: clientAttempts,

          attemptsLimit: 3,

        });

      }

    }



    // 5. Reservar un cr©dito real antes de generar (Bypass para IPs en whitelist)

    let creditReservation: { source: 'monthly' | 'extra' } | null = null;



    if (!whitelisted) {

      try {

        creditReservation = await usageService.reserveGenerationCredit(brand.id);

      } catch (error: any) {

        if (error.message === 'INSUFFICIENT_CREDITS') {

          const usage = await usageService.getUsageStats(brand.id);

          throw new LimitExceededError(

            'Cr©ditos insuficientes',

            {

              used: usage.currentMonth.generationsUsed,

              limit: usage.currentMonth.generationsLimit,

            }

          );

        }

        throw error;

      }

    } else {

      console.log(`[pruebalo] IP Whitelisted (${ip}): Saltando reserva de cr©ditos.`);

    }



    // 5. Subir imagen a MinIO en carpeta temporal

    const uploadResult = await uploadService.uploadImageBuffer({

      buffer: imageFile.buffer,

      filename: imageFile.originalname || 'foto.jpg',

      temporary: true,

    });



    // 6. Crear registro en tabla generations (status PENDING)

    const generation = await generationsService.createGeneration({

      brand_id: brand.id,

      product_id: product.id,

      selfie_url: uploadResult.url,

      input_fingerprint: inputFingerprint,

      client_fingerprint: clientFingerprint || null,

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



      // 7.2 Validate and sanitize all prompt inputs (security)

      const sanitized = sanitizePromptForGeneration(

        product.name,

        product.category ?? null,

        product.description,

        globalSettings?.ai_prompt_master,

        globalSettings?.ai_prompt_negative

      );



      // Log injection warnings but don't block (admin should fix their prompts)

      if (sanitized.injectionWarnings.length > 0) {

        console.warn('[PromptSecurity] Injection warnings detected:', sanitized.injectionWarnings);

      }



      // 7.3 Build prompt with category rules

      let finalPrompt = buildTryOnPrompt({

        name: sanitized.safeName,

        category: product.category,

        description: sanitized.safeDescription,

      });



      // 7.4 Apply sanitized admin prompts

      if (sanitized.safeMaster) {

        finalPrompt += `\n\n[ADMIN MASTER RULES — HIGHEST PRIORITY]\n- ${sanitized.safeMaster}`;

      }



      // 7.5 Apply sanitized negative prompt

      if (sanitized.safeNegative) {

        finalPrompt += `\n\n[NEGATIVE PROMPT — DO NOT GENERATE]\n${sanitized.safeNegative}`;

      }



      // 7.7 Add anti-injection instructions to final prompt

      finalPrompt = addAntiInjectionInstructions(finalPrompt);



      // 7.8 Enrich with RAG (learning from previous errors) — timeout 4s, non-blocking

      const prompt = await promptRagService.enrichPrompt(finalPrompt, product.category ?? null);



// 7.9 Compress images before sending to n8n (reduce size for faster Vertex AI processing)
      console.log(`[pruebalo] Comprimiendo imágenes para generación ${generation.id}...`);

      const { selfie_url: compressedSelfieUrl, product_image_url: compressedProductUrl, compressionStats } =
        await compressImagesForN8N(uploadResult.url, product.imageUrl || '');

      console.log(`[pruebalo] Compresión completada. Selfie: ${compressionStats.selfie.success ? `${compressionStats.selfie.originalSize}→${compressionStats.selfie.compressedSize}` : 'fallback'}, Producto: ${compressionStats.product.success ? `${compressionStats.product.originalSize}→${compressionStats.product.compressedSize}` : 'fallback'}`);

      // 7.9.1 Direct processing (no Redis) — call n8n directly and wait for result
      console.log(`[pruebalo] Llamando n8n directamente para generación ${generation.id}`);

      let n8nResult: { success: boolean; imageUrl?: string; error?: string } = { success: false };

      try {
        n8nResult = await n8nClient.callTryOnWebhook({
          brand_id: brand.id,
          product_id: product.id,
          selfie_url: compressedSelfieUrl,
          product_image_url: compressedProductUrl,
          prompt,
        });

      } catch (n8nCallError: any) {

        console.error('[pruebalo] Error en llamada a n8n:', n8nCallError.message);

        // Continuar para que el código de abajo maneje el error

      }



      // 7.10 Polling until generation is ready (max 90s) — in case worker updates the record

      const maxPolls = 45;

      let pollCount = 0;

      let finalGeneration = generation;



      while (pollCount < maxPolls) {

        await new Promise(resolve => setTimeout(resolve, 2000));



        const updated = await generationsService.getGenerationById(generation.id);

        if (updated?.status === 'SUCCESS' && updated.result_image_url) {

          finalGeneration = updated;

          break;

        }

        if (updated?.status === 'FAILED') {

          throw new Error(updated.error_message || 'Generación fallida');

        }



        // Si n8n respondió directamente, usar ese resultado

        if (n8nResult.success && n8nResult.imageUrl) {

          await generationsService.updateGeneration(generation.id, {

            status: 'SUCCESS',

            result_image_url: n8nResult.imageUrl,

            processing_time: Date.now() - startTime,

            prompt_used: prompt,

          });

          finalGeneration = (await generationsService.getGenerationById(generation.id)) || finalGeneration;

          break;

        }



        pollCount++;

      }



      // Si despu©s del polling aún no tenemos resultado y n8n dio error, lanzar error de n8n

      if (finalGeneration.status !== 'SUCCESS' || !finalGeneration.result_image_url) {

        if (n8nResult.success && n8nResult.imageUrl) {

          // n8n tuvo ©xito pero el polling no vio el resultado - usar resultado directo

          finalGeneration.result_image_url = n8nResult.imageUrl;

          finalGeneration.status = 'SUCCESS';

        } else if (!n8nResult.success && n8nResult.error) {

          // Error conocido de n8n

          throw new ExternalServiceError(

            n8nResult.error || 'Error al generar la imagen. Por favor intenta de nuevo.',

            'n8n'

          );

        } else {

          throw new Error('Timeout esperando resultado de generación');

        }

      }



      const processingTime = Date.now() - startTime;



      // 8. Actualizar registro con resultado (SUCCESS/FAILED) — guardar prompt para trazabilidad RAG

      await generationsService.updateGeneration(finalGeneration.id, {

        status: 'SUCCESS',

        result_image_url: finalGeneration.result_image_url,

        processing_time: processingTime,

        prompt_used: prompt,

      });



      const { count: successfulCount } = await supabaseAdmin

        .from('generations')

        .select('*', { count: 'exact', head: true })

        .eq('brand_id', brand.id)

        .eq('status', 'SUCCESS');



      if ((successfulCount || 0) === 1) {

        await recordTrialEvent(brand.id, 'first_generation_completed').catch(() => {});

      }



      // 9. Retornar imageUrl al frontend

      await releaseSlot();

      return res.status(200).json({

        success: true,

        generationId: finalGeneration.id,

        imageUrl: finalGeneration.result_image_url,

        processingTime,

        reused: false,

      });



    } catch (n8nError: any) {

      await releaseSlot();

      const processingTime = Date.now() - startTime;

      if (creditReservation?.source === 'extra') {

        await usageService.refundReservedExtraCredit(brand.id).catch((refundError) => {

          console.error('[pruebalo] No se pudo devolver el cr©dito extra reservado', refundError);

        });

      }



      const constraintViolation =

        n8nError?.code === '23505' ||

        (n8nError?.message || '').includes('generations_brand_product_input_success_idx');



      if (constraintViolation) {

        const dedupedGeneration = await generationsService.getSuccessfulGenerationByFingerprint(

          brand.id,

          product.id,

          inputFingerprint

        );



        if (dedupedGeneration?.result_image_url) {

          return res.status(200).json({

            success: true,

            generationId: dedupedGeneration.id,

            imageUrl: dedupedGeneration.result_image_url,

            processingTime: dedupedGeneration.processing_time ?? 0,

            reused: true,

            message: 'Ya existía un resultado para esta imagen y este producto. Te mostramos el guardado para evitar un costo duplicado.',

          });

        }

      }



      // ———— Debugging detallado para trazabilidad ————————————————————————————————————————————————————————————

      const errorText = [

        n8nError.message || '',

        JSON.stringify(n8nError.n8nBody ?? {}),

      ].join(' ').toLowerCase();



      const isCreditsError =

        n8nError.statusCode === 402 ||

        n8nError.statusCode === 429 ||

        errorText.includes('insufficient') ||

        errorText.includes('credits') ||

        errorText.includes('quota') ||

        errorText.includes('out of credits') ||

        errorText.includes('insufficient balance') ||

        errorText.includes('balance') ||

        errorText.includes('payment required') ||

        errorText.includes('billing') ||

        errorText.includes('provider returned error') ||

        errorText.includes('402');



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

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { count: recentCreditsAlerts } = await supabaseAdmin

          .from('admin_notifications')

          .select('*', { count: 'exact', head: true })

          .eq('type', 'credits_exhausted')

          .eq('brand_id', brand.id)

          .gte('created_at', oneHourAgo);



        if (!recentCreditsAlerts) {

          await createAdminNotification({

            type: 'credits_exhausted',

            severity: 'error',

            title: 'Cr©ditos agotados en prueba virtual',

            message: `${brand.name} se quedó sin cr©ditos de generación. Los clientes finales verán un mensaje temporal de indisponibilidad hasta que se recargue capacidad.`,

            brandId: brand.id,

            brandName: brand.name,

            metadata: {

              brandSlug,

              productId: product.id,

              generationId: generation.id,

              provider: 'openrouter',

            },

          });

        }



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



    // Verificar si hay errores frecuentes del mismo tipo —  notificar admin

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

   * GET /api/pruebalo/:brandSlug/generation/:generationId

   * Endpoint público para consultar el estado de una generación (polling del widget).

   * No requiere autenticación — el generationId actúa como token de acceso.

   */

  getGenerationStatus = asyncHandler(async (req: Request, res: Response) => {

    const { brandSlug, generationId } = req.params;



    // Verificar que la marca existe (para validar ownership)

    const brand = await brandsService.getBrandBySlug(brandSlug);

    if (!brand) throw new NotFoundError('Marca no encontrada');



    // Obtener la generación

    const generation = await generationsService.getGenerationById(generationId);

    if (!generation) {

      // 404 si no existe — frontend treat as PENDING

      return res.status(404).json({ error: 'Generación no encontrada' });

    }



    // Verificar que pertenece a esta marca

    if (generation.brand_id !== brand.id) {

      return res.status(404).json({ error: 'Generación no encontrada' });

    }



    return res.status(200).json({

      status: generation.status,

      imageUrl: generation.status === 'SUCCESS' ? generation.result_image_url : undefined,

      error: generation.status === 'FAILED' ? generation.error_message : undefined,

      processingTime: generation.processing_time ?? null,

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

   * GET /api/pruebalo/session-token?key=...

   * Endpoint público (S2S) para generar un token JWT efímero.

   * El plugin lo pide para pasarlo al frontend y evitar exponer la API Key.

   */

  generateSessionToken = asyncHandler(async (req: Request, res: Response) => {

    const key = (req.query.key as string) || (req.headers['x-api-key'] as string);

    const domain = req.query.domain as string;



    if (!key) {

      return res.status(400).json({ valid: false, message: 'Clave de API requerida' });

    }



    const brand = await brandsService.getBrandByApiKey(key);

    if (!brand) {

      return res.status(200).json({ valid: false, message: 'Clave de API inválida' });

    }

    this.assertPluginOperational(brand);



    if (domain) {

      await this.markPluginValidated(brand, domain);

    }



    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {

      throw new Error('JWT_SECRET no está configurado');

    }



    // Token efímero de 1 hora

    const token = jwt.sign(

      { 

        brand_id: brand.id, 

        brand_slug: brand.slug,

        type: 'embed_session' 

      },

      jwtSecret,

      { expiresIn: '1h' }

    );



    return res.status(200).json({

      valid: true,

      token,

      expires_in: 3600

    });

  });



  /**

   * GET /api/pruebalo/validate-api-key?key=...

   * Endpoint público para validar una clave de API desde el plugin

   */

  validateApiKey = asyncHandler(async (req: Request, res: Response) => {

    const keyFromHeader = req.headers['x-api-key'] as string;

    const keyFromQuery = req.query.key as string;

    const key = keyFromHeader || keyFromQuery;

    const incomingDomain = req.query.domain as string;

    

    if (!key) {

      return res.status(400).json({ valid: false, message: 'Clave de API requerida' });

    }



    const brand = await brandsService.getBrandByApiKey(key);

    if (!brand) {

      return res.status(200).json({ valid: false, message: 'Clave de API inválida' });

    }

    this.assertPluginOperational(brand);



    await this.markPluginValidated(brand, incomingDomain);



    const currentCount = await productsService.countActiveProducts(brand.id);

    const { PLANS } = await import('../config/plans');

    const planInfo = PLANS[brand.plan as keyof typeof PLANS] || PLANS['BASIC'];



    return res.status(200).json({

      valid: true, 

      brandName: brand.name,

      logo: brand.logo,

      logo_light: (brand as any).logo_light || brand.logo,

      logo_dark: (brand as any).logo_dark || brand.logo,

      plan: brand.plan,

      deprecatedQueryKey: !keyFromHeader && !!keyFromQuery,

      usage: {

        current: currentCount,

        max: planInfo.maxProducts,

        remaining: Math.max(0, planInfo.maxProducts - currentCount)

      }

    });

  });



  /**

   * GET /api/pruebalo/synced-products

   * Devuelve los IDs externos de los productos ya sincronizados para esta marca

   */

  getSyncedProducts = asyncHandler(async (req: Request, res: Response) => {

    const key = (req.query.key as string) || (req.headers['x-api-key'] as string);

    if (!key) {

      return res.status(400).json({ success: false, message: 'Clave de API requerida' });

    }



    const brand = await brandsService.getBrandByApiKey(key);

    if (!brand) {

      return res.status(401).json({ success: false, message: 'Clave de API inválida' });

    }

    this.assertPluginOperational(brand);



    if (!isAllowedStoreHost(brand, req)) {

      return res.status(403).json({

        success: false,

        message: `Dominio no autorizado para esta API Key. Esperado: ${getExpectedStoreHost(brand)}. Recibido: ${getIncomingStoreHost(req)}`,

      });

    }



    const syncedIds = await productsService.getActiveSyncedExternalIds(brand.id);



    return res.status(200).json({ success: true, syncedIds });

  });



  /**

   * POST /api/pruebalo/sync-woocommerce

   * Sincroniza productos desde el plugin de WooCommerce

   */

  syncWooCommerceProducts = asyncHandler(async (req: Request, res: Response) => {

    const apiKey = req.headers['x-api-key'] as string;

    const { products } = req.body;



    if (!apiKey) {

      throw new ValidationError('Clave de API requerida');

    }



    if (!Array.isArray(products)) {

      throw new ValidationError('Lista de productos inválida');

    }



    const brand = await brandsService.getBrandByApiKey(apiKey);

    if (!brand) {

      throw new ValidationError('Clave de API inválida');

    }

    this.assertPluginOperational(brand);



    if (!isAllowedStoreHost(brand, req)) {

      throw new ValidationError(

        `Dominio no autorizado para esta API Key. Esperado: ${getExpectedStoreHost(brand)}. Recibido: ${getIncomingStoreHost(req)}`

      );

    }



    await this.markPluginValidated(brand, getIncomingStoreHost(req));



    const result = await productsService.bulkSyncProducts(brand.id, products);



    // Invalidar cach© tras sincronización

    invalidateBrandConfigCache(brand.slug);



    return res.status(200).json({

      success: true,

      message: 'Sincronización completada',

      result

    });

  });



  unsyncWooCommerceProducts = asyncHandler(async (req: Request, res: Response) => {

    const apiKey = req.headers['x-api-key'] as string;

    const externalIds = Array.isArray(req.body?.external_ids) ? req.body.external_ids : [];



    if (!apiKey) {

      throw new ValidationError('Clave de API requerida');

    }



    if (externalIds.length === 0) {

      throw new ValidationError('Debes indicar al menos un producto para desincronizar');

    }



    const brand = await brandsService.getBrandByApiKey(apiKey);

    if (!brand) {

      throw new ValidationError('Clave de API inválida');

    }

    this.assertPluginOperational(brand);



    if (!isAllowedStoreHost(brand, req)) {

      throw new ValidationError(

        `Dominio no autorizado para esta API Key. Esperado: ${getExpectedStoreHost(brand)}. Recibido: ${getIncomingStoreHost(req)}`

      );

    }



    await this.markPluginValidated(brand, getIncomingStoreHost(req));



    const result = await productsService.setProductsActiveByExternalIds(

      brand.id,

      externalIds.map((id: any) => String(id)),

      false

    );



    invalidateBrandConfigCache(brand.slug);



    return res.status(200).json({

      success: true,

      message: result.updated > 0 ? 'Producto(s) desincronizado(s)' : 'No hubo productos para desincronizar',

      result

    });

  });



  /**

   * POST /api/pruebalo/plugin-telemetry

   * Telemetria minima del plugin WooCommerce: errores, retries y latencia.

   */

  recordPluginTelemetry = asyncHandler(async (req: Request, res: Response) => {

    const apiKey = req.headers['x-api-key'] as string;



    if (!apiKey) {

      throw new ValidationError('Clave de API requerida');

    }



    const brand = await brandsService.getBrandByApiKey(apiKey);

    if (!brand) {

      throw new ValidationError('Clave de API inválida');

    }

    this.assertPluginOperational(brand);



    if (!isAllowedStoreHost(brand, req)) {

      throw new ValidationError(

        `Dominio no autorizado para esta API Key. Esperado: ${getExpectedStoreHost(brand)}. Recibido: ${getIncomingStoreHost(req)}`

      );

    }



    await this.markPluginValidated(brand, getIncomingStoreHost(req));



    const endpoint = String(req.body.endpoint || '').trim();

    const eventName = String(req.body.event_name || 'request_completed').trim();

    const success = Boolean(req.body.success);

    const durationMs = Number.isFinite(Number(req.body.duration_ms))

      ? Math.max(0, Math.round(Number(req.body.duration_ms)))

      : 0;

    const retryCount = Number.isFinite(Number(req.body.retry_count))

      ? Math.max(0, Math.round(Number(req.body.retry_count)))

      : 0;

    const statusCode = Number.isFinite(Number(req.body.status_code))

      ? Math.round(Number(req.body.status_code))

      : null;

    const errorMessage = req.body.error_message

      ? String(req.body.error_message).slice(0, 500)

      : null;

    const storeDomain = req.body.store_domain

      ? String(req.body.store_domain).slice(0, 255)

      : null;

    const productExternalId = req.body.product_external_id

      ? String(req.body.product_external_id).slice(0, 255)

      : null;

    const metadata = req.body.metadata && typeof req.body.metadata === 'object'

      ? req.body.metadata

      : {};



    if (!endpoint) {

      throw new ValidationError('endpoint es requerido');

    }



    const { error } = await supabaseAdmin

      .from('plugin_telemetry_events')

      .insert({

        brand_id: brand.id,

        source: 'woocommerce-plugin',

        event_name: eventName,

        endpoint,

        success,

        status_code: statusCode,

        duration_ms: durationMs,

        retry_count: retryCount,

        error_message: errorMessage,

        store_domain: storeDomain,

        product_external_id: productExternalId,

        metadata,

      });



    if (error) {

      throw new Error(`Error guardando telemetria del plugin: ${error.message}`);

    }



    if (!success && endpoint === '/api/pruebalo/sync-woocommerce') {

      createAdminNotification({

        type: 'plugin_error_spike',

        title: 'Error de sincronizacion WooCommerce',

        message: `${brand.name} reporto un fallo en la sincronizacion del plugin.`,

        severity: 'warning',

        brandId: brand.id,

        brandName: brand.name,

        metadata: {

          endpoint,

          statusCode,

          retryCount,

          durationMs,

          errorMessage,

          storeDomain,

        },

      }).catch(() => {});

    }



    return res.status(201).json({ success: true });

  });



  appUninstalled = asyncHandler(async (req: Request, res: Response) => {

    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {

      throw new ValidationError('Clave de API requerida');

    }



    const brand = await brandsService.getBrandByApiKey(apiKey);

    if (!brand) {

      throw new ValidationError('Clave de API inválida');

    }



    const currentSocialLinks = getBrandSocialLinks(brand);

    const nowIso = new Date().toISOString();



    await brandsService.updateBrand(brand.id, {

      has_landing_page: false,

      social_links: {

        ...currentSocialLinks,

        app_uninstalled_at: nowIso,

        integration_paused_at: nowIso,

        billing_paused_at: nowIso,

        credits_paused_at: nowIso,

        woo_plugin_validated_at: null,

        woo_plugin_store_domain: null,

        woo_plugin_validation_source: 'app_uninstalled',

      },

    });



    return res.status(200).json({ success: true, message: 'Integración pausada correctamente' });

  });



  private async markPluginValidated(brand: any, incomingDomain?: string | null) {

    const currentSocialLinks = ((brand as any).social_links || {}) as Record<string, any>;

    const normalizedIncomingOrigin = normalizeOrigin(incomingDomain || null);

    const mergedOrigins = sanitizeDomainList([

      ...(Array.isArray(currentSocialLinks.allowed_origins) ? currentSocialLinks.allowed_origins : []),

      currentSocialLinks.website,

      currentSocialLinks.woo_plugin_store_domain,

      normalizedIncomingOrigin,

    ]);



    const nextSocialLinks: Record<string, any> = {

      ...currentSocialLinks,

      allowed_origins: mergedOrigins,

      woo_plugin_validated_at:

        currentSocialLinks.woo_plugin_validated_at || new Date().toISOString(),

      woo_plugin_validation_source: 'plugin_handshake',

    };



    if (!currentSocialLinks.website && normalizedIncomingOrigin) {

      nextSocialLinks.website = normalizedIncomingOrigin;

    }



    if (normalizedIncomingOrigin) {

      nextSocialLinks.woo_plugin_store_domain = normalizedIncomingOrigin;

    }



    const shouldUpdate =

      nextSocialLinks.woo_plugin_validated_at !== currentSocialLinks.woo_plugin_validated_at ||

      nextSocialLinks.woo_plugin_store_domain !== currentSocialLinks.woo_plugin_store_domain ||

      JSON.stringify(nextSocialLinks.allowed_origins || []) !== JSON.stringify(currentSocialLinks.allowed_origins || []) ||

      nextSocialLinks.website !== currentSocialLinks.website;



    if (shouldUpdate) {

      await brandsService.updateBrand(brand.id, {

        social_links: nextSocialLinks,

      });

    }

  }



  /**

   * GET /api/pruebalo/img-proxy?url=...

   * Proxy para saltar bloqueos de CORS/Hotlinking de imágenes de productos

   */

  // SSRF protection: allowlist of safe domains for image proxy

  private static readonly ALLOWED_IMAGE_PROXY_DOMAINS = [

    'lookitry.com',

    'lookitry.co',

    'lookitry.app',

    'lookitry.net',

    'cdn.lookitry.com',

    'images.lookitry.com',

    'wilkiedevs.com',

    'www.wilkiedevs.com',

    'minio.wilkiedevs.com',

    'cdn.minio.wilkiedevs.com',

  ];



  /**

   * GET /api/pruebalo/img-proxy?url=...

   * Proxy para saltar bloqueos de CORS/Hotlinking de imágenes de productos

   */

  imgProxy = asyncHandler(async (req: Request, res: Response) => {

    const imageUrl = req.query.url as string;



    if (!imageUrl) {

      throw new ValidationError('URL de imagen requerida');

    }



    try {

      // Validar si es una URL absoluta

      if (!imageUrl.startsWith('http')) {

        throw new ValidationError('URL de imagen inválida');

      }

      // SSRF: validar destino de proxy de imágenes con allowlist y no IPs privadas

      const isAllowedImageUrl = (urlStr: string): boolean => {

        try {

          const u = new URL(urlStr);

          const host = u.hostname;

          const protocol = u.protocol.toLowerCase();



          if (protocol !== 'http:' && protocol !== 'https:') {

            return false;

          }



          if (u.username || u.password) {

            return false;

          }



          const port = u.port ? Number(u.port) : null;

          if (port && port !== 80 && port !== 443) {

            return false;

          }



          if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {

            const parts = host.split('.').map((p) => parseInt(p, 10));

            const [a, b] = parts;

            if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || host === '127.0.0.1') {

              return false;

            }

          }



          if (

            host === 'localhost' ||

            host === '0.0.0.0' ||

            host === '::1' ||

            host === '[::1]' ||

            host.endsWith('.local') ||

            host.endsWith('.internal')

          ) {

            return false;

          }



          return true;

        } catch {

          return false;

        }

      };

      if (!isAllowedImageUrl(imageUrl)) {

        throw new ValidationError('URL de imagen no permitida');

      }



      // Validar para prevenir SSRF
      try {
        const parsedUrl = new URL(imageUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        // ALLOWLIST: always allow our own services even if they resolve to local IPs in some environments
        const isAllowedDomain = hostname.endsWith('wilkiedevs.com') || hostname.endsWith('lookitry.com') || hostname.endsWith('supabase.co');

        if (!isAllowedDomain) {
          // Block localhost, internal IP ranges, and internal hostnames (including IPv6 brackets)
          const isInternal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)$/.test(hostname) ||
            /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname) ||
            hostname.endsWith('.local') ||
            hostname.endsWith('.internal');

          if (isInternal) {
            throw new ValidationError('URL de imagen no permitida');
          }
        }
      } catch (err: any) {

        throw new ValidationError(err.message === 'URL de imagen no permitida' ? err.message : 'URL de imagen inválida');

      }



      // WORKAROUND: Si imageUrl apunta a wilkiedevs.com y falla con ECONNREFUSED (Docker local
      // host resolution), reescribir la URL para usar la IP pública del VPS con el header Host
      // original para preservar el virtual host en Traefik.
      let fetchUrl = imageUrl;
      let fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(imageUrl).origin + '/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin',
      };

      // For MinIO URLs, bypass the public URL and use internal Docker hostname directly
      // since the backend container has direct network access to MinIO via Docker DNS
      // The public minio.wilkiedevs.com URL may have CDN/hotlink protection that blocks server-side requests
      console.log(`[imgProxy] Checking MinIO condition: imageUrl.includes('minio.wilkiedevs.com') = ${imageUrl.includes('minio.wilkiedevs.com')}`);
      if (imageUrl.includes('minio.wilkiedevs.com')) {
        const parsed = new URL(imageUrl);
        fetchUrl = `http://minio:9000${parsed.pathname}${parsed.search}${parsed.hash}`;
        console.log(`[imgProxy] MinIO URL detected, using internal Docker hostname: ${fetchUrl}`);
      } else if (imageUrl.includes('wilkiedevs.com')) {
        // For other wilkiedevs.com URLs, try direct fetch first with fallback
        try {
          const testResponse = await fetch(imageUrl, { headers: fetchHeaders });
          if (!testResponse.ok) {
            if (testResponse.status >= 500 || testResponse.status === 403 || testResponse.status === 404) {
              const parsed = new URL(imageUrl);
              fetchUrl = `http://31.220.18.39${parsed.pathname}${parsed.search}${parsed.hash}`;
              fetchHeaders['Host'] = parsed.host;
            } else {
              throw new Error(`Initial fetch failed: ${testResponse.statusText}`);
            }
          }
        } catch (err: any) {
          const isConnectionError =
            err?.cause?.code === 'ECONNREFUSED' ||
            err?.message?.includes('ECONNREFUSED') ||
            err?.message?.includes('fetch failed') ||
            err?.message?.includes('getaddrinfo') ||
            err?.message?.includes('ETIMEDOUT');

          if (isConnectionError) {
            const parsed = new URL(imageUrl);
            fetchUrl = `http://31.220.18.39${parsed.pathname}${parsed.search}${parsed.hash}`;
            fetchHeaders['Host'] = parsed.host;
          } else {
            throw err;
          }
        }
      }

      console.log(`[imgProxy] Final fetchUrl: ${fetchUrl}`);
      let response: Response;
      try {
        response = await fetch(fetchUrl, {
          headers: fetchHeaders,
        });
      } catch (fetchErr: any) {
        console.error(`[imgProxy] fetch() threw: ${fetchErr.message}, code: ${fetchErr.code}`);
        // If MinIO internal failed and it's a MinIO URL, try the public URL as fallback
        if (fetchUrl.includes('minio:9000') && imageUrl.includes('minio.wilkiedevs.com')) {
          console.log('[imgProxy] MinIO internal failed, falling back to public URL');
          fetchUrl = imageUrl;
          console.log(`[imgProxy] Retry with public URL: ${fetchUrl}`);
          response = await fetch(fetchUrl, {
            headers: fetchHeaders,
          });
        } else {
          throw fetchErr;
        }
      }

      console.log(`[imgProxy] Response status: ${response.status}, ok: ${response.ok}`);



      if (!response.ok) {

        throw new Error(`Error fetching image: ${response.statusText}`);

      }



      const contentType = response.headers.get('content-type');

      if (contentType) {

        res.setHeader('Content-Type', contentType);

      }



      // Cache por 24 horas

      res.setHeader('Cache-Control', 'public, max-age=86400');



      const buffer = await response.arrayBuffer();

      return res.send(Buffer.from(buffer));

} catch (error: any) {
      console.error(`[imgProxy] CATCH block reached. Error message: ${error.message}, stack: ${error.stack?.substring(0, 300)}`);
      const cause = error?.cause?.message || error?.cause?.code || 'unknown';
      const detail = `${error.message} | cause: ${cause}`;

      const logObj = { message: detail };

      if (error?.cause) (logObj as any).cause = error.cause;

      

      console.error('[imgProxy] Error:', logObj);

      if (error instanceof ValidationError) {

        return res.status(400).json({

          error: 'INVALID_IMAGE_URL',

          message: sanitizeError(error, 'URL de imagen inválida'),

        });

      }

      return res.status(500).json({ 

        error: 'FAILED_TO_PROXY_IMAGE', 

        message: sanitizeError(error, 'Error al procesar la imagen')

      });

    }

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



    `[NO MODEL-INSERTED WATERMARKS OR OVERLAYS]`,

    `- Preserve all authentic logos, brand marks, graphics, embroidery, and printed details that truly belong to the reference product.`,

    `- Do NOT generate any extra watermark, signature, caption, subtitle, AI stamp, stock-photo mark, UI overlay, or invented text that is not part of the real product design.`,

    `- Background objects, walls, lights, vehicles, and accessories must not contain invented words, signs, or graphic marks added by the model.`,

    `- The final image must look like a clean camera photograph, not a poster, ad creative, screenshot, or designed composition.`,



    `[PERSON & REALISM]`,

    `- Keep the person's face, skin tone, hair, body proportions, and expression IDENTICAL to the selfie.`,

    `- The product must fit naturally on the body with correct perspective, lighting, and shadows.`,

    `- Photorealistic quality only — no illustrations, no stylization.`,



    `Output: the final try-on image only. Keep real product branding if it exists, but never add model-invented watermarks, signatures, or UI overlays.`,

  );



  return lines.join('\n');

}

