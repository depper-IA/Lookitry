import { Response } from 'express';
import { ProductsService, CreateProductDto, UpdateProductDto } from '../services/products.service';
import { AuthRequest } from '../middleware/auth';
import { invalidateBrandConfigCache } from '../utils/brandConfigCache';

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
        description: req.body.description,
        image_url: req.body.image_url || req.body.imageUrl,
        category: req.body.category,
        price: req.body.price != null ? Number(req.body.price) : null,
        badge: req.body.badge || null,
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
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al crear el producto',
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
        updates.description = req.body.description;
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
          message: error.message,
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: error.message,
        });
      }

      if (error.message.includes('vacío') || error.message.includes('requerido')) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al actualizar el producto',
      });
    }
  }

  /**
   * DELETE /api/products/:id - Eliminar un producto (soft delete)
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
          message: error.message,
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al eliminar el producto',
      });
    }
  }

  /**
   * POST /api/products/describe-ai
   * Proxy para llamar al webhook de n8n que genera descripciones con IA.
   * Evita bloqueos de CORS del navegador al llamar a n8n directamente.
   */
  async describeProductWithAI(req: AuthRequest, res: Response) {
    try {
      const { image_url, product_name, category } = req.body;
      const descriptorUrl = process.env.N8N_DESCRIPTOR_URL || 'https://n8n.wilkiedevs.com/webhook/descriptor';

      if (!image_url || !product_name) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'image_url y product_name son requeridos',
        });
      }

      console.log(`[AI-Descriptor] Iniciando descripción para: ${product_name}`);

      const response = await fetch(descriptorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_BEARER_TOKEN || ''}`
        },
        body: JSON.stringify({ 
          image_url, 
          product_name, 
          category: category || 'General' 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI-Descriptor] Error de n8n:', errorText);
        throw new Error('Error al conectar con el servicio de IA');
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('[AI-Descriptor] Error general:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al procesar la descripción con IA',
      });
    }
  }
}
