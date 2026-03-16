import { supabase } from '../config/supabase';
import { Product } from '../types';
import { PLANS } from '../config/plans';

export interface CreateProductDto {
  name: string;
  description?: string;
  image_url: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  image_url?: string;
  category?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
}

export class ProductsService {
  /**
   * Obtener todos los productos activos de una marca
   */
  async getProductsByBrand(brandId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error al obtener productos: ' + error.message);
    }

    // Mapear snake_case a camelCase para el frontend
    return (data || []).map(product => ({
      id: product.id,
      brandId: product.brand_id,
      name: product.name,
      description: product.description,
      imageUrl: product.image_url,
      category: product.category,
      price: product.price ?? null,
      badge: product.badge ?? null,
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }));
  }

  /**
   * Obtener un producto por ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Product;
  }

  /**
   * Contar productos activos de una marca
   */
  async countActiveProducts(brandId: string): Promise<number> {
    const { count, error } = await supabase
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
   * Verificar si una marca puede crear más productos según su plan
   */
  async canCreateProduct(brandId: string): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
    // Obtener el plan de la marca
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      throw new Error('Error al obtener información de la marca');
    }

    const plan = PLANS[brand.plan];
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

    // Crear el producto
    const { data, error } = await supabase
      .from('products')
      .insert({
        brand_id: brandId,
        name: productData.name.trim(),
        description: productData.description?.trim() || null,
        image_url: productData.image_url.trim(),
        category: productData.category.trim(),
        price: productData.price ?? null,
        badge: productData.badge ?? null,
        is_active: true
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al crear el producto: ' + error?.message);
    }

    // Mapear snake_case a camelCase para el frontend
    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      category: data.category,
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

    if (product.brand_id !== brandId) {
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
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url.trim();
    if (updates.category !== undefined) updateData.category = updates.category.trim();
    if (updates.price !== undefined) updateData.price = updates.price ?? null;
    if (updates.badge !== undefined) updateData.badge = updates.badge ?? null;

    // Actualizar el producto
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al actualizar el producto: ' + error?.message);
    }

    // Mapear snake_case a camelCase para el frontend (updateProduct)
    return {
      id: data.id,
      brandId: data.brand_id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      category: data.category,
      price: data.price ?? null,
      badge: data.badge ?? null,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Eliminar un producto (soft delete)
   * Las generaciones históricas se mantienen
   */
  async deleteProduct(productId: string, brandId: string): Promise<void> {
    // Verificar que el producto existe y pertenece a la marca
    const product = await this.getProductById(productId);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    if (product.brand_id !== brandId) {
      throw new Error('No tienes permiso para eliminar este producto');
    }

    // Soft delete: marcar como inactivo
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (error) {
      throw new Error('Error al eliminar el producto: ' + error.message);
    }
  }
}
