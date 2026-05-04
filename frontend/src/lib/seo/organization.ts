import { OrganizationSchema } from './types';

export function organizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lookitry',
    url: 'https://lookitry.com',
    logo: 'https://lookitry.com/logo.png',
    sameAs: [
      'https://www.instagram.com/lookitry',
      'https://www.tiktok.com/@lookitry',
      'https://www.facebook.com/lookitry'
    ]
  };
}