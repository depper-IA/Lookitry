/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'vkdooutklowctuudjnkl.supabase.co' },
      { protocol: 'https', hostname: 'api.lookitry.com' },
      { protocol: 'https', hostname: 'minio.wilkiedevs.com' },
    ],
  },
  async headers() {
    return [
      // Rutas del probador (Embed y Marca): Permitir ser embebidas en cualquier dominio
      {
        source: '/(embed|marca)/:slug*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { 
            key: 'Content-Security-Policy', 
            value: "frame-ancestors *; camera 'self' *; clipboard-write 'self' *;" 
          },
          // Eliminamos X-Frame-Options para estas rutas específicas para permitir el embed
        ],
      },
      // Script del Widget: Permitir acceso CORS desde cualquier origen
      {
        source: '/widget.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // Resto de rutas: Seguridad estándar (bloquear iframe)
      {
        source: '/((?!embed/|marca/|widget.js).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
