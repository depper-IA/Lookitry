import { OrganizationSchema } from './types';

export function organizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lookitry',
    url: 'https://lookitry.com',
    logo: 'https://lookitry.com/logo.png',
    description: 'Lookitry es una plataforma SaaS B2B de probadores virtuales con IA para tiendas de moda en Latinoamérica. Servicio 100% online, sin sede física. Integración en 10 minutos.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Sam Wilkie',
      url: 'https://lookitry.com/autores/sam-wilkie',
      jobTitle: 'Founder & CTO',
      sameAs: [
        'https://www.linkedin.com/in/samu-wilkie/',
        'https://github.com/depper-IA',
        'https://www.behance.net/samuelwilkie'
      ]
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'info@lookitry.com',
        url: 'https://lookitry.com/contacto',
        availableLanguage: ['Spanish', 'English'],
        areaServed: [
          { '@type': 'Country', name: 'Colombia' },
          { '@type': 'Country', name: 'Venezuela' },
          { '@type': 'Country', name: 'Mexico' },
          { '@type': 'Country', name: 'Argentina' },
          { '@type': 'Country', name: 'Chile' },
          { '@type': 'Country', name: 'Peru' },
          { '@type': 'Country', name: 'Ecuador' },
          { '@type': 'Country', name: 'Brasil' }
        ]
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'ventas@lookitry.com',
        url: 'https://lookitry.com/contacto',
        availableLanguage: ['Spanish', 'English']
      }
    ],
    knowsAbout: [
      'Virtual Try-On',
      'Inteligencia Artificial',
      'Computer Vision',
      'E-commerce de Moda',
      'Fashion Technology',
      'SaaS B2B',
      'Conversión de E-commerce'
    ],
    sameAs: [
      'https://www.instagram.com/lookitry',
      'https://www.tiktok.com/@lookitry',
      'https://www.facebook.com/lookitry'
    ]
  };
}