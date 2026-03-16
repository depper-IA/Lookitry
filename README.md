# LinkiTry

Plataforma SaaS B2B que permite a marcas ofrecer a sus clientes un probador virtual de ropa mediante selfies e IA.

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** Next.js 14 + TailwindCSS
- **Base de datos:** Supabase (PostgreSQL)
- **IA:** n8n + OpenRouter

## Requisitos

- Node.js 18+
- Cuenta de Supabase
- Instancia de n8n configurada

## Instalación

```bash
git clone <repository-url>
cd virtual-tryon-saas
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # Completar variables de entorno
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local   # Completar variables de entorno
npm run dev
```

La app estará disponible en `http://localhost:3000` y la API en `http://localhost:3001`.

## Variables de Entorno

**Backend (`.env`):**
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
N8N_WEBHOOK_URL=
N8N_API_KEY=
PORT=3001
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Funcionalidades

- Registro y login de marcas con JWT
- CRUD de productos
- Probador virtual público por marca (`/pruebalo/:slug`)
- Widget embebible via iframe
- Dashboard con analytics
- Planes Básico (5 productos, 400 gen/mes) y Pro (15 productos, 1.200 gen/mes)

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de marca |
| POST | `/api/auth/login` | Login de marca |
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/pruebalo/:slug` | Configuración pública de marca |
| POST | `/api/pruebalo/:slug/generate` | Generar try-on |
| GET | `/api/analytics/overview` | Analytics de la marca |

## Licencia

[Especificar licencia]
