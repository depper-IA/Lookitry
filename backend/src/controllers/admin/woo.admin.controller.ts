import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

interface WooBrand {
  id: string;
  name: string;
  email: string;
  slug: string;
  is_woocommerce_active: boolean;
  woocommerce_store_url?: string;
}

/**
 * GET /api/admin/woocommerce/brands-summary
 * Obtener resumen de marcas con WooCommerce
 */
export const getWooBrandsSummary = async (_req: Request, res: Response) => {
  try {
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, is_woocommerce_active, woocommerce_store_url')
      .not('woocommerce_store_url', 'is', null)
      .not('woocommerce_store_url', 'eq', '');

    if (error) throw error;

    const brandList: WooBrand[] = (brands || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      slug: b.slug,
      is_woocommerce_active: b.is_woocommerce_active || false,
      woocommerce_store_url: b.woocommerce_store_url,
    }));

    return res.status(200).json({
      brands: brandList,
      count: brandList.length,
    });
  } catch (error: any) {
    console.error('[woo.admin.controller] getWooBrandsSummary error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener resumen WooCommerce' });
  }
};

/**
 * GET /api/admin/woocommerce/brands/:id/products
 * Obtener productos de una marca en WooCommerce
 */
export const getWooBrandProducts = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Brand ID requerido' });
  
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, sku, price, is_active, image_url')
      .eq('brand_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.status(200).json({
      products: products || [],
      summary: {
        total: (products || []).length,
        active: (products || []).filter((p: any) => p.is_active).length,
      },
    });
  } catch (error: any) {
    console.error('[woo.admin.controller] getWooBrandProducts error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener productos WooCommerce' });
  }
};

/**
 * PATCH /api/admin/woocommerce/brands/:id/products/:productId/active
 * Activar/desactivar producto en WooCommerce
 */
export const setWooProductActive = async (req: Request, res: Response) => {
  const { id, productId } = req.params;
  const { active } = req.body;
  
  if (!id || !productId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Brand ID y Product ID requeridos' });
  }
  
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: active })
      .eq('id', productId)
      .eq('brand_id', id);

    if (error) throw error;

    return res.status(200).json({ 
      message: active ? 'Producto activado' : 'Producto desactivado',
      productId,
      active,
    });
  } catch (error: any) {
    console.error('[woo.admin.controller] setWooProductActive error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar producto' });
  }
};