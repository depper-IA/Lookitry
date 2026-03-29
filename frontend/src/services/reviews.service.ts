import { api } from './api';
import type {
  AdminReview,
  AdminReviewsResponse,
  CreateReviewDto,
  ModerateReviewDto,
  MyReview,
  PublicReviewsResponse,
} from '@/types';

class ReviewsService {
  async createReview(payload: CreateReviewDto): Promise<MyReview> {
    const response = await api.post<MyReview>('/reviews', payload);
    return response.data;
  }

  async getMyReview(): Promise<MyReview | null> {
    const response = await api.get<MyReview | null>('/reviews/me');
    return response.data;
  }

  async markPrompted(): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/reviews/mark-prompted');
    return response.data;
  }

  async getPublicReviews(): Promise<PublicReviewsResponse> {
    const response = await api.get<PublicReviewsResponse>('/reviews/public');
    return response.data;
  }

  async getAdminReviews(params: URLSearchParams): Promise<AdminReviewsResponse> {
    const response = await api.get<AdminReviewsResponse>(`/admin/reviews?${params.toString()}`);
    return response.data;
  }

  async moderateReview(reviewId: string, payload: ModerateReviewDto): Promise<AdminReview> {
    const response = await api.patch<AdminReview>(`/admin/reviews/${reviewId}`, payload);
    return response.data;
  }

  async deleteReview(reviewId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/admin/reviews/${reviewId}`);
    return response.data;
  }
}

export const reviewsService = new ReviewsService();
