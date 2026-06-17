import { Response } from 'express';
import { ProductsService } from '../services/products.service';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';

const productsService = new ProductsService();

export class EmbedController {
  /**
   * POST /api/embed/wordpress/init
   * Inicializa la carga del widget para un producto de WooCommerce.
   * Requiere apiKeyAuth (x-api-key).
   */
  initWordPressEmbed = asyncHandler(async (req: AuthRequest, res: Response) => {
    // La marca fue inyectada por apiKeyAuth
    const brand = req.brand;
    const { external_id } = req.body;

    if (!brand) {
      throw new Error('Marca no encontrada en el request');
    }

    if (!external_id) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'external_id es requerido' });
    }

    // Buscar el producto por external_id
    const product = await productsService.getProductByExternalId(brand.id, external_id);

    if (!product) {
      // Si el producto no existe o no está mapeado, se puede retornar un error o una URL sin producto preseleccionado
      throw new NotFoundError(`Producto con ID externo ${external_id} no encontrado o inactivo en Lookitry.`);
    }

    // Construir la URL del widget preseleccionando el producto
    const baseUrl = process.env.FRONTEND_URL || '';
    const embedUrl = `${baseUrl}/embed/${brand.slug}?product_id=${product.id}&plugin_view=1`;

    return res.status(200).json({
      success: true,
      embedUrl,
      widgetUrl: `${baseUrl}/widget.js`,
      brandSlug: brand.slug,
      product: {
        id: product.id,
        name: product.name
      }
    });
  });
}
