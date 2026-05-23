/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  compiler: isProd ? {
    removeConsole: false,
  } : undefined,
  async redirects() {
    return [];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80, 85, 90, 95],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'vkdooutklowctuudjnkl.supabase.co' },
      { protocol: 'https', hostname: 'api.lookitry.com' },
      { protocol: 'https', hostname: 'minio.wilkiedevs.com' },
      { protocol: 'https', hostname: 'lookitry.com' },
      { protocol: 'https', hostname: 'wilkiedevs.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Turnstile necesita 'unsafe-eval'. Facebook Pixel carga desde connect.facebook.net
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://checkout.wompi.co https://accounts.google.com https://www.google.com https://apis.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://www.youtube.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      // Facebook Pixel noscript img + pixel de tracking
      "img-src 'self' data: blob: https: http:",
      `connect-src 'self' ${isProd ? '' : 'http://localhost:3001 http://100.85.125.102:3001'} https://*.lookitry.com https://*.supabase.co https://*.wilkiedevs.com https://minio.wilkiedevs.com https://checkout.wompi.co https://accounts.google.com https://www.googleapis.com https://www.google.com https://challenges.cloudflare.com https://www.google-analytics.com https://analytics.google.com https://freeipapi.com https://ipapi.co https://www.facebook.com https://connect.facebook.net`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://challenges.cloudflare.com https://js.wompi.co https://checkout.wompi.co https://accounts.google.com https://www.google.com https://www.facebook.com https://www.youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(embed|marca|pruebalo)/:slug*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/((?!embed|marca|pruebalo|widget.js|api).*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;