# Virtual Try-On SaaS

Sistema SaaS B2B de probador virtual de ropa mediante IA. Permite a marcas ofrecer a sus clientes finales la experiencia de "probarse" productos virtualmente mediante selfies y generación de imágenes con IA.

## 🚀 Características

- **Autenticación de Marcas**: Sistema de registro y login con JWT
- **Gestión de Productos**: CRUD completo de productos con imágenes
- **Sistema de Planes**: Planes Básico y Pro con límites configurables
- **Probador Virtual Público**: Interfaz pública para que los clientes finales prueben productos
- **Generación con IA**: Integración con n8n y OpenRouter (Gemini 2.5 Flash Image)
- **Widget Embebible**: Código iframe para integrar en sitios web externos
- **Analytics**: Estadísticas de uso y productos más populares
- **Personalización**: Configuración de colores y logo por marca

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (PostgreSQL)
- Workflow de n8n configurado para generación de imágenes
- Hosting para almacenar imágenes (WordPress/Hostinger recomendado)

## 🏗️ Estructura del Proyecto

```
Mostrador_wilkiedevs/
├── backend/                    # API REST con Express + TypeScript
│   ├── src/
│   │   ├── config/            # Configuración (Supabase, planes)
│   │   ├── controllers/       # Controladores de rutas
│   │   ├── middleware/        # Auth, rate limiting, error handling
│   │   ├── routes/            # Definición de rutas
│   │   ├── services/          # Lógica de negocio
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilidades (JWT, etc.)
│   │   ├── scripts/           # Scripts de testing
│   │   └── app.ts             # Configuración de Express
│   ├── .env                   # Variables de entorno (no incluido)
│   └── package.json
│
├── frontend/                   # Next.js 14 + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── app/               # App Router de Next.js
│   │   │   ├── dashboard/     # Dashboard de marca
│   │   │   ├── pruebalo/      # Probador público
│   │   │   ├── embed/         # Widget embebible
│   │   │   ├── login/         # Autenticación
│   │   │   └── register/      # Registro
│   │   ├── components/        # Componentes React
│   │   │   ├── dashboard/     # Componentes del dashboard
│   │   │   ├── tryon/         # Componentes del probador
│   │   │   └── ui/            # Componentes UI reutilizables
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Servicios API
│   │   └── types/             # Tipos TypeScript
│   ├── .env.local             # Variables de entorno (no incluido)
│   └── package.json
│
└── .kiro/                      # Especificaciones del proyecto
    └── specs/
        └── virtual-tryon-saas/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## ⚙️ Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd Mostrador_wilkiedevs
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend/`:

```env
# Supabase
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_KEY=tu_supabase_service_key

# JWT
JWT_SECRET=tu_secret_key_muy_seguro
JWT_EXPIRES_IN=7d

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tu-webhook-id
N8N_API_KEY=tu_n8n_api_key

# Server
PORT=3001
NODE_ENV=development
```

### 3. Configurar Base de Datos

#### 3.1 Crear Tablas Principales

Ejecutar el siguiente SQL en Supabase para crear las tablas:

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
  logo TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Tabla generations
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  result_image_url TEXT,
  status generation_status DEFAULT 'PENDING',
  error_message TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  processing_time INTEGER
);

-- Índices
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_email ON brands(email);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_brand_active ON products(brand_id, is_active);
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
```

#### 3.2 Crear Tabla de Administradores

```sql
-- Tabla admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Trigger para updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.3 Crear Administrador WilkieDevs

Después de crear las tablas, ejecuta:

```bash
cd backend
npx ts-node src/scripts/create-wilkiedevs-admin.ts
```

Esto creará el administrador con las credenciales:
- **Email:** info.samwilkie@gmail.com
- **Nombre:** WilkieDevs
- **Contraseña:** Travis2305*

Ver `QUICK_ADMIN_SETUP.md` para más detalles.

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env.local` en la carpeta `frontend/`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (para cliente)
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## 🚀 Ejecución en Desarrollo

### Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Testing

### Verificar n8n

Antes de usar el sistema, verifica que n8n esté configurado correctamente:

```bash
cd backend
npx ts-node src/scripts/verify-n8n.ts
```

Este script verificará:
- ✅ Variables de entorno (N8N_WEBHOOK_URL, N8N_API_KEY)
- ✅ Conexión con el webhook
- ✅ Respuesta del workflow
- ✅ Tiempo de respuesta

### Backend

```bash
cd backend

# Compilar TypeScript
npm run build

# Ejecutar tests
npm test

# Test de conexión a Supabase
npx ts-node src/scripts/test-supabase-connection.ts

# Test de cliente n8n
npx ts-node src/scripts/test-n8n-client.ts

# Test de analytics
npx ts-node src/scripts/test-analytics.ts
```

### Frontend

```bash
cd frontend

# Compilar para producción
npm run build

# Ejecutar en modo producción
npm start
```

## 📚 API Endpoints

### Autenticación de Marcas

- `POST /api/auth/register` - Registrar nueva marca
- `POST /api/auth/login` - Iniciar sesión

### Autenticación de Administrador

- `POST /api/admin/auth/login` - Login de administrador

### Administrador (Protegido)

- `GET /api/admin/stats` - Estadísticas globales del sistema
- `GET /api/admin/brands` - Listar todas las marcas con estadísticas
- `PATCH /api/admin/brands/:id/plan` - Cambiar plan de una marca

### Marcas (Protegido)

- `GET /api/brands/me` - Obtener datos de marca autenticada
- `PATCH /api/brands/me` - Actualizar configuración de marca

### Productos (Protegido)

- `GET /api/products` - Listar productos de la marca
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto (soft delete)

### Uso (Protegido)

- `GET /api/usage/stats` - Obtener estadísticas de uso

### Analytics (Protegido)

- `GET /api/analytics/overview` - Analytics completos
- `GET /api/analytics/generations` - Estadísticas de generaciones
- `GET /api/analytics/products/most-used` - Productos más usados

### Probador Virtual (Público)

- `GET /api/pruebalo/:brandSlug` - Obtener configuración de marca
- `POST /api/pruebalo/:brandSlug/generate` - Generar try-on

## 🎨 Configuración de Planes

Los planes se configuran en `backend/src/config/plans.ts`:

```typescript
export const PLANS = {
  BASIC: {
    type: 'BASIC',
    maxProducts: 5,
    maxGenerationsPerMonth: 400,
  },
  PRO: {
    type: 'PRO',
    maxProducts: 15,
    maxGenerationsPerMonth: 1200,
  },
};
```

## 🔧 Configuración de n8n

El workflow de n8n debe:

1. Recibir webhook con:
   - `brandId`: ID de la marca
   - `productId`: ID del producto
   - `selfieBase64`: Imagen selfie en base64
   - `productImageUrl`: URL de imagen del producto
   - `prompt`: Prompt para la IA

2. Procesar:
   - Subir selfie temporal a WordPress
   - Llamar a OpenRouter con Gemini 2.5 Flash Image
   - Subir resultado a WordPress (permanente)
   - Eliminar selfie temporal

3. Retornar:
   ```json
   {
     "success": true,
     "imageUrl": "https://..."
   }
   ```

## 🌐 Widget Embebible

Para embeber el probador en un sitio web externo:

```html
<div id="pruebalo-widget-container"></div>
<script>
  (function() {
    const brandSlug = 'tu-marca'; // Reemplazar con tu slug
    const iframe = document.createElement('iframe');
    iframe.src = `https://tu-dominio.com/embed/${brandSlug}`;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    
    // Escuchar eventos del widget
    window.addEventListener('message', function(event) {
      if (event.data.type === 'TRYON_COMPLETE') {
        console.log('Try-on completado:', event.data.data);
        // Manejar resultado (ej: agregar al carrito)
      }
    });
    
    document.getElementById('pruebalo-widget-container').appendChild(iframe);
  })();
</script>
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT con expiración de 7 días
- Rate limiting: 100 requests por 15 minutos
- Validación de tipos de archivo y tamaño (máx 5MB)
- Row Level Security (RLS) en Supabase
- CORS configurado para dominios específicos

## 📊 Límites por Plan

| Característica | Plan Básico | Plan Pro |
|----------------|-------------|----------|
| Productos | 5 | 15 |
| Generaciones/mes | 400 | 1,200 |
| Precio | Gratis | TBD |

## 🐛 Troubleshooting

### Error de conexión a Supabase

Verificar que las credenciales en `.env` sean correctas:

```bash
cd backend
npx ts-node src/scripts/test-supabase-connection.ts
```

### Error de timeout en generaciones

El timeout está configurado a 90 segundos. Si las generaciones tardan más:

1. Verificar que el workflow de n8n esté funcionando
2. Revisar logs de n8n para errores
3. Considerar optimizar el prompt o modelo de IA

### Imágenes no se cargan

Verificar que:

1. Las URLs de imágenes sean accesibles públicamente
2. CORS esté configurado en el servidor de imágenes
3. Las imágenes no excedan 5MB

## 📝 Licencia

[Especificar licencia]

## 👥 Contribución

[Instrucciones de contribución]

## 🚀 Deployment

### Scripts de Build

#### Backend

```bash
cd backend

# Build de producción (incluye lint y tests)
npm run build:prod

# Build simple (solo compilación)
npm run build

# Iniciar en producción
npm run start:prod
```

#### Frontend

```bash
cd frontend

# Build de producción (incluye lint)
npm run build:prod

# Build simple
npm run build

# Iniciar en producción
npm run start:prod
```

### Variables de Entorno de Producción

#### Backend

Copiar `backend/.env.production` a `backend/.env` y configurar:

- `SUPABASE_SERVICE_KEY`: Obtener desde Supabase Dashboard → Settings → API
- `JWT_SECRET`: Generar con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `N8N_WEBHOOK_URL`: URL del webhook de n8n
- `CORS_ORIGIN`: Dominios permitidos (ej: `https://tu-dominio.com`)

#### Frontend

Copiar `frontend/.env.production` a `frontend/.env.production` y configurar:

- `NEXT_PUBLIC_API_URL`: URL del backend en producción (ej: `https://api.tu-dominio.com`)

### Guía Completa de Deployment

Ver `DEPLOYMENT_GUIDE.md` para instrucciones detalladas de deployment en:

- VPS/Servidor Dedicado (con PM2 y Nginx)
- Vercel (Frontend) + Railway/Render (Backend)
- Docker (Containerizado)

Incluye:
- Configuración de SSL con Let's Encrypt
- Configuración de PM2 para gestión de procesos
- Configuración de Nginx como reverse proxy
- Troubleshooting y mantenimiento

## Configuración DNS y SSL en Hostinger

### 1. Apuntar el dominio al servidor

En el panel de Hostinger, ir a **Dominios → DNS Zone** y configurar:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` | IP del servidor VPS |
| A | `api` | IP del servidor VPS |
| CNAME | `www` | `tu-dominio.com` |

- `tu-dominio.com` → Frontend (Next.js, puerto 3000)
- `api.tu-dominio.com` → Backend (Express, puerto 3001)

Los cambios DNS pueden tardar hasta 24 horas en propagarse.

### 2. Activar SSL (HTTPS)

Hostinger incluye SSL gratuito con Let's Encrypt. Activarlo desde:

**Panel de Hostinger → SSL → Instalar SSL gratuito**

Si usas VPS con acceso SSH, también puedes usar Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com -d api.tu-dominio.com -d www.tu-dominio.com
# Renovación automática (ya configurada por certbot)
sudo certbot renew --dry-run
```

### 3. Configurar CORS para producción

En el archivo `backend/.env` del servidor, agregar:

```env
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
```

La variable `CORS_ORIGIN` acepta múltiples dominios separados por coma. El backend los incluirá automáticamente en la lista de orígenes permitidos.

### 4. Verificar la configuración

```bash
# Verificar que el backend responde por HTTPS
curl https://api.tu-dominio.com/health

# Verificar que el frontend carga
curl -I https://tu-dominio.com
```

---

## 📧 Contacto

[Información de contacto]
