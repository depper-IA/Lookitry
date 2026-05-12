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