import { api } from './api';

export interface ProductUsageStats {
  productId: string;
  productName: string;
  productImageUrl: string;
  category: string;
  totalGenerations: number;
  successfulGenerations: number;
  lastUsed: string;
}

export interface BrandAnalytics {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
  mostUsedProducts: ProductUsageStats[];
  generationsByMonth: {
    month: string;
    count: number;
  }[];
}

export interface GenerationsStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
}

class AnalyticsService {
  async getOverview(): Promise<BrandAnalytics> {
    const response = await api.get<BrandAnalytics>('/analytics/overview');
    return response.data;
  }

  async getGenerationsStats(): Promise<GenerationsStats> {
    const response = await api.get<GenerationsStats>('/analytics/generations');
    return response.data;
  }

  async getMostUsedProducts(limit = 10): Promise<ProductUsageStats[]> {
    const response = await api.get<ProductUsageStats[]>(
      `/analytics/products/most-used?limit=${limit}`
    );
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
