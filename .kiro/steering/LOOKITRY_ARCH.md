# Lookitry — Arquitectura Técnica Completa

> Documento de referencia para retomar el proyecto sin leer archivos individuales.
> Actualizado: 2026-04-27 (Sesión de actualización de repositorio)

---

## Protocolo de Arranque

**Ver protocolo completo en**: `Lookitry_Brain_Vault/Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md`

**Secuencia obligatoria:**
1. `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` (siempre)
2. `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md` (siempre)
3. `memory/YYYY-MM-DD.md` (cuando disponible)
4. `MEMORY.md` (solo sesión principal con Travis)

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia) y PayPal (Internacional) |
| IA / Try-On | Vertex AI (Gemini 2.5 Flash Image), n8n como respaldo |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger e integración con Brevo API |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/tools/_deploy_now.py` + GitHub |

---

## URLs del Sistema

| Servicio | URL |
|----------|-----|
| Frontend prod | `https://lookitry.com` |
| API prod | `https://api.lookitry.com` |
| n8n | `https://n8n.wilkiedevs.com` |
| MinIO | `https://minio.wilkiedevs.com` |
| Supabase | `https://vkdooutklowctuudjnkl.supabase.co` |
| Frontend local | `http://localhost:3000` |
| Backend local | `http://localhost:3001` |

---

## Estructura de Directorios

```
Lookitry/
├── frontend/                    # Next.js 14
│   ├── src/app/                 # App Router — páginas y API routes
│   ├── src/components/          # Componentes reutilizables (dashboard, tryon, etc.)
│   ├── src/services/            # Clientes HTTP (api.ts, subscription.service.ts)
│   └── src/types/               # TypeScript types
├── backend/                     # Express API
│   ├── src/controllers/         # Lógica de negocio (modularizada en admin/, etc.)
│   ├── src/routes/              # Definición de rutas (auth, brands, admin, etc.)
│   ├── src/middleware/          # Auth, admin, rate limiting
│   ├── src/services/            # Servicios externos (n8n, MinIO, email, Brevo)
│   └── src/jobs/                # Cron jobs
├── scripts/                     # Deploy y utilidades de diagnóstico
├── sammy/                       # Agente IA (experimental/en desarrollo)
└── .kiro/steering/              # Documentación del proyecto (Este archivo)
```

---

## Base de Datos — Tablas Supabase (Principales y Nuevas)

### Núcleo de Negocio
*   `brands`: Marcas/clientes (SaaS). Campos: `plan`, `subscription_status`, `slug`, `logo`, etc.
*   `products`: Catálogo de productos por marca.
*   `generations`: Historial de pruebas virtuales generadas.
*   `subscription_payments`: Historial de pagos (Wompi/PayPal).
*   `pricing_config`: Configuración dinámica de precios y límites.

### Administración y Operaciones (Nuevas)
*   `leads`: Gestión de prospectos (Lead Generation).
*   `lead_searches`: Búsquedas de leads (Google Places integration).
*   `email_campaigns`: Campañas de marketing vía Brevo.
*   `admin_support_tickets`: Sistema de tickets para soporte a marcas.
*   `referrals`: Programa de referidos y bonificaciones.
*   `widget_ip_whitelist`: Control de acceso por IP al widget.
*   `admin_audit_log`: Registro de acciones administrativas críticas.

### Contenido y Conocimiento
*   `blogs` / `blog_topics`: Sistema de gestión de contenidos (CMS).
*   `project_knowledge`: Base de conocimiento RAG para agentes IA.
*   `generation_feedback`: Feedback de calidad de las imágenes generadas.

---

## Backend — Rutas API Destacadas

### Admin (`/api/admin/*`)
*   `GET /stats`: Métricas globales y de conversión.
*   `GET /leads`: CRM de prospectos.
*   `GET /tickets`: Gestión de soporte técnico.
*   `GET /email-campaigns`: Marketing automation.
*   `GET /feedback`: Revisión de calidad de generaciones.
*   `GET /widget-ip-whitelist`: Seguridad del widget.

### Brands & Try-On
*   `/api/auth/*`: Registro, login y verificación.
*   `/api/generations/*`: Creación y consulta de try-ons.
*   `/api/pruebalo/:slug`: Acceso público al widget de marca.

---

## Reglas de Negocio Clave

1.  **Prorrateo de Upgrades**: Implementado en `SubscriptionService`. Calcula el crédito del tiempo restante del plan actual y lo descuenta del nuevo plan.
2.  **Límites por Plan**:
    *   **BASIC**: 5 productos activos, 400 generaciones/mes.
    *   **PRO**: 15 productos activos, 1200 generaciones/mes.
3.  **Seguridad**:
    *   Account lockout (5 intentos fallidos = 15 min bloqueo).
    *   JWT con TTL de 7 días.
    *   Turnstile obligatorio en registro y login.

---

## Deployment
*   **VPS**: `31.220.18.39` (Root access).
*   **Método**: `python scripts/tools/_deploy_now.py`. Este script sincroniza con GitHub, reconstruye contenedores afectados (backend/frontend) y gestiona una pantalla de mantenimiento automática durante el proceso.

---

## MCPs Disponibles (opencode.json)

Configurados en `C:\Users\Matt\Lookitry\opencode.json`.

| MCP | Descripción | Comando |
|-----|-------------|---------|
| `sequentialthinking` | Razonamiento paso a paso | `@modelcontextprotocol/server-sequential-thinking` |
| `telegram` | Bot Telegram (chat_id: 1049458877) | `.opencode/mcp-servers/telegram-mcp/src/index.ts` |
| `n8n` | API n8n — gestión de workflows | `.opencode/mcp-servers/n8n-mcp-server/src/index.ts` |
| `hostinger-mcp` | API Hostinger VPS | `hostinger-api-mcp` |
| `context7` | Documentación técnica actualizada | `@upstash/context7-mcp` |
| `memory` | Memoria persistente SQLite | `@pepk/mcp-memory-sqlite` |
| `obsidian` | Vault Obsidian (Lookitry) | `@zethictech/obsidian-mcp` |

### Credenciales MCP

| MCP | Variable | Valor |
|-----|----------|-------|
| Telegram | `TELEGRAM_BOT_TOKEN` | `[ver backend/.env o opencode.json local]` |
| Telegram | `TELEGRAM_CHAT_ID` | `1049458877` |
| n8n | `N8N_BASE_URL` | `https://n8n.wilkiedevs.com` |
| n8n | `N8N_API_KEY` | `[ver backend/.env o opencode.json local]` |
| Hostinger | `API_TOKEN` | `[ver backend/.env o opencode.json local]` |
| Context7 | `CONTEXT7_API_KEY` | `[ver backend/.env o opencode.json local]` |
| Obsidian | `OBSIDIAN_VAULT` | `Lookitry` |

### Modelos AI (opencode.json)

| Proveedor | Modelo | API Key |
|-----------|--------|---------|
| MiniMax (default) | `MiniMax-M2.7` | `[ver opencode.json local]` |
| Groq (small) | `llama-3.3-70b-versatile` | `[ver opencode.json local]` |
| Google Vertex | Gemini models | project `gen-lang-client-0591001769` |

### Agentes OpenCode

| Agente | Rol |
|--------|-----|
| `sammy` | Orquestador principal |
| `webwizard` | Frontend y UX |
| `devguardian` | Calidad y Seguridad (write: deny) |
| `dataalchemist` | Base de datos, IA y n8n |
| `growthpilot` | CRM, Marketing y Leads |
| `architectai` | Infraestructura y DevOps |
| `docs-writter` | Documentación (bash: deny) |

### n8n Workflows Clave

| Función | Webhook | ID |
|---------|---------|-----|
| Try-On | `/webhook/tryon` | `wPLypk7KhBcFLicX` |
| Descriptor | `/webhook/descriptor` | `ZjVTV3QxoPEi60GX` |
| Error handling | automático | `PNri7NdZYkZhpPnm` |
| WhatsApp Lookitry | `/webhook/ycloud-lookitry` | (ver n8n dashboard) |
