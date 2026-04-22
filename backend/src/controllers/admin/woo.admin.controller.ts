import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';

/**
 * GET /api/admin/woocommerce/brands-summary
 * Obtener resumen de marcas con WooCommerce
 */
export const getWooBrandsSummary = async (_req: Request, res: Response) => {
  try {
    // Buscar marcas que tengan api_key
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, plan, api_key, subscription_status, social_links')
      .not('api_key', 'is', null);

    if (error) throw error;

    const brandIds = (brands || []).map(b => b.id);
    
    // Buscar productos
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, brand_id, is_active, external_id')
      .in('brand_id', brandIds.length ? brandIds : ['00000000-0000-0000-0000-000000000000']);

    // Buscar telemetría
    const { data: telemetry } = await supabaseAdmin
      .from('plugin_telemetry_events')
      .select('brand_id, success, duration_ms, created_at, error_message')
      .in('brand_id', brandIds.length ? brandIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false });

    const brandList = (brands || []).map((b: any) => {
      const socialLinks = b.social_links || {};
      const plugin_store_domain = socialLinks.woo_plugin_store_domain || null;
      const plugin_validated_at = socialLinks.woo_plugin_validated_at || null;
      
      const status = plugin_validated_at ? 'active' : (b.api_key ? 'pending' : 'inactive');

      const brandProducts = (products || []).filter(p => p.brand_id === b.id);
      const mappedProducts = brandProducts.filter(p => p.external_id);

      const brandTelemetry = (telemetry || []).filter(t => t.brand_id === b.id);
      const failedRequests = brandTelemetry.filter(t => !t.success).length;
      
      const totalDuration = brandTelemetry.reduce((acc, t) => acc + (t.duration_ms || 0), 0);
      const avgLatencyMs = brandTelemetry.length > 0 ? Math.round(totalDuration / brandTelemetry.length) : 0;

      return {
        id: b.id,
        name: b.name,
        email: b.email,
        slug: b.slug,
        plan: b.plan || 'BASIC',
        has_api_key: !!b.api_key,
        status,
        plugin_validated_at,
        plugin_store_domain,
        subscription_status: b.subscription_status,
        product_counts: {
          total: brandProducts.length,
          active: mappedProducts.filter(p => p.is_active).length,
          mapped: mappedProducts.length
        },
        telemetry: {
          totalRequests: brandTelemetry.length,
          failedRequests,
          avgLatencyMs,
          lastSyncAt: brandTelemetry.length > 0 ? brandTelemetry[0].created_at : null,
          lastErrorMessage: brandTelemetry.find(t => !t.success)?.error_message || null
        }
      };
    });

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
      .select('id, name, category, external_id, is_active, updated_at')
      .eq('brand_id', id)
      .not('external_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    // Fetch telemetry summary
    const { data: telemetry } = await supabaseAdmin
      .from('plugin_telemetry_events')
      .select('success, duration_ms, created_at, error_message')
      .eq('brand_id', id)
      .order('created_at', { ascending: false })
      .limit(100);
      
    const brandTelemetry = telemetry || [];
    const totalRequests = brandTelemetry.length;
    const failedRequests = brandTelemetry.filter(t => !t.success).length;
    const totalDuration = brandTelemetry.reduce((acc, t) => acc + (t.duration_ms || 0), 0);
    const avgLatencyMs = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    return res.status(200).json({
      products: products || [],
      summary: {
        products: {
          totalMappedProducts: (products || []).length,
          activeMappedProducts: (products || []).filter((p: any) => p.is_active).length,
        },
        telemetry: {
          totalRequests,
          failedRequests,
          avgLatencyMs,
          totalRetries: 0,
          lastSyncAt: totalRequests > 0 ? brandTelemetry[0].created_at : null,
          lastErrorAt: failedRequests > 0 ? brandTelemetry.find(t => !t.success)?.created_at : null,
          lastErrorMessage: failedRequests > 0 ? brandTelemetry.find(t => !t.success)?.error_message : null
        }
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
  const { is_active } = req.body;
  
  if (!id || !productId) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Brand ID y Product ID requeridos' });
  }
  
  // Notice: The frontend sends { is_active: nextState }
  if (is_active === undefined) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'is_active requerido' });
  }
  
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active })
      .eq('id', productId)
      .eq('brand_id', id);

    if (error) throw error;

    return res.status(200).json({ 
      message: is_active ? 'Producto activado' : 'Producto desactivado',
      productId,
      is_active,
    });
  } catch (error: any) {
    console.error('[woo.admin.controller] setWooProductActive error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar producto' });
  }
};