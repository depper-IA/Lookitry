import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/auth/',
        '/mission-control/',
        '/onboarding-',
        '/trial-',
        '/activar-',
        '/pago-',
        '/checkout/',
        '/pago-exitoso/',
        '/trial-payment/',
        '/trial-activado/',
        '/registro-pro/',
        '/onboarding-post-pago/',
        '/verify-email/',
        '/embed/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
