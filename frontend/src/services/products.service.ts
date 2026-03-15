import { api } from './api';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types';

interface ProductsResponse {
  products: Product[];
  count: number;
  limit: number;
}

class ProductsService {
  async getProducts(): Promise<ProductsResponse> {
    const response = await api.get<ProductsResponse>('/products');
    return response.data;
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post<Product>('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
}

export const productsService = new ProductsService();
