import { api } from './api';
import type { Product, CreateProductDto, UpdateProductDto, CategoryAttribute } from '@/types';

interface ProductsResponse {
  products: Product[];
  count: number;
  limit: number;
}

const mapProduct = (p: any): Product => ({
  ...p,
  brandId: p.brand_id || p.brandId,
  imageUrl: p.image_url || p.imageUrl,
  externalId: p.external_id || p.externalId,
  shortDescription: p.short_description || p.shortDescription || null,
  description: p.description || null,
  attributes: p.attributes || {},
  isActive: p.is_active ?? p.isActive ?? true,
  createdAt: p.created_at || p.createdAt,
  updatedAt: p.updated_at || p.updatedAt,
});

class ProductsService {
  async getProducts(): Promise<ProductsResponse> {
    const response = await api.get<any>('/products');
    return {
      ...response.data,
      products: response.data.products.map(mapProduct)
    };
  }

  async getProduct(id: string): Promise<Product> {
    const response = await api.get<any>(`/products/${id}`);
    return mapProduct(response.data);
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post<any>('/products', data);
    return mapProduct(response.data);
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.put<any>(`/products/${id}`, data);
    return mapProduct(response.data);
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }

  // Widget Playlist (featured products)
  async getWidgetProducts(): Promise<Product[]> {
    const response = await api.get<any>('/brands/me/widget-products');
    // Backend already filters and orders products by widget_product_ids
    return (response.data.products || []).map(mapProduct);
  }

  async updateWidgetProducts(productIds: string[]): Promise<{ success: boolean; productIds: string[]; removedIds: string[]; message?: string }> {
    const response = await api.put<any>('/brands/me/widget-products', { productIds });
    return response.data;
  }
}

export const productsService = new ProductsService();

// Service para atributos por categoría
class CategoryAttributesService {
  async getAll(): Promise<CategoryAttribute[]> {
    const response = await api.get<any>('/category-attributes');
    return response.data;
  }

  async getByCategory(category: string): Promise<CategoryAttribute | null> {
    try {
      const response = await api.get<any>(`/category-attributes/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async upsert(categoryKey: string, categoryLabel: string, attributes: any[]): Promise<CategoryAttribute> {
    const response = await api.post<any>('/category-attributes', {
      category_key: categoryKey,
      category_label: categoryLabel,
      attributes,
    });
    return response.data;
  }

  async delete(categoryKey: string): Promise<void> {
    await api.delete(`/category-attributes/${encodeURIComponent(categoryKey)}`);
  }
}

export const categoryAttributesService = new CategoryAttributesService();
