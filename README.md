<div align="center">
  <img src="https://raw.githubusercontent.com/depper-IA/virtual-tryon/main/frontend/public/logo.svg" alt="Lookitry Logo" width="150"/>

# Lookitry 👕✨

**El Probador Virtual con Inteligencia Artificial para E-Commerce B2B en Latinoamérica**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey?logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![n8n](https://img.shields.io/badge/n8n-Workflows-EA4B71?logo=n8n)](https://n8n.io/)
[![Wompi](https://img.shields.io/badge/Wompi-Pagos%20COP-blue)](#)
[![PayPal](https://img.shields.io/badge/PayPal-Pagos%20USD-00457C?logo=paypal)](https://paypal.com/)

_Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, reduciendo devoluciones y aumentando la conversión. "Pruébalo antes de comprarlo"._

[Ver Demo (Próximamente)](https://lookitry.com) · [Reportar Bug](https://github.com/depper-IA/virtual-tryon/issues) · [Solicitar Feature](https://github.com/depper-IA/virtual-tryon/issues)

</div>

---

## 🚀 Propuesta de Valor

**Lookitry** es una plataforma SaaS B2B diseñada para revolucionar la forma en que se compra ropa, accesorios y calzado en línea. Mediante el uso de Inteligencia Artificial (impulsada por OpenRouter a través de n8n), los clientes finales pueden subir una selfie y visualizar cómo les quedaría un producto específico.

Nuestra solución se integra fácilmente a través de un **widget embebible** (iframe) o una **mini-landing page** personalizada, ideal para marcas en Colombia, México, Argentina, Chile y Perú.

---

## 🛠️ Stack Tecnológico Premium

La arquitectura de Lookitry está construida para ser rápida, escalable y ofrecer una experiencia premium.

### 🎨 Frontend

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Sistema de diseño Dark/Premium)
- **Íconos:** Lucide React (Sin emojis en UI)
- **Despliegue:** VPS vía Docker

### ⚙️ Backend

- **Framework:** Node.js con Express
- **Lenguaje:** TypeScript
- **Autenticación:** Sistema JWT propio, sólido y seguro (No usamos Supabase Auth).
- **Rate Limiting & Seguridad:** Cloudflare Turnstile integrado para antispam.

### 💾 Base de Datos & Almacenamiento

- **Base de Datos:** Supabase (PostgreSQL). Uso estricto de `Service Role` en backend para bypass RLS.
- **Almacenamiento (Storage):** MinIO autohosteado (`minio.wilkiedevs.com`).

### 🤖 IA & Workflows

- **Orquestador:** n8n (`n8n.wilkiedevs.com`)
- **Modelos IA:** OpenRouter (para generación de imágenes y descripción de productos).

### 💳 Pagos

- **Colombia (COP):** Wompi
- **Internacional (USD):** PayPal (Conversión dinámica vía TRM configurable).

---

## ✨ Características Principales

- **🧑‍💻 Probador Virtual B2B:** Generación de imágenes IA de alta calidad donde el usuario ve la ropa aplicada a su cuerpo.
- **🎨 Mini-Landings Personalizables:** Las marcas pueden tener su propia página de prueba con diseños como `classic`, `editorial`, `probador` y `moderno`.
- **📊 Panel Administrativo (Dashboard):** CRUD completo de productos, análisis de uso, estado de suscripción y gestión de facturación.
- **💳 Suscripciones Flexibles:**
  - **TRIAL:** Prueba inicial guiada para captar marcas.
  - **BASIC:** 5 productos activos, 400 generaciones/mes.
  - **PRO:** 15 productos activos, 1200 generaciones/mes.
  - _Sistema de prorrateo automático en upgrades de BASIC a PRO._
- **🤖 Flujos AI (n8n):** Workflows dedicados para el _Try-On_ principal, manejo de errores robusto (Error Handler) y descriptor automático de productos.
- **🛡️ Sistema Anti-Spam:** Cloudflare Turnstile protege el registro y previene abusos del periodo Trial.

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TD;
    A[Cliente / E-commerce] -->|Iframe / Enlace| B(Frontend: Next.js)
    B -->|API Rest / JWT| C(Backend: Express Node.js)
    C <-->|PostgreSQL (Admin Key)| D[(Supabase)]
    C -->|Subida de Imágenes| E[(MinIO Storage)]
    C -->|Webhook Seguro| F(n8n Workflows)
    F <-->|API| G(OpenRouter / Modelos IA)
    F -->|Imágenes Generadas| E
    C <-->|Cobros COP| H(Wompi)
    C <-->|Cobros USD| I(PayPal)
```

_(El flujo exacto y detallado se encuentra en la documentación interna de la IA y `REGLAS_IMPORTANTES.md`)_

---

## 💻 Instalación y Desarrollo Local

### Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- Cuenta de [Supabase](https://supabase.com/) configurada con las tablas base.
- Instancia de [n8n](https://n8n.io/) configurada.
- Instancia de MinIO y servidor SMTP.

### 1. Clonar el repositorio

```bash
git clone https://github.com/depper-IA/virtual-tryon.git
cd virtual-tryon
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` basado en `.env.example` y rellena las variables de entorno (ver sección Variables de Entorno).

```bash
npm run dev
```

La API estará corriendo en `http://localhost:3001`.

### 3. Configurar el Frontend

Abre otra terminal:

```bash
cd frontend
npm install
```

Crea un archivo `.env.local` basado en `.env.example`.

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

_Nota: Nunca expongas la `SUPABASE_SERVICE_KEY` en el frontend._

```env
PORT=3001
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=tu_secreto_jwt
N8N_WEBHOOK_URL=https://n8n.tudominio.com/webhook/tryon
N8N_API_KEY=eyJ...
N8N_BEARER_TOKEN=*********
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=test_events_...
***REMOVED-SECRET***test_integrity_...
WOMPI_ENABLED=true
TURNSTILE_SECRET_KEY=0x4AAAA...
TURNSTILE_ENABLED=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@lookitry.com
SMTP_PASS=********
MINIO_ENDPOINT=https://minio.tudominio.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=TuAccessKey
MINIO_SECRET_KEY=TuSecretKey
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACsmy7e_yL9iyAXM
```

---

## 📚 Documentación de API (Resumen)

| Método | Endpoint                           | Autenticación | Descripción                               |
| ------ | ---------------------------------- | ------------- | ----------------------------------------- |
| `POST` | `/api/auth/register`               | Público       | Registro de marca (Usa Turnstile)         |
| `POST` | `/api/auth/login`                  | Público       | Login y generación de JWT                 |
| `GET`  | `/api/products`                    | JWT           | Listar productos del catálogo de la marca |
| `POST` | `/api/generations`                 | JWT           | Iniciar un Try-On (Envía webhook a n8n)   |
| `GET`  | `/api/pruebalo/:slug`              | Público       | Obtener config pública del widget B2B     |
| `GET`  | `/api/payments/wompi/checkout-url` | Público/JWT   | Generar URL de pago en Wompi (COP)        |
| `POST` | `/api/payments/wompi/webhook`      | HMAC Wompi    | Webhook asíncrono para confirmar pagos    |

_(Consulta los controladores en `backend/src/controllers` para ver todos los endpoints)_

---

## 🚢 Despliegue (Deploy)

Lookitry cuenta con un sistema de despliegue automatizado hacia un VPS (Hostinger) utilizando Docker Compose.

**NUNCA realices un deploy sin autorización explícita.**

Para desplegar desde la raíz del proyecto (requiere Python configurado con las librerías del script):

```bash
# Integrar últimos cambios (Importante)
git pull origin main --rebase
git push origin main

# Desplegar todo (Backend y Frontend)
python scripts/_deploy_now.py --no-cache

# Desplegar solo frontend o backend
python scripts/_deploy_now.py --frontend
python scripts/_deploy_now.py --backend

# Reiniciar servicios sin reconstruir
python scripts/_deploy_now.py --restart
```

---

## 🎨 Reglas de Diseño UI/UX (Brand Guardian)

- **Colores Principales:** `#FF5C3A` (Naranja Lookitry - Acento), `#0a0a0a` (Fondo Base), `#141414` (Fondo Cards).
- **Tipografía:** _Plus Jakarta Sans_ para títulos, _DM Sans_ para el cuerpo del texto.
- **Grises (Textos):** Mínimo `#999` para legibilidad. Prohibido usar grises oscuros como `#333`, `#444`, `#555`.
- **Iconografía:** Uso exclusivo de `lucide-react`. Cero emojis en la interfaz.
- **Logotipo:** Siempre en formato SVG acompañado del texto estilizado `Look<span className="text-[#FF5C3A]">itry</span>`.

---

## 📝 Registro de Cambios y Persistencia de IA

Cualquier agente de IA trabajando en este repositorio **ESTÁ OBLIGADO** a leer el archivo `LOOKITRY_MASTER_MEMORY.md` y `REGLAS_IMPORTANTES.md` al iniciar.
Toda modificación realizada al código debe documentarse en `CHANGELOG_GEMINI.md` antes de finalizar la tarea.

---

<div align="center">
  <p>Construido con ❤️ para revolucionar el comercio electrónico. <br/> <strong>© Lookitry. Todos los derechos reservados.</strong></p>
</div>
