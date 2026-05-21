import { ReviewSchema, AggregateRatingSchema } from './types';

export function reviewSchema(params: {
  reviewerName: string;
  rating: number;
  comment: string;
  date?: string;
}): ReviewSchema {
  return {
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