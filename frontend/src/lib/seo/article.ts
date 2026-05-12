import { ArticleSchema } from './types';

export interface BlogPostData {
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl?: string;
  authorName?: string;
}

export function articleSchema(post: BlogPostData): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.imageUrl ? [post.imageUrl] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.authorName || 'Lookitry'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lookitry',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lookitry.com/logo.png'
      }
    }
  };
}