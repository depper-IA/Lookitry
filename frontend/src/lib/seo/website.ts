import { WebSiteSchema } from './types';

export function websiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lookitry',
    url: 'https://lookitry.com',
    description: 'Plataforma SaaS B2B de probadores virtuales con Inteligencia Artificial para tiendas de moda en Latinoamérica.',
    inLanguage: ['es-ES', 'es-MX', 'es-CO', 'es-VE', 'es-AR', 'es-CL', 'es-PE'],
    publisher: {
      '@type': 'Organization',
      name: 'Lookitry'
    }
  };
}