import { api } from './api';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types';

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
}

export const productsService = new ProductsService();
