/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: { ignoreDuringBuilds: false },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'vkdooutklowctuudjnkl.supabase.co' },
      { protocol: 'https', hostname: 'api.lookitry.com' },
      { protocol: 'https', hostname: 'minio.wilkiedevs.com' },
      { protocol: 'https', hostname: 'lookitry.com' },
      { protocol: 'https', hostname: 'wilkiedevs.com' },
    ],
  },
  async headers() {
    // Definimos la política de seguridad de forma dinámica
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${isProd ? '' : "'unsafe-eval'"} https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://vkdooutklowctuudjnkl.supabase.co https://api.lookitry.com https://minio.wilkiedevs.com https://lookitry.com https://wilkiedevs.com",
      `connect-src 'self' ${isProd ? '' : 'http://localhost:3001'} https://api.lookitry.com https://vkdooutklowctuudjnkl.supabase.co`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://challenges.cloudflare.com https://js.wompi.co",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(embed|marca|pruebalo)/:slug*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *;" },
        ],
      },
      // Script del Widget
      {
        source: '/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // Resto de rutas: Seguridad estándar
      {
        source: '/((?!embed|marca|pruebalo|widget.js|api).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
