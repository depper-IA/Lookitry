import { BrandPageSchema } from './types';

export interface BrandData {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  city?: string;
  country?: string;
  phone?: string;
}

export function brandPageSchema(brand: BrandData): BrandPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: brand.name,
    image: brand.logo || undefined,
    description: brand.description || `Página oficial de ${brand.name} en Lookitry.`,
    url: `https://lookitry.com/sitio/${brand.slug}`,
    telephone: brand.phone || undefined,
    address: brand.city || brand.country ? {
      '@type': 'PostalAddress',
      addressLocality: brand.city || undefined,
      addressCountry: brand.country || undefined,
    } : undefined
  };
}