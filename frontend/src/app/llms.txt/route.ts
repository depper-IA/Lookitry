import { NextResponse } from 'next/server';

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  const content = `# Lookitry

Lookitry es una plataforma B2B SaaS de Virtual Try-On impulsada por inteligencia artificial, diseñada específicamente para e-commerce de moda y boutiques.

## Estructura del Directorio
- /frontend: Next.js 14 App Router, Tailwind CSS, TypeScript
- /backend: Express.js, TypeScript, PostgreSQL (Supabase)
- /Lookitry_Brain_Vault: Documentación del proyecto

## Páginas Públicas
- /: Landing page
- /planes: Precios
- /blog: Artículos sobre ecommerce y moda
- /sitio/[brand]: Landing page para marcas
- /pruebalo/[brand]: Widget de Virtual Try-On

## Endpoints de API Principales
- POST /api/generations: Generar imagen de Try-On
- GET /api/generations/[id]: Obtener estado de generación
- POST /api/brands: Registrar nueva marca
- GET /api/products: Obtener productos de la marca

## Tech Stack
- Frontend: Next.js 14, React 18, Tailwind CSS 3.4
- Backend: Node.js, Express
- Base de Datos: Supabase (PostgreSQL)
- IA: Vertex AI (Gemini 2.5 Flash Image), n8n como respaldo

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}