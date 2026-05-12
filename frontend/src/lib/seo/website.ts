import { WebSiteSchema } from './types';

export function websiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lookitry',
    url: 'https://lookitry.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://lookitry.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
}