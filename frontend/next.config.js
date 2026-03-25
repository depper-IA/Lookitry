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
            // Frame-ancestors * es necesario para el widget. 
            // Añadimos directivas básicas de seguridad para el contenido del iframe.
            value: "frame-ancestors *; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://minio.wilkiedevs.com https://vkdooutklowctuudjnkl.supabase.co; connect-src 'self' https://api.lookitry.com https://vkdooutklowctuudjnkl.supabase.co; font-src 'self' https://fonts.gstatic.com; media-src 'self'; camera 'self' *; clipboard-write 'self' *;"
          },
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
      // Resto de rutas: Seguridad estándar estricta
      {
        source: '/((?!embed/|marca/|widget.js).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // CSP estricta para el dashboard y la web principal
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://minio.wilkiedevs.com https://vkdooutklowctuudjnkl.supabase.co; connect-src 'self' https://api.lookitry.com https://vkdooutklowctuudjnkl.supabase.co; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://js.wompi.co; object-src 'none';"

          }
        ],
      },
    ];
  },

};

module.exports = nextConfig;
