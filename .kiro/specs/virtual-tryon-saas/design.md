# Design Document - Virtual Try-On SaaS

## Overview

Sistema SaaS B2B de probador virtual de ropa mediante IA. Arquitectura fullstack con React (frontend), Node.js/Express (backend), PostgreSQL (base de datos) e integración con n8n para procesamiento de IA.

**Stack Técnico Recomendado:**

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
  - Razón: SSR para SEO, rutas dinámicas para /pruebalo/:slug, API routes para BFF, soporte nativo para widgets/embed
- **Backend**: Express + TypeScript + Supabase Client
  - Razón: Simplicidad, ecosistema maduro, fácil integración con n8n, Supabase para type-safety y auth
- **Base de Datos**: Supabase (PostgreSQL)
  - URL: https://vkdooutklowctuudjnkl.supabase.co
  - Razón: PostgreSQL gestionado, auth integrado, real-time, APIs auto-generadas
- **Autenticación**: Supabase Auth (JWT + bcrypt integrado)
- **Storage**: n8n + WordPress Hosting (Hostinger)
  - Razón: Reutiliza infraestructura existente, sin costos adicionales de cloud storage
- **Integración IA**: n8n (https://n8n.wilkiedevs.com) → OpenRouter (Gemini 2.5 Flash Image)

## Architecture

### Arquitectura General

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Next.js App   │────────▶│  Express API     │────────▶│ PostgreSQL  │
│  (Dashboard +   │  REST   │  (Node.js +      │         │             │
│   Try-On Page)  │         │   TypeScript)    │         └─────────────┘
└─────────────────┘         └──────────────────┘
        │                            │
        │                            │
        ▼                            ▼
┌─────────────────┐         ┌──────────────────┐
│  Widget Embed   │         │   n8n Workflow   │
│  (iframe/script)│         │   (AI Try-On)    │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  OpenRouter API  │
                            │  (AI Generation) │
                            └──────────────────┘
```

### Flujo de Generación de Try-On

1. End_User sube selfie en frontend (/pruebalo/:brandSlug)
2. Frontend envía POST /api/pruebalo/:brandSlug/generate con imagen + productId
3. Backend valida límites de plan de la marca
4. Backend convierte imagen a base64 y la envía directamente a n8n
5. n8n workflow:
   - Recibe imagen base64 + productId + prompt
   - Sube imagen temporal a WordPress (Hostinger) vía endpoint /wp-json/n8n/v1/upload
   - Llama a OpenRouter con Gemini 2.5 Flash Image
   - Recibe imagen generada en base64
   - Sube resultado a WordPress (permanente)
   - Borra imagen temporal
   - Retorna: { success: true, imageUrl: "https://..." }
6. Backend guarda registro de generación en Supabase
7. Backend retorna imageUrl al frontend
8. Frontend muestra imagen generada con opción de descarga

## Components and Interfaces

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── env.ts               # Variables de entorno
│   │   └── plans.ts             # Definición de planes
│   ├── middleware/
│   │   ├── auth.ts              # Validación JWT (Supabase)
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── errorHandler.ts     # Manejo global de errores
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── brands/
│   │   │   ├── brands.controller.ts
│   │   │   ├── brands.service.ts
│   │   │   └── brands.routes.ts
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.routes.ts
│   │   ├── tryon/
│   │   │   ├── tryon.controller.ts
│   │   │   ├── tryon.service.ts
│   │   │   ├── tryon.routes.ts
│   │   │   └── n8n.client.ts    # Cliente para n8n
│   │   └── usage/
│   │       ├── usage.service.ts
│   │       └── usage.middleware.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── imageUtils.ts        # Conversión base64
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Layout con nav
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── usage/
│   │   │       └── page.tsx
│   │   ├── pruebalo/
│   │   │   └── [brandSlug]/
│   │   │       └── page.tsx     # Probador público
│   │   ├── embed/
│   │   │   └── [brandSlug]/
│   │   │       └── page.tsx     # Versión widget
│   │   ├── api/                 # API routes (proxy)
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── dashboard/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── UsageStats.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── tryon/
│   │   │   ├── TryOnWidget.tsx  # Componente principal
│   │   │   ├── SelfieUploader.tsx
│   │   │   ├── ProductSelector.tsx
│   │   │   ├── GenerationLoader.tsx
│   │   │   └── ResultDisplay.tsx
│   │   └── ui/                  # Componentes reutilizables
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── Spinner.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTryOn.ts
│   │   └── useProducts.ts
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── auth.service.ts
│   │   ├── products.service.ts
│   │   └── tryon.service.ts
│   ├── types/
│   │   └── index.ts
│   └── lib/
│       └── utils.ts
├── public/
├── package.json
└── tsconfig.json
```

## Data Models

### Supabase Schema (SQL)

```sql
-- Crear tipos enum
CREATE TYPE plan_type AS ENUM ('BASIC', 'PRO');
CREATE TYPE generation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- Tabla brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan plan_type DEFAULT 'BASIC',
  
  -- Configuración visual
  logo TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para brands
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_email ON brands(email);

-- Tabla products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para products
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active);

-- Tabla generations
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  selfie_url TEXT NOT NULL,
  result_image_url TEXT,
  status generation_status DEFAULT 'PENDING',
  error_message TEXT,
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  processing_time INTEGER
);

-- Índices para generations
CREATE INDEX idx_generations_brand_id ON generations(brand_id);
CREATE INDEX idx_generations_brand_date ON generations(brand_id, generated_at);
CREATE INDEX idx_generations_status ON generations(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (las marcas solo ven sus propios datos)
CREATE POLICY "Brands can view own data" ON brands
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Brands can update own data" ON brands
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Products viewable by brand" ON products
  FOR SELECT USING (brand_id::text = auth.uid()::text);

CREATE POLICY "Products manageable by brand" ON products
  FOR ALL USING (brand_id::text = auth.uid()::text);

CREATE POLICY "Generations viewable by brand" ON generations
  FOR SELECT USING (brand_id::text = auth.uid()::text);
```

### TypeScript Interfaces

```typescript
// Planes
export interface Plan {
  type: 'BASIC' | 'PRO';
  maxProducts: number;
  maxGenerationsPerMonth: number;
  price: number; // Para futuro
}

export const PLANS: Record<string, Plan> = {
  BASIC: {
    type: 'BASIC',
    maxProducts: 5,
    maxGenerationsPerMonth: 400,
    price: 0
  },
  PRO: {
    type: 'PRO',
    maxProducts: 15,
    maxGenerationsPerMonth: 1200,
    price: 0
  }
};

// DTOs
export interface RegisterBrandDto {
  email: string;
  password: string;
  name: string;
  slug: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
}

export interface GenerateTryOnDto {
  productId: string;
  selfieFile: File; // En frontend
}

export interface N8nWebhookPayload {
  brandId: string;
  productId: string;
  selfieBase64: string;  // Imagen en base64
  productImageUrl: string;
  prompt: string;  // Prompt para Gemini
}

export interface N8nWebhookResponse {
  success: boolean;
  imageUrl?: string;  // URL de WordPress donde se guardó
  error?: string;
}

// Responses
export interface AuthResponse {
  token: string;
  brand: {
    id: string;
    email: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export interface UsageStats {
  currentMonth: {
    generationsUsed: number;
    generationsLimit: number;
    productsCount: number;
    productsLimit: number;
  };
  percentageUsed: number;
}

export interface TryOnConfigResponse {
  brand: {
    name: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  products: Array<{
    id: string;
    name: string;
    imageUrl: string;
    category: string;
  }>;
}
```

## API Endpoints

### Authentication

```
POST /api/auth/register
Request:
{
  "email": "marca@example.com",
  "password": "securepass123",
  "name": "Mi Marca",
  "slug": "mi-marca"
}
Response: 201
{
  "token": "eyJhbGc...",
  "brand": {
    "id": "uuid",
    "email": "marca@example.com",
    "name": "Mi Marca",
    "slug": "mi-marca",
    "plan": "BASIC"
  }
}

POST /api/auth/login
Request:
{
  "email": "marca@example.com",
  "password": "securepass123"
}
Response: 200
{
  "token": "eyJhbGc...",
  "brand": { ... }
}
```

### Brands (Protected)

```
GET /api/brands/me
Headers: Authorization: Bearer {token}
Response: 200
{
  "id": "uuid",
  "email": "marca@example.com",
  "name": "Mi Marca",
  "slug": "mi-marca",
  "plan": "BASIC",
  "logo": "https://...",
  "primaryColor": "#FF5733",
  "secondaryColor": "#FFFFFF"
}

PATCH /api/brands/me
Headers: Authorization: Bearer {token}
Request:
{
  "name": "Nuevo Nombre",
  "logo": "https://...",
  "primaryColor": "#FF5733"
}
Response: 200
{ ...updatedBrand }
```

### Products (Protected)

```
GET /api/products
Headers: Authorization: Bearer {token}
Response: 200
{
  "products": [
    {
      "id": "uuid",
      "name": "Camiseta Logo",
      "description": "Camiseta con logo frontal",
      "imageUrl": "https://...",
      "category": "tshirt",
      "isActive": true
    }
  ],
  "count": 3,
  "limit": 5
}

POST /api/products
Headers: Authorization: Bearer {token}
Request:
{
  "name": "Hoodie Premium",
  "description": "Hoodie con capucha",
  "imageUrl": "https://...",
  "category": "hoodie"
}
Response: 201
{ ...newProduct }

PUT /api/products/:id
PATCH /api/products/:id
DELETE /api/products/:id
```

### Usage (Protected)

```
GET /api/usage/stats
Headers: Authorization: Bearer {token}
Response: 200
{
  "currentMonth": {
    "generationsUsed": 45,
    "generationsLimit": 400,
    "productsCount": 3,
    "productsLimit": 5
  },
  "percentageUsed": 11.25,
  "resetDate": "2026-04-01T00:00:00Z"
}
```

### Try-On (Public)

```
GET /api/tryon/:brandSlug
Response: 200
{
  "brand": {
    "name": "Mi Marca",
    "logo": "https://...",
    "primaryColor": "#FF5733",
    "secondaryColor": "#FFFFFF"
  },
  "products": [
    {
      "id": "uuid",
      "name": "Camiseta Logo",
      "imageUrl": "https://...",
      "category": "tshirt"
    }
  ]
}

POST /api/pruebalo/:brandSlug/generate
Content-Type: multipart/form-data
Request:
{
  "productId": "uuid",
  "selfie": <File>
}
Response: 200
{
  "success": true,
  "generationId": "uuid",
  "imageUrl": "https://result-image.jpg",
  "processingTime": 8500
}

Error Response: 429
{
  "error": "LIMIT_EXCEEDED",
  "message": "Has excedido el límite de 400 generaciones mensuales",
  "usage": {
    "used": 400,
    "limit": 400
  }
}
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe cumplirse en todas las ejecuciones válidas del sistema, esencialmente una declaración formal sobre lo que el sistema debe hacer.*

### Property 1: Límite de productos por plan

*Para cualquier* marca con plan BASIC, el número de productos activos debe ser menor o igual a 5; para plan PRO, menor o igual a 15.

**Validates: Requirements 2.1, 2.2, 3.2**

### Property 2: Límite de generaciones mensuales

*Para cualquier* marca, el número de generaciones exitosas en el mes actual debe ser menor o igual al límite de su plan (400 para BASIC, 1200 para PRO).

**Validates: Requirements 2.3, 2.4, 6.6**

### Property 3: Unicidad de slug

*Para cualquier* par de marcas diferentes, sus slugs deben ser distintos.

**Validates: Requirements 1.5**

### Property 4: Autenticación de recursos

*Para cualquier* operación protegida sobre un recurso (producto, configuración), la marca autenticada debe ser la propietaria de ese recurso.

**Validates: Requirements 9.5**

### Property 5: Validación de archivos

*Para cualquier* archivo subido como selfie, debe cumplir: tipo en [JPG, PNG, WEBP] y tamaño ≤ 5MB.

**Validates: Requirements 10.1, 10.2, 10.5**

### Property 6: Incremento de contador

*Para cualquier* generación exitosa, el contador de uso de la marca debe incrementarse exactamente en 1.

**Validates: Requirements 6.6, 8.1**

### Property 7: Reset mensual de contadores

*Para cualquier* marca, al inicio de cada mes el contador de generaciones debe resetearse a 0.

**Validates: Requirements 2.5**

### Property 8: Integridad de generaciones

*Para cualquier* generación registrada, debe existir una marca y un producto válidos asociados.

**Validates: Requirements 8.1, 8.2**

## Error Handling

### Estrategias de Manejo de Errores

1. **Errores de Validación (400)**
   - Datos de entrada inválidos
   - Formato de archivo incorrecto
   - Campos requeridos faltantes

2. **Errores de Autenticación (401)**
   - Token JWT inválido o expirado
   - Credenciales incorrectas

3. **Errores de Autorización (403)**
   - Acceso a recursos de otra marca
   - Operación no permitida por plan

4. **Errores de Límites (429)**
   - Límite de productos excedido
   - Límite de generaciones mensuales excedido
   - Rate limiting

5. **Errores de Integración n8n (502/504)**
   - Timeout de n8n (>60s)
   - Error en procesamiento de IA
   - Webhook no disponible
   - **Estrategia**: Reintentos con backoff exponencial (máx 3 intentos)

6. **Errores de Storage (503)**
   - Fallo al subir imagen a S3/Cloudinary
   - **Estrategia**: Reintento inmediato, luego fallar

### Formato de Error Estándar

```typescript
interface ErrorResponse {
  error: string;           // Código de error
  message: string;         // Mensaje legible
  details?: any;           // Detalles adicionales
  timestamp: string;
}
```

## Testing Strategy

### Enfoque Dual de Testing

El sistema utilizará tanto **unit tests** como **property-based tests** para cobertura completa:

- **Unit tests**: Casos específicos, edge cases, errores conocidos
- **Property tests**: Validación de propiedades universales con datos aleatorios

### Property-Based Testing

**Framework**: fast-check (para TypeScript/Node.js)

**Configuración**: Mínimo 100 iteraciones por propiedad

**Formato de Tags**:
```typescript
// Feature: virtual-tryon-saas, Property 1: Límite de productos por plan
```

### Casos de Prueba Principales

**Unit Tests**:
- Autenticación: login exitoso, credenciales inválidas, token expirado
- CRUD productos: crear, editar, eliminar, validaciones
- Generación try-on: flujo completo exitoso, timeout n8n, límite excedido
- Upload: archivo válido, archivo muy grande, tipo incorrecto

**Property Tests**:
- Property 1: Verificar límites de productos para planes aleatorios
- Property 2: Verificar límites de generaciones con contadores aleatorios
- Property 3: Generar múltiples marcas y verificar unicidad de slugs
- Property 5: Generar archivos aleatorios y validar restricciones
- Property 6: Simular generaciones y verificar incrementos de contador

**Integration Tests**:
- Flujo completo: registro → crear producto → generar try-on
- Widget embed: comunicación postMessage
- n8n mock: simular respuestas exitosas y errores

### Estrategias para Problemas Conocidos

**Problema 1: Archivos grandes y timeouts**
- Solución: Validación de tamaño en frontend antes de subir
- Compresión de imágenes en cliente (max 1920px)
- Timeout de 60s en llamadas a n8n
- Feedback de progreso al usuario

**Problema 2: Procesamiento IA lento**
- Solución: Implementar sistema de colas (opcional para v2)
- Por ahora: Spinner con mensaje "Esto puede tomar 30-60 segundos"
- Considerar WebSockets para notificaciones en tiempo real (v2)

**Problema 3: Concurrencia en contadores**
- Solución: Transacciones de base de datos
- Incremento atómico con Prisma: `increment: { generationsUsed: 1 }`

**Problema 4: Almacenamiento temporal de selfies**
- Solución: URLs pre-firmadas de S3 con expiración de 1 hora
- Limpieza automática de archivos temporales (cron job)

## Implementation Notes

### Orden de Implementación Recomendado

1. Setup inicial: Prisma + Express + Next.js
2. Autenticación: JWT + bcrypt
3. CRUD Brands y Products
4. Sistema de límites y usage tracking
5. Integración n8n (mock inicial)
6. Try-on público
7. Widget embebible
8. Tests y refinamiento

### Variables de Entorno

```env
# Backend
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=***REMOVED-SECRET***
SUPABASE_SERVICE_KEY=<service_role_key>  # Para operaciones admin
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/<webhook-id>
N8N_API_KEY=***REMOVED-SECRET***
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=***REMOVED-SECRET***
```

### Consideraciones de Seguridad

- CORS configurado para dominios específicos
- Rate limiting: 100 req/15min por IP en endpoints públicos
- Sanitización de inputs (slug, colores hex)
- Validación de tipos MIME reales (no solo extensión)
- Headers de seguridad: helmet.js
- HTTPS obligatorio en producción


## Code Examples

### Backend: Try-On Generation Endpoint

```typescript
// src/modules/tryon/tryon.controller.ts
import { Request, Response } from 'express';
import { TryOnService } from './tryon.service';
import { UsageService } from '../usage/usage.service';
import { BrandsService } from '../brands/brands.service';

export class TryOnController {
  constructor(
    private tryOnService: TryOnService,
    private usageService: UsageService,
    private brandsService: BrandsService
  ) {}

  async generateTryOn(req: Request, res: Response) {
    try {
      const { brandSlug } = req.params;
      const { productId } = req.body;
      const selfieFile = req.file; // Multer

      // 1. Validar marca existe
      const brand = await this.brandsService.findBySlug(brandSlug);
      if (!brand) {
        return res.status(404).json({
          error: 'BRAND_NOT_FOUND',
          message: 'Marca no encontrada'
        });
      }

      // 2. Validar producto existe y pertenece a la marca
      const product = await this.tryOnService.findProduct(productId);
      if (!product || product.brand_id !== brand.id) {
        return res.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message: 'Producto no encontrado'
        });
      }

      // 3. Verificar límites de plan
      const canGenerate = await this.usageService.checkGenerationLimit(brand.id);
      if (!canGenerate) {
        const usage = await this.usageService.getUsageStats(brand.id);
        return res.status(429).json({
          error: 'LIMIT_EXCEEDED',
          message: `Has excedido el límite de ${usage.currentMonth.generationsLimit} generaciones mensuales`,
          usage: {
            used: usage.currentMonth.generationsUsed,
            limit: usage.currentMonth.generationsLimit
          }
        });
      }

      // 4. Validar archivo
      if (!selfieFile) {
        return res.status(400).json({
          error: 'MISSING_FILE',
          message: 'Debes subir una selfie'
        });
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selfieFile.mimetype)) {
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Solo se permiten archivos JPG, PNG o WEBP'
        });
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selfieFile.size > maxSize) {
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'El archivo no debe superar 5MB'
        });
      }

      // 5. Convertir imagen a base64
      const selfieBase64 = selfieFile.buffer.toString('base64');

      // 6. Crear registro de generación (estado PENDING) en Supabase
      const generation = await this.tryOnService.createGeneration({
        brand_id: brand.id,
        product_id: product.id,
        selfie_url: 'pending', // Se actualizará después
        status: 'PENDING'
      });

      // 7. Llamar a n8n
      const startTime = Date.now();
      try {
        const prompt = `Create a photorealistic image showing the person wearing ${product.name}. Maintain perfect human anatomy and natural proportions.`;
        
        const n8nResult = await this.tryOnService.callN8nWebhook({
          brandId: brand.id,
          productId: product.id,
          selfieBase64,
          productImageUrl: product.image_url,
          prompt
        });

        if (!n8nResult.success || !n8nResult.imageUrl) {
          throw new Error(n8nResult.error || 'Error desconocido en generación');
        }

        const processingTime = Date.now() - startTime;

        // 8. Actualizar generación con resultado en Supabase
        await this.tryOnService.updateGeneration(generation.id, {
          status: 'SUCCESS',
          result_image_url: n8nResult.imageUrl,
          selfie_url: n8nResult.imageUrl, // n8n ya subió la selfie
          processing_time: processingTime
        });

        // 9. Retornar resultado (el contador se calcula dinámicamente)
        return res.status(200).json({
          success: true,
          generationId: generation.id,
          imageUrl: n8nResult.imageUrl,
          processingTime
        });

      } catch (n8nError: any) {
        // Error en n8n
        await this.tryOnService.updateGeneration(generation.id, {
          status: 'FAILED',
          error_message: n8nError.message
        });

        return res.status(502).json({
          error: 'GENERATION_FAILED',
          message: 'Error al generar la imagen. Por favor intenta de nuevo.',
          details: process.env.NODE_ENV === 'development' ? n8nError.message : undefined
        });
      }

    } catch (error) {
      console.error('Error in generateTryOn:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      });
    }
  }

  async getConfig(req: Request, res: Response) {
    try {
      const { brandSlug } = req.params;

      const brand = await this.brandsService.findBySlug(brandSlug);
      if (!brand) {
        return res.status(404).json({
          error: 'BRAND_NOT_FOUND',
          message: 'Marca no encontrada'
        });
      }

      const products = await this.tryOnService.getActiveProducts(brand.id);

      return res.status(200).json({
        brand: {
          name: brand.name,
          logo: brand.logo,
          primaryColor: brand.primary_color,
          secondaryColor: brand.secondary_color
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          imageUrl: p.image_url,
          category: p.category
        }))
      });

    } catch (error) {
      console.error('Error in getConfig:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor'
      });
    }
  }
}
```

```typescript
// src/modules/tryon/n8n.client.ts
import axios from 'axios';
import { N8nWebhookPayload, N8nWebhookResponse } from '../../types';

export class N8nClient {
  private webhookUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL!;
    this.apiKey = process.env.N8N_API_KEY!;
    this.timeout = 90000; // 90 segundos (Gemini puede tardar)
  }

  async callTryOnWebhook(payload: N8nWebhookPayload): Promise<N8nWebhookResponse> {
    try {
      const response = await axios.post<N8nWebhookResponse>(
        this.webhookUrl,
        {
          brand_id: payload.brandId,
          product_id: payload.productId,
          selfie_base64: payload.selfieBase64,
          product_image_url: payload.productImageUrl,
          prompt: payload.prompt
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Timeout: La generación tardó más de 90 segundos');
        }
        if (error.response) {
          throw new Error(`n8n error: ${error.response.data?.error || error.message}`);
        }
      }
      throw new Error(`Error al conectar con n8n: ${error.message}`);
    }
  }
}
```

```typescript
// src/modules/usage/usage.service.ts
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '../../config/plans';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key para operaciones admin
);

export class UsageService {
  async checkGenerationLimit(brandId: string): Promise<boolean> {
    const { data: brand } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) return false;

    const plan = PLANS[brand.plan];
    const currentMonth = this.getCurrentMonthRange();

    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    return (count || 0) < plan.maxGenerationsPerMonth;
  }

  async getUsageStats(brandId: string) {
    const { data: brand } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) throw new Error('Brand not found');

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    const plan = PLANS[brand.plan];
    const currentMonth = this.getCurrentMonthRange();

    const { count: generationsUsed } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    return {
      currentMonth: {
        generationsUsed: generationsUsed || 0,
        generationsLimit: plan.maxGenerationsPerMonth,
        productsCount: productsCount || 0,
        productsLimit: plan.maxProducts
      },
      percentageUsed: ((generationsUsed || 0) / plan.maxGenerationsPerMonth) * 100,
      resetDate: this.getNextMonthStart()
    };
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  private getNextMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}
```

### Frontend: Try-On Widget Component

```typescript
// src/components/tryon/TryOnWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { SelfieUploader } from './SelfieUploader';
import { ProductSelector } from './ProductSelector';
import { GenerationLoader } from './GenerationLoader';
import { ResultDisplay } from './ResultDisplay';
import { tryonService } from '@/services/tryon.service';
import type { TryOnConfigResponse, Product } from '@/types';

interface TryOnWidgetProps {
  brandSlug: string;
  isEmbed?: boolean;
}

type Step = 'upload' | 'select' | 'generating' | 'result';

export function TryOnWidget({ brandSlug, isEmbed = false }: TryOnWidgetProps) {
  const [step, setStep] = useState<Step>('upload');
  const [config, setConfig] = useState<TryOnConfigResponse | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar configuración de la marca
  useEffect(() => {
    loadConfig();
  }, [brandSlug]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await tryonService.getConfig(brandSlug);
      setConfig(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfieUpload = (file: File, preview: string) => {
    setSelfieFile(file);
    setSelfiePreview(preview);
    setStep('select');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleGenerate = async () => {
    if (!selfieFile || !selectedProduct) return;

    try {
      setStep('generating');
      setError(null);

      const result = await tryonService.generate(brandSlug, {
        productId: selectedProduct.id,
        selfieFile
      });

      setResultImageUrl(result.imageUrl);
      setStep('result');

      // Notificar a página padre si es embed
      if (isEmbed && window.parent) {
        window.parent.postMessage({
          type: 'TRYON_COMPLETE',
          data: {
            imageUrl: result.imageUrl,
            productId: selectedProduct.id
          }
        }, '*');
      }

    } catch (err: any) {
      setError(err.message || 'Error al generar la imagen');
      setStep('select');
    }
  };

  const handleReset = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    setSelectedProduct(null);
    setResultImageUrl(null);
    setError(null);
    setStep('upload');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error || 'No se pudo cargar la configuración'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor: config.brand.secondaryColor,
        color: config.brand.primaryColor
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {config.brand.logo && (
            <img
              src={config.brand.logo}
              alt={config.brand.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold">{config.brand.name}</h1>
          <p className="text-lg mt-2">Probador Virtual</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Steps */}
        {step === 'upload' && (
          <SelfieUploader onUpload={handleSelfieUpload} />
        )}

        {step === 'select' && (
          <div>
            {selfiePreview && (
              <div className="mb-6 text-center">
                <img
                  src={selfiePreview}
                  alt="Tu selfie"
                  className="max-w-xs mx-auto rounded-lg shadow-lg"
                />
                <button
                  onClick={handleReset}
                  className="mt-2 text-sm underline"
                >
                  Cambiar foto
                </button>
              </div>
            )}

            <ProductSelector
              products={config.products}
              selectedProduct={selectedProduct}
              onSelect={handleProductSelect}
              primaryColor={config.brand.primaryColor}
            />

            {selectedProduct && (
              <div className="text-center mt-6">
                <button
                  onClick={handleGenerate}
                  className="px-8 py-3 rounded-lg font-semibold text-white text-lg"
                  style={{ backgroundColor: config.brand.primaryColor }}
                >
                  Probar {selectedProduct.name}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'generating' && (
          <GenerationLoader productName={selectedProduct?.name || ''} />
        )}

        {step === 'result' && resultImageUrl && (
          <ResultDisplay
            imageUrl={resultImageUrl}
            productName={selectedProduct?.name || ''}
            onReset={handleReset}
            primaryColor={config.brand.primaryColor}
          />
        )}
      </div>
    </div>
  );
}
```

```typescript
// src/components/tryon/SelfieUploader.tsx
'use client';

import { useState, useRef } from 'react';

interface SelfieUploaderProps {
  onUpload: (file: File, preview: string) => void;
}

export function SelfieUploader({ onUpload }: SelfieUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo no debe superar 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onUpload(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 text-lg font-medium">Sube tu selfie</p>
        <p className="mt-2 text-sm text-gray-500">
          Arrastra una imagen o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-gray-400">
          JPG, PNG o WEBP (máx. 5MB)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
      />
    </div>
  );
}
```

```typescript
// src/services/tryon.service.ts
import axios from 'axios';
import type { TryOnConfigResponse, GenerateTryOnDto } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class TryOnService {
  async getConfig(brandSlug: string): Promise<TryOnConfigResponse> {
    try {
      const response = await axios.get(`${API_URL}/pruebalo/${brandSlug}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Marca no encontrada');
      }
      throw new Error('Error al cargar la configuración');
    }
  }

  async generate(brandSlug: string, data: GenerateTryOnDto) {
    try {
      const formData = new FormData();
      formData.append('productId', data.productId);
      formData.append('selfie', data.selfieFile);

      const response = await axios.post(
        `${API_URL}/pruebalo/${brandSlug}/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 95000 // 95 segundos (más que el backend)
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error(error.response.data.message || 'Límite de generaciones excedido');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('La generación está tardando demasiado. Por favor intenta de nuevo.');
      }
      throw new Error(error.response?.data?.message || 'Error al generar la imagen');
    }
  }
}

export const tryonService = new TryOnService();
```

### Widget Embed Code

```html
<!-- Código que se proporciona a las marcas para embeber -->
<div id="pruebalo-widget-container"></div>
<script>
  (function() {
    const brandSlug = 'mi-marca'; // Dinámico por marca
    const iframe = document.createElement('iframe');
    iframe.src = `https://pruebalo.mi-dominio.com/embed/${brandSlug}`;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    // Escuchar mensajes del iframe
    window.addEventListener('message', function(event) {
      if (event.data.type === 'PRUEBALO_COMPLETE') {
        console.log('Prueba virtual completada:', event.data.data);
        // La marca puede hacer algo con el resultado
        // Por ejemplo, agregar al carrito, mostrar modal, etc.
      }
    });
    
    document.getElementById('pruebalo-widget-container').appendChild(iframe);
  })();
</script>
```
