import { supabaseAdmin } from '../config/supabase';
import { N8nClient } from './n8n.client';
import { invalidateBrandConfigCache } from '../utils/brandConfigCache';
import { Product } from '../types';
import { PLANS } from '../config/plans';
import { recordTrialEvent } from '../utils/brandLifecycle';

const n8nClient = new N8nClient();

export interface CreateProductDto {
  name: string;
  description?: string; // IA description - NOT visible to customers, used internally
  short_description?: string; // Visible to customers - new field
  image_url: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  external_id?: string | null;
  attributes?: Record<string, any>; // Dynamic attributes by category - new field
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  category?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  external_id?: string | null;
  attributes?: Record<string, any>;
}

export class ProductsService {
  /**
   * Obtener todos los productos activos de una marca
   */
  async getProductsByBrand(brandId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error al obtener productos: ' + error.message);
    }

    // Mapear snake_case a camelCase para el frontend
    // NOTA: description (IA) NO se incluye en la respuesta para clientes
    return (data || []).map(product => ({
      id: product.id,
      brandId: product.brand_id,
      name: product.name,
      // description: product.description, // OCULTO - solo para uso interno de IA
      shortDescription: product.short_description ?? null,
      imageUrl: product.image_url,
      category: product.category,
      price: product.price ?? null,
      badge: product.badge ?? null,
      externalId: product.external_id ?? null,
      attributes: product.attributes ?? {},
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));
  }

  /**
   * Obtener un producto por ID (para admin - incluye descripción IA)
   */
  async getProductById(productId: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !data) {
      return null;
    }

    // Admin view - incluye todos los campos
    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      description: data.description ?? null, // Incluido para admin
      shortDescription: data.short_description ?? null,
      imageUrl: data.image_url,
      category: data.category,
      price: data.price ?? null,
      badge: data.badge ?? null,
      externalId: data.external_id ?? null,
      attributes: data.attributes ?? {},
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Obtener un producto por su ID externo (WordPress, Shopify, etc.)
   */
  async getProductByExternalId(brandId: string, externalId: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('external_id', externalId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      shortDescription: data.short_description ?? null,
      imageUrl: data.image_url,
      category: data.category,
      price: data.price ?? null,
      badge: data.badge ?? null,
      externalId: data.external_id ?? null,
      attributes: data.attributes ?? {},
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Contar productos activos de una marca
   */
  async countActiveProducts(brandId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    if (error) {
      throw new Error('Error al contar productos: ' + error.message);
    }

    return count || 0;
  }

  /**
   * Verificar si una marca puede crear más productos según su plan.
   * Si la marca está en período de prueba activo, aplica el límite de TRIAL (1 producto).
   */
  async canCreateProduct(brandId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
    // Obtener el plan y datos de trial de la marca
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, subscription_status')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      throw new Error('Error al obtener información de la marca');
    }

    // Trial activo = trial_end_date vigente y marca no suspendida.
    const isInTrial =
      brand.plan === 'TRIAL' &&
      brand.subscription_status !== 'suspended' &&
      !!brand.trial_end_date &&
      new Date(brand.trial_end_date) > new Date();

    const planKey = brand.plan ?? 'BASIC';
    const plan = PLANS[planKey] ?? PLANS['BASIC'];
    const currentCount = await this.countActiveProducts(brandId);

    return {
      canCreate: currentCount < plan.maxProducts,
      currentCount,
      limit: plan.maxProducts
    };
  }

  /**
   * Crear un nuevo producto
   */
  async createProduct(brandId: string, productData: CreateProductDto): Promise<any> {
    // Verificar límite de productos
    const { canCreate, currentCount, limit } = await this.canCreateProduct(brandId);

    if (!canCreate) {
      throw new Error(`Has alcanzado el límite de ${limit} productos para tu plan. Actualmente tienes ${currentCount} productos.`);
    }

    // Validar datos requeridos
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!productData.image_url || productData.image_url.trim().length === 0) {
      throw new Error('La URL de la imagen es requerida');
    }

    if (!productData.category || productData.category.trim().length === 0) {
      throw new Error('La categoría es requerida');
    }

    // Crear el producto con todos los campos nuevos
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        brand_id: brandId,
        name: productData.name.trim(),
        description: productData.description?.trim() || null, // IA description - interno
        short_description: productData.short_description?.trim() || null, // Visible para clientes
        image_url: productData.image_url.trim(),
        category: productData.category.trim(),
        price: productData.price ?? null,
        badge: productData.badge ?? null,
        external_id: productData.external_id || null,
        attributes: productData.attributes || {}, // Atributos dinámicos
        is_active: true
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al crear el producto: ' + error?.message);
    }

    if (currentCount === 0) {
      await recordTrialEvent(brandId, 'first_product_created', {
        source: 'manual',
        productId: data.id,
      }).catch(() => {});
    }

    // Mapear snake_case a camelCase para el frontend
    // NOTA: description (IA) NO se devuelve al cliente
    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      shortDescription: data.short_description ?? null,
      imageUrl: data.image_url,
      category: data.category,
      price: data.price ?? null,
      badge: data.badge ?? null,
      externalId: data.external_id ?? null,
      attributes: data.attributes ?? {},
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Actualizar un producto existente
   */
  async updateProduct(productId: string, brandId: string, updates: UpdateProductDto): Promise<any> {
    // Verificar que el producto existe y pertenece a la marca
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (product.brandId !== brandId) {
      throw new Error('No tienes permiso para editar este producto');
    }

    // Validar datos si se proporcionan
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error('El nombre del producto no puede estar vacío');
    }

    if (updates.image_url !== undefined && updates.image_url.trim().length === 0) {
      throw new Error('La URL de la imagen no puede estar vacía');
    }

    if (updates.category !== undefined && updates.category.trim().length === 0) {
      throw new Error('La categoría no puede estar vacía');
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
    if (updates.short_description !== undefined) updateData.short_description = updates.short_description?.trim() || null;
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url.trim();
    if (updates.category !== undefined) updateData.category = updates.category.trim();
    if (updates.price !== undefined) updateData.price = updates.price ?? null;
    if (updates.badge !== undefined) updateData.badge = updates.badge ?? null;
    if (updates.external_id !== undefined) updateData.external_id = updates.external_id || null;
    if (updates.attributes !== undefined) updateData.attributes = updates.attributes || {};

    // Actualizar el producto
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al actualizar el producto: ' + error?.message);
    }

    // Mapear snake_case a camelCase para el frontend
    // NOTA: description (IA) NO se devuelve al cliente
    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      shortDescription: data.short_description ?? null,
      imageUrl: data.image_url,
      category: data.category,
      price: data.price ?? null,
      badge: data.badge ?? null,
      externalId: data.external_id ?? null,
      attributes: data.attributes ?? {},
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Eliminar un producto (hard delete)
   * Las generaciones históricas se mantienen
   */
  async deleteProduct(productId: string, brandId: string): Promise<void> {
    // Verificar que el producto existe y pertenece a la marca
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (product.brandId !== brandId) {
      throw new Error('No tienes permiso para eliminar este producto');
    }

    // Hard delete: eliminar el registro físicamente
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw new Error('Error al eliminar el producto: ' + error.message);
    }
  }

  /**
   * Obtener todos los IDs externos sincronizados de una marca (activos e inactivos)
   */
  async getAllSyncedExternalIds(brandId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('external_id')
      .eq('brand_id', brandId)
      .not('external_id', 'is', null);

    if (error) {
      throw new Error('Error al obtener IDs sincronizados: ' + error.message);
    }

    return (data || []).map(p => String(p.external_id));
  }

  /**
   * Obtener los IDs externos sincronizados y activos de una marca.
   */
  async getActiveSyncedExternalIds(brandId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('external_id')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .not('external_id', 'is', null);

    if (error) {
      throw new Error('Error al obtener IDs sincronizados activos: ' + error.message);
    }

    return (data || []).map(p => String(p.external_id));
  }

  /**
   * Activar o desactivar productos sincronizados por external_id.
   */
  async setProductsActiveByExternalIds(
    brandId: string,
    externalIds: string[],
    active: boolean
  ): Promise<{ updated: number }> {
    const normalizedIds = Array.from(
      new Set(
        (externalIds || [])
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      )
    );

    if (normalizedIds.length === 0) {
      return { updated: 0 };
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_id', brandId)
      .in('external_id', normalizedIds)
      .select('id');

    if (error) {
      throw new Error('Error actualizando productos sincronizados: ' + error.message);
    }

    return { updated: (data || []).length };
  }

  /**
   * Sincronización masiva de productos (WooCommerce -> Lookitry)
   */
  async bulkSyncProducts(brandId: string, syncData: any[]): Promise<{ updated: number; created: number; skipped: number }> {
    if (!Array.isArray(syncData) || syncData.length === 0) {
      return { updated: 0, created: 0, skipped: 0 };
    }

    // 1. Obtener límites del plan
    const { currentCount, limit } = await this.canCreateProduct(brandId);
    let remainingSlots = Math.max(0, limit - currentCount);

    // 2. Obtener productos existentes con external_id
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('external_id, id, is_active')
      .eq('brand_id', brandId)
      .not('external_id', 'is', null);

    const existingMap = new Map();
    (existingProducts || []).forEach(p => {
      existingMap.set(String(p.external_id), { id: p.id, isActive: p.is_active });
    });

    let createdCount = 0;
    let updatedCount = 0;

    // 3. Preparar datos para upsert
    const upsertData = syncData.map(item => {
      const extId = String(item.external_id);
      const exists = existingMap.get(extId);
      
      let isActive = true;
      if (exists) {
        updatedCount++;
        // Si el producto ya existía, lo reactivamos (por si estaba inactivo)
        isActive = true; 
      } else {
        if (remainingSlots > 0) {
          isActive = true;
          remainingSlots--;
        } else {
          isActive = false;
        }
        createdCount++;
      }

      return {
        brand_id: brandId,
        external_id: extId,
        name: item.name?.trim() || 'Producto sin nombre',
        description: item.description?.trim() || null,
        short_description: item.short_description?.trim() || null,
        image_url: item.image_url?.trim() || '',
        category: item.category?.trim() || 'general',
        price: item.price ? parseInt(String(item.price)) : null,
        attributes: item.attributes || {},
        is_active: isActive,
        updated_at: new Date().toISOString()
      };
    }).filter(p => p.image_url !== '');

    if (upsertData.length === 0) {
      return { created: 0, updated: 0, skipped: syncData.length };
    }

    // 4. Upsert masivo
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(upsertData, { 
        onConflict: 'brand_id,external_id'
      })
      .select('id, image_url, description');

    if (error) {
      throw new Error('Error en sincronización masiva: ' + error.message);
    }

    // 5. Generar descripciones con IA para nuevos productos o sin descripción
    const webhookUrl = process.env.N8N_DESCRIPTOR_URL || 'https://n8n.wilkiedevs.com/webhook/descriptor';
    if (webhookUrl && (data || []).length > 0) {
      (data || []).forEach(p => {
        // Solo si no tiene descripción o es muy corta
        if (!p.description || p.description.length < 5) {
          n8nClient.callDescriptionWebhook({
            brand_id: brandId,
            product_id: p.id,
            product_image_url: p.image_url
          }).then(async (res) => {
            if (res.success && res.description) {
              await supabaseAdmin
                .from('products')
                .update({ description: res.description })
                .eq('id', p.id);
            }
          }).catch(err => console.error(`❌ Error descripción IA para ${p.id}:`, err.message));
        }
      });
    }

    if (currentCount === 0 && createdCount > 0) {
      await recordTrialEvent(brandId, 'first_product_created', {
        source: 'woocommerce_sync',
        createdCount,
      }).catch(() => {});
    }

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: syncData.length - upsertData.length
    };
  }
}
