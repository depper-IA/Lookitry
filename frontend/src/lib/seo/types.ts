export interface BaseSchema {
  '@context': 'https://schema.org';
  '@type': string;
}

export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface ProductSchema extends BaseSchema {
  '@type': 'Service' | 'Product';
  name: string;
  description: string;
  provider?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface ArticleSchema extends BaseSchema {
  '@type': 'Article';
  headline: string;
  image?: string[];
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': 'Organization' | 'Person';
    name: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
}

export interface BrandPageSchema extends BaseSchema {
  '@type': 'ProfessionalService' | 'Organization';
  name: string;
  image?: string;
  description?: string;
  url: string;
  telephone?: string;
  address?: {
    '@type': 'PostalAddress';
    addressLocality?: string;
    addressCountry?: string;
  };
}

export interface ReviewSchema extends BaseSchema {
  '@type': 'Review';
  reviewRating?: {
    '@type': 'Rating';
    ratingValue: string;
    bestRating: string;
    worstRating?: string;
  };
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewBody?: string;
  datePublished?: string;
}

export interface AggregateRatingSchema extends BaseSchema {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: string;
  bestRating?: string;
  worstRating?: string;
}

export interface SoftwareAppSchema extends BaseSchema {
  '@type': 'SoftwareApplication';
  name: string;
  applicationCategory?: string;
  operatingSystem?: string;
  url?: string;
  description?: string;
  aggregateRating?: AggregateRatingSchema;
  offers?: {
    '@type': 'Offer';
    name?: string;
    price?: string;
    priceCurrency?: string;
    priceValidUntil?: string;
    availability?: string;
    url?: string;
  }[];
}