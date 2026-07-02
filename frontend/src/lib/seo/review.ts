import { ReviewSchema, AggregateRatingSchema } from './types';

export interface ReviewItemReviewed {
  type: 'Product' | 'Service' | 'Organization';
  name: string;
  url?: string;
}

export function reviewSchema(params: {
  reviewerName: string;
  rating: number;
  comment: string;
  date?: string;
  itemReviewed?: ReviewItemReviewed;
}): ReviewSchema {
  const schema: ReviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(params.rating),
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Person',
      name: params.reviewerName,
    },
    reviewBody: params.comment,
    datePublished: params.date ?? new Date().toISOString(),
  };

  if (params.itemReviewed) {
    schema.itemReviewed = {
      '@type': params.itemReviewed.type,
      name: params.itemReviewed.name,
      url: params.itemReviewed.url,
    };
  }

  return schema;
}

export function aggregateRatingSchema(
  totalReviews: number,
  averageRating: number
): AggregateRatingSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: String(averageRating.toFixed(1)),
    reviewCount: String(totalReviews),
    bestRating: '5',
    worstRating: '1',
  };
}