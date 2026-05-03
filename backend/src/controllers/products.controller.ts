import { Response } from 'express';
import { ProductsService, CreateProductDto, UpdateProductDto } from '../services/products.service';
import { AuthRequest } from '../middleware/auth';
import { invalidateBrandConfigCache } from '../utils/brandConfigCache';
import { sanitizeError } from '../utils/sanitizeError';
import { descriptorService } from '../services/ai-descriptor/ai-descriptor.service';

const productsService = new ProductsService();

export class ProductsController {
  /**
   * GET /api/products - Listar productos de la marca autenticada
   */
  async getProducts(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const products = await productsService.getProductsByBrand(req.brand.id);
      const { currentCount, limit } = await productsService.canCreateProduct(req.brand.id);

      return res.status(200).json({
        products,
        count: currentCount,
        limit,
      });
    } catch (error: any) {
      console.error('Error en getProducts:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener productos',
      });
    }
  }

  /**
   * GET /api/products/:id - Obtener un producto específico (para admin - incluye descripción IA)
   */
  async getProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const productId = req.params.id;

      if (!productId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'ID de producto requerido',
        });
      }

      const product = await productsService.getProductById(productId);

      if (!product) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Producto no encontrado',
        });
      }

      // Verificar que el producto pertenece a la marca
      if (product.brandId !== req.brand.id) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'No tienes permiso para ver este producto',
        });
      }

      return res.status(200).json(product);
    } catch (error: any) {
      console.error('Error en getProduct:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener el producto',
      });
    }
  }

  /**
   * POST /api/products - Crear un nuevo producto
   */
  async createProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const productData: CreateProductDto = {
        name: req.body.name,
        description: req.body.description, // IA description - interno
        short_description: req.body.short_description,
        image_url: req.body.image_url || req.body.imageUrl,
        category: req.body.category,
        price: req.body.price != null ? Number(req.body.price) : null,
        badge: req.body.badge || null,
        attributes: req.body.attributes || {},
      };

      const product = await productsService.createProduct(req.brand.id, productData);
 
      // Invalidar caché para que el cambio se vea en el plugin y widget inmediatamente
      invalidateBrandConfigCache(req.brand.slug);
      return res.status(201).json(product);
    } catch (error: any) {
      console.error('Error en createProduct:', error);

      // Errores de validación o límite
      if (error.message.includes('límite') || error.message.includes('requerido') || error.message.includes('vacío')) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: sanitizeError(error, 'Error de validación en producto'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al crear el producto'),
      });
    }
  }

  /**
   * PUT /api/products/:id - Actualizar un producto existente
   */
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const productId = req.params.id;

      if (!productId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'ID de producto requerido',
        });
      }

      const updates: UpdateProductDto = {};

      if (req.body.name !== undefined) {
        updates.name = req.body.name;
      }

      if (req.body.description !== undefined) {
        updates.description = req.body.description; // IA description - interno
      }

      if (req.body.short_description !== undefined) {
        updates.short_description = req.body.short_description;
      }

      if (req.body.image_url !== undefined || req.body.imageUrl !== undefined) {
        updates.image_url = req.body.image_url || req.body.imageUrl;
      }

      if (req.body.category !== undefined) {
        updates.category = req.body.category;
      }

      if (req.body.price !== undefined) {
        updates.price = req.body.price != null && req.body.price !== '' ? Number(req.body.price) : null;
      }

      if (req.body.badge !== undefined) {
        updates.badge = req.body.badge || null;
      }

      if (req.body.externalId !== undefined || req.body.external_id !== undefined) {
        updates.external_id = req.body.external_id || req.body.externalId || null;
      }

      if (req.body.attributes !== undefined) {
        updates.attributes = req.body.attributes;
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'No hay campos para actualizar',
        });
      }

      const product = await productsService.updateProduct(productId, req.brand.id, updates);
 
      // Invalidar caché tras actualización
      invalidateBrandConfigCache(req.brand.slug);
      return res.status(200).json(product);
    } catch (error: any) {
      console.error('Error en updateProduct:', error);

      // Errores de validación o permisos
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: sanitizeError(error, 'Producto no encontrado'),
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: sanitizeError(error, 'No tienes permiso para esta acción'),
        });
      }

      if (error.message.includes('vacío') || error.message.includes('requerido')) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: sanitizeError(error, 'Error de validación en producto'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al actualizar el producto',
      });
    }
  }

  /**
   * DELETE /api/products/:id - Eliminar un producto
   */
  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const productId = req.params.id;

      if (!productId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'ID de producto requerido',
        });
      }

      await productsService.deleteProduct(productId, req.brand.id);
 
      // CRITICAL: Invalidar caché para que el plugin de WooCommerce sepa que el producto ya no existe/está inactivo
      invalidateBrandConfigCache(req.brand.slug);
      
      return res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error en deleteProduct:', error);

      // Errores de validación o permisos
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: sanitizeError(error, 'Producto no encontrado'),
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: sanitizeError(error, 'No tienes permiso para esta acción'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al eliminar el producto'),
      });
    }
  }

  /**
   * POST /api/products/describe-ai
   * Generates AI product descriptions using the direct Vertex AI descriptor service.
   * Replaces the former n8n webhook proxy.
   */
  async describeProductWithAI(req: AuthRequest, res: Response) {
    try {
      const { product_name, category, brand_description } = req.body;

      // 1. Validation — product_name and category are required
      if (!product_name || !category) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'product_name y category son requeridos',
        });
      }

      // 2. Auth check
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      // 3. Call descriptorService (replaces n8n webhook)
      // image_url is intentionally NOT passed — the descriptor uses text-only prompts
      const descriptionObj = await descriptorService.describeProduct({
        name: product_name,
        category,
        brand_description,
        image_url: req.body.image_url,
      });

      // Construir un string descriptivo para que el frontend lo guarde como "description"
      const parts = Object.entries(descriptionObj)
        .filter(([k, v]) => v && k !== 'product_type' && k !== 'extra_attributes')
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        
      if (descriptionObj.extra_attributes) {
        Object.entries(descriptionObj.extra_attributes).forEach(([k, v]) => {
          parts.push(`${k}: ${v}`);
        });
      }
      
      const descriptionString = parts.join('\n');

      // 4. Return the response in a format the frontend understands
      return res.status(200).json({
        description: descriptionString,
        raw_data: descriptionObj,
        category
      });
    } catch (error: any) {
      // Distinguish error types for debugging
      if (error.name === 'ValidationError') {
        return res.status(502).json({
          error: 'WEBHOOK_NOT_FOUND',
          message: sanitizeError(error, 'Respuesta inválida del servicio de IA'),
        });
      }
      if (error.name === 'VertexError') {
        return res.status(500).json({
          error: 'VERTEX_ERROR',
          message: sanitizeError(error, 'Error del servicio de IA'),
        });
      }

      console.error('[AI-Descriptor] Error general:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al procesar la descripción con IA'),
      });
    }
  }

  /* ——————— ROLLBACK: n8n webhook code (kept for safe rollback) ———————
  The code below was the original n8n proxy implementation.
  It is preserved here in case a rollback is needed.

  Original implementation (lines 297-399):
  ----------------------------------------------------------------
  async describeProductWithAI(req: AuthRequest, res: Response) {
    try {
      let { image_url, product_name, category } = req.body;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
      const descriptorUrl = process.env.N8N_DESCRIPTOR_URL || 'https://n8n.wilkiedevs.com/webhook/descriptor';

      let finalImageUrl = image_url;
      if (image_url && image_url.includes('img-proxy?url=')) {
        try {
          const urlObj = new URL(image_url);
          const realUrl = urlObj.searchParams.get('url');
          if (realUrl) { finalImageUrl = realUrl; }
        } catch (e) {}
      }

      const isInternal = finalImageUrl.includes('minio.wilkiedevs.com') || finalImageUrl.includes('supabase.co');
      if (finalImageUrl && !isInternal && finalImageUrl.startsWith('http')) {
        console.log(`[AI-Descriptor] Proxying external URL for n8n: ${finalImageUrl}`);
        finalImageUrl = `${apiBase}/api/pruebalo/img-proxy?url=${encodeURIComponent(finalImageUrl)}`;
      }

      if (!finalImageUrl || !product_name) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'image_url y product_name son requeridos' });
      }

      console.log(`[AI-Descriptor] Iniciando descripción para: ${product_name} | URL: ${finalImageUrl}`);

      const response = await fetch(descriptorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_BEARER_TOKEN || ''}`
        },
        body: JSON.stringify({ image_url: finalImageUrl, product_name, category }),
      });

      const rawText = await response.text();
      console.log(`[AI-Descriptor] n8n status: ${response.status} | body length: ${rawText.length}`);

      if (!response.ok) {
        console.error('[AI-Descriptor] Error de n8n:', rawText);
        throw new Error('Error al conectar con el servicio de IA');
      }

      if (!rawText || !rawText.trim()) {
        console.error('[AI-Descriptor] n8n devolvio cuerpo vacio');
        throw new Error('El servicio de IA no devolvio respuesta');
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('[AI-Descriptor] n8n no devolvio JSON valido:', rawText.slice(0, 200));
        throw new Error('Respuesta invalida del servicio de IA');
      }

      return res.status(200).json(data);
    } catch (error: any) {
      const statusCode = error?.statusCode || error?.response?.status;
      const n8nMessage = error?.n8nBody?.message || error?.n8nBody?.error;

      if (statusCode === 400) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: sanitizeError(error, 'Solicitud inválida al servicio de IA') });
      }
      if (statusCode === 404) {
        return res.status(502).json({ error: 'WEBHOOK_NOT_FOUND', message: sanitizeError(error, 'Workflow de IA no encontrado') });
      }
      if (statusCode === 408 || error?.message?.includes('timeout')) {
        return res.status(504).json({ error: 'TIMEOUT', message: sanitizeError(error, 'El servicio de IA tardó demasiado') });
      }
      if (statusCode === 429) {
        return res.status(429).json({ error: 'RATE_LIMIT', message: sanitizeError(error, 'Demasiadas solicitudes al servicio de IA') });
      }
      if (statusCode >= 500) {
        return res.status(502).json({ error: 'AI_SERVICE_ERROR', message: sanitizeError(error, 'Error del servicio de IA') });
      }
      if (n8nMessage) {
        console.error('[AI-Descriptor] Error de n8n:', n8nMessage);
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, n8nMessage) });
      }

      console.error('[AI-Descriptor] Error general:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al procesar la descripción con IA'),
      });
    }
  }
  -------------------------------------------------------------------- */
}
