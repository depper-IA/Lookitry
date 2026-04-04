import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/checkout/',
          '/pago-exitoso/',
          '/trial-payment/',
          '/trial-activado/',
          '/registro-pro/',
          '/onboarding-post-pago/',
          '/auth/',
          '/verify-email/',
          '/embed/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
