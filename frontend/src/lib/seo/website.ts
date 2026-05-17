import { WebSiteSchema } from './types';

export function websiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lookitry',
    url: 'https://lookitry.com',
  };
}