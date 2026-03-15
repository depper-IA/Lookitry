import { api } from './api';
import type { UsageStats } from '@/types';

class UsageService {
  async getUsageStats(): Promise<UsageStats> {
    const response = await api.get<UsageStats>('/usage/stats');
    return response.data;
  }
}

export const usageService = new UsageService();
