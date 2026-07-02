import { ArticleSchema } from './types';

export interface AuthorRef {
  slug: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface BlogPostData {
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl?: string;
  author?: AuthorRef;
  fallbackAuthorName?: string;
}

const APP_BASE_URL = 'https://lookitry.com';

function buildAuthorSchema(author: AuthorRef | undefined, fallbackName?: string) {
  if (author) {
    const socialUrls = author.socialLinks
      ? Object.values(author.socialLinks).filter((v): v is string => Boolean(v))
      : undefined;

    const schema: ArticleSchema['author'] = {
      '@type': 'Person',
      name: author.name,
      url: `${APP_BASE_URL}/autores/${author.slug}`,
      jobTitle: author.role,
    };

    if (author.avatarUrl) {
      schema.image = author.avatarUrl.startsWith('http')
        ? author.avatarUrl
        : `${APP_BASE_URL}${author.avatarUrl}`;
    }

    if (socialUrls && socialUrls.length > 0) {
      schema.sameAs = socialUrls;
    }

    return schema;
  }

  return {
    '@type': 'Person' as const,
    name: fallbackName || 'Sam Wilkie',
    url: `${APP_BASE_URL}/autores/sam-wilkie`,
  };
}

export function articleSchema(post: BlogPostData): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.imageUrl ? [post.imageUrl] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: buildAuthorSchema(post.author, post.fallbackAuthorName),
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