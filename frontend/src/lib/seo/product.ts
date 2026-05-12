import { ProductSchema } from './types';

export function productSchema(): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Lookitry AI Virtual Try-On',
    description: 'Virtual Try-On AI para tiendas de moda. Permite a tus clientes probarse la ropa virtualmente.',
    provider: {
      '@type': 'Organization',
      name: 'Lookitry'
    }
  };
}