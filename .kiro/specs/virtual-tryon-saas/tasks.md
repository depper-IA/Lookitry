# Implementation Plan: Virtual Try-On SaaS — Tareas Pendientes

> Las tareas completadas (1–34) están documentadas en `tasks-completed.md`.

---

## En progreso / Pendientes

- [x] 34.4 Deploy del backend en VPS
- [x] 34.5 Deploy del frontend en VPS
- [x] 34.6 Configurar dominio y HTTPS

---

- [ ] 35. Sistema de marketing — CRM + campañas email + prospección
  - [ ] 35.1 Crear tabla `crm_leads` en Supabase
    - Migración SQL: `backend/migrations/create_crm_leads_table.sql`
    - Columnas: id, nombre_empresa, nombre_marca, nombre_contacto, email, telefono, nicho, ciudad, direccion, redes_sociales, sitio_web, campana_enviada, fecha_campana, estado_lead, ultimo_contacto, notas, fuente, crm_ref, created_at
    - Índices en email (unique), nicho, estado_lead, campana_enviada, ciudad
    - RLS: solo acceso desde service_role (admin)
    - _Archivos: backend/migrations/create_crm_leads_table.sql_

  - [ ] 35.2 Script de importación del Excel base al CRM
    - Script Python `scripts/_import_crm.py` que lee `templates-webs/BASE_CLIENTES_CRM.xlsx` (4.153 contactos)
    - Mapea columnas del Excel a la tabla `crm_leads`
    - Genera `crm_ref` único: `REF-{ID}-{slug_empresa}`
    - Deduplicación por email antes de insertar
    - Reporte final: insertados / duplicados / errores
    - _Archivos: scripts/_import_crm.py_

  - [ ] 35.2b Enriquecimiento de nicho con IA (flujo n8n)
    - Crear workflow `flujo3_enriquecimiento_nicho` en n8n
    - Paso 1: keywords en nombre_empresa/nombre_marca → `nicho = 'MODA_CONFIRMADO'`
    - Paso 2: scraping de sitio_web → busca keywords → `nicho = 'MODA_WEB'`
    - Paso 3: clasificación con Groq API (llama3-8b, 14.400 req/día gratuito) → `nicho = 'MODA_IA'` o `estado_lead = 'NO_APLICA'`
    - Cron: una vez completo + semanal sobre leads nuevos sin nicho
    - Variables n8n requeridas: `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

  - [ ] 35.3 Crear API de CRM en backend
    - `GET /api/admin/crm/leads` — listar con filtros (nicho, estado_lead, ciudad, búsqueda). Paginación 50/página
    - `GET /api/admin/crm/leads/:id` — detalle de lead
    - `PATCH /api/admin/crm/leads/:id` — actualizar estado/notas
    - `POST /api/admin/crm/leads` — agregar lead manual
    - `DELETE /api/admin/crm/leads/:id` — eliminar lead
    - `GET /api/admin/crm/stats` — totales por estado_lead, ciudades top
    - `POST /api/admin/crm/campaign/launch` — disparar webhook n8n con filtros
    - _Archivos: backend/src/controllers/crm.controller.ts, backend/src/routes/crm.routes.ts_

  - [ ] 35.4 Vincular CRM con tabla `brands` (tracking UTM)
    - Agregar columna `crm_ref` a tabla `brands` (migración SQL)
    - Al registrarse con `?ref=REF-xxx`, guardar `crm_ref` en brands
    - En `auth.service.ts`: si viene `crm_ref`, actualizar lead → `estado_lead='REGISTRADO'`
    - Endpoint `GET /api/admin/crm/conversions` — marcas registradas con crm_ref
    - _Archivos: auth.service.ts, crm.controller.ts_

  - [ ] 35.5 Configurar Brevo como proveedor de email masivo
    - Crear cuenta en brevo.com (plan gratuito: 300 emails/día)
    - Agregar `BREVO_API_KEY` y `BREVO_TEMPLATE_ID` a variables de entorno
    - Crear template HTML en Brevo con variables: `{{nombre_contacto}}`, `{{nombre_empresa}}`, `{{crm_ref}}`
    - Documentar en CONTEXT.md
    - _Archivos: backend/.env, CONTEXT.md_

  - [ ] 35.6 Workflow n8n — Campaña de email masivo (Flujo 1)
    - Importar `templates-webs/flujo1_campana_email_masivo.json` en n8n
    - Webhook recibe filtros → consulta crm_leads → loop → envía email via Brevo → actualiza estado
    - Solo enviar a leads con `estado_lead != 'NO_APLICA'` y nicho definido
    - Registrar ID del workflow en CONTEXT.md

  - [ ] 35.7 Workflow n8n — Prospección automática Google Maps (Flujo 2)
    - Importar `templates-webs/flujo2_prospeccion_colombia.json` en n8n
    - Cron lunes 8am → Apify Google Maps Scraper → filtra duplicados → inserta en crm_leads
    - Variables requeridas: `APIFY_API_TOKEN`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`, `BREVO_API_KEY`
    - Registrar ID del workflow en CONTEXT.md

  - [ ] 35.8 Página admin `/admin/marketing` — Vista CRM
    - Tabla de leads con filtros: estado_lead, ciudad, campana_enviada, fuente, búsqueda texto
    - Paginación 50/página
    - Botón "Agregar lead" → modal con formulario
    - Click en fila → panel lateral con detalle + editar notas + cambiar estado
    - Contador en header: total / enviados / registrados
    - _Archivos: frontend/src/app/admin/marketing/page.tsx_

  - [ ] 35.9 Página admin `/admin/marketing` — Vista Campañas
    - Filtros de segmentación + preview de cuántos contactos aplican
    - Botón "Enviar campaña" → llama `POST /api/admin/crm/campaign/launch`
    - Progreso en tiempo real (polling cada 3s)
    - Historial de campañas: fecha, filtros, enviados, errores
    - Estadísticas: emails enviados hoy/semana/total, leads por estado (gráfico dona)

  - [ ] 35.10 Página admin `/admin/marketing` — Vista Prospección
    - Toggle activar/pausar workflow de Google Maps (via n8n API)
    - Log de últimos 20 leads encontrados automáticamente
    - Botón "Ejecutar ahora" → dispara workflow manualmente
    - Estadísticas: leads nuevos esta semana por fuente

  - [ ] 35.11 Agregar link "Marketing" al sidebar del admin
    - Icono: lucide-react `Megaphone`
    - Ruta: `/admin/marketing`
    - Badge con contador de leads nuevos sin contactar
    - _Archivos: frontend/src/app/admin/layout.tsx o sidebar component_

---

- [ ] 36. Sistema de cola de generaciones (BullMQ + Redis)
  - [ ] 36.1 Instalar dependencias y configurar Redis
    - Instalar `bullmq` y `ioredis` en el backend
    - Agregar `REDIS_URL` a variables de entorno (`.env` y `.env.example`)
    - Crear `backend/src/config/redis.ts` con instancia de `IORedis`
    - _Archivos: backend/package.json, backend/src/config/redis.ts_

  - [ ] 36.2 Crear la cola y el worker de generaciones
    - Crear `backend/src/queues/generation.queue.ts`: instancia de `Queue` con nombre `generation`
    - Crear `backend/src/workers/generation.worker.ts`: `Worker` con concurrency configurable (`WORKER_CONCURRENCY`, default 3)
    - El worker ejecuta la lógica actual de `pruebalo.controller.ts` (llamada a n8n, actualización de BD)
    - Si el job falla, actualizar `generations.status = 'FAILED'` en Supabase
    - _Archivos: backend/src/queues/generation.queue.ts, backend/src/workers/generation.worker.ts_

  - [ ] 36.3 Modificar endpoint de generación para encolar
    - En `pruebalo.controller.ts`, reemplazar llamada directa a n8n por `generationQueue.add(jobData)`
    - Retornar inmediatamente `{ job_id, status: 'queued' }` con HTTP 202
    - Guardar `job_id` en la fila de `generations` para polling
    - _Archivos: backend/src/controllers/pruebalo.controller.ts_

  - [ ] 36.4 Crear endpoint de polling de estado
    - `GET /api/pruebalo/:brandSlug/generation/:jobId` — público, sin auth
    - Consulta estado del job en BullMQ (`queue.getJob(jobId)`)
    - Retorna `{ status: 'queued' | 'processing' | 'completed' | 'failed', imageUrl?, error? }`
    - _Archivos: backend/src/controllers/pruebalo.controller.ts, backend/src/routes/pruebalo.routes.ts_

  - [ ] 36.5 Actualizar frontend para flujo asíncrono
    - En `TryOnWidget`, después de enviar la generación recibir `job_id`
    - Polling cada 3 segundos a `GET /api/pruebalo/:slug/generation/:jobId`
    - Mostrar estados: "En cola...", "Generando...", "Listo" o "Error"
    - Timeout de polling a los 3 minutos con mensaje de error claro
    - _Archivos: frontend/src/components/TryOnWidget.tsx (o equivalente)_

  - [ ] 36.6 Iniciar el worker junto con el servidor
    - En `backend/src/index.ts`, importar y arrancar el worker al iniciar la app
    - Logging de jobs procesados, fallidos y tiempo de procesamiento
    - _Archivos: backend/src/index.ts_

---

---

- [x] 37. Rebrand: renombrar proyecto de "VirtualTryOn" a "Lookitry"
  - [x] 37.1 Actualizar nombre visible en nav y footer de la landing (`page.tsx`)
    - Nav: `Virtual<span>Try</span>On` → `Look<span>itry</span>`
    - Footer: mismo cambio
    - Mantener paleta corporativa `#FF5C3A` / `#0a0a0a` / `#f5f2ee`
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 37.2 Actualizar metadata del sitio
    - `layout.tsx` title: `'Virtual Try-On — ...'` → `'Lookitry — Probador virtual con IA para tu marca'`
    - _Archivos: frontend/src/app/layout.tsx_

  - [x] 37.3 Actualizar nombre en página de planes
    - Buscar y reemplazar referencias de marca en `planes/page.tsx`
    - _Archivos: frontend/src/app/planes/page.tsx_

  - [x] 37.4 Actualizar nombre en dashboard (sidebar, header, SuspensionModal, ProUpgradeBanner)
    - Buscar referencias al nombre del proyecto en componentes del dashboard
    - _Archivos: frontend/src/components/dashboard/DashboardLayout.tsx, SuspensionModal.tsx, ProUpgradeBanner.tsx_

  - [x] 37.5 Actualizar nombre en páginas de auth (login, register, pago-exitoso, registro-pro)
    - _Archivos: frontend/src/app/login/page.tsx, register/page.tsx, pago-exitoso/page.tsx, registro-pro/page.tsx_

  - [x] 37.6 Actualizar nombre en MiniLanding (footer del widget público)
    - Línea: `Probador virtual impulsado por Pruebalo` → `Probador virtual impulsado por Lookitry`
    - _Archivos: frontend/src/components/mini-landing/MiniLanding.tsx_

---

- [x] 38. Sección FAQ en landing pública
  - [x] 38.1 Crear componente `FaqSection` en React con paleta corporativa
    - Paleta: fondo `#0a0a0a`, acento `#FF5C3A`, texto `#f4f4f5` / `#71717a`
    - Tabs: Mini-Landing / Pagos / Generaciones / Probador IA
    - Acordeón con animación CSS (max-height transition)
    - Iconos SVG inline (sin emojis en UI)
    - CTA final con botón WhatsApp y correo
    - _Archivos: frontend/src/components/landing/FaqSection.tsx_

  - [x] 38.2 Insertar `FaqSection` en `page.tsx` después de la sección mini-landing y antes de testimonios
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 38.3 Verificar consistencia de datos del FAQ con la lógica real del sistema
    - Generaciones Plan Básico: 400/mes — verificar en `usage.service.ts` y `plans.config.ts`
    - Generaciones Plan Pro: 1.200/mes — ídem
    - Descuentos: 5% (3m) / 10% (6m) / 15% (12m) — verificar en `checkout/page.tsx`
    - Precio Básico: $150.000 COP — verificar en landing y checkout
    - Precio Pro: $250.000 COP — ídem
    - _Archivos: backend/src/config/plans.ts, frontend/src/app/checkout/page.tsx_

---

- [x] 39. Sistema de suspensión y eliminación de mini-landing por falta de pago
  - [x] 39.1 Agregar campo `landing_suspended_at` a tabla `brands` (migración SQL)
    - Columna: `landing_suspended_at TIMESTAMPTZ nullable`
    - Se setea cuando la suscripción vence y la marca tiene `has_landing_page = true`
    - _Archivos: backend/migrations/add_landing_suspension.sql_

  - [x] 39.2 Lógica de suspensión automática en job diario
    - En `cleanup.job.ts` o job de suscripciones: si `subscription_status = 'suspended'` y `has_landing_page = true` y `landing_suspended_at` es null → setear `landing_suspended_at = now()`
    - La mini-landing deja de ser accesible públicamente (ruta `/sitio/[brandSlug]` retorna 404 o página de suspensión)
    - _Archivos: backend/src/jobs/cleanup.job.ts, frontend/src/app/sitio/[brandSlug]/page.tsx_

  - [x] 39.3 Lógica de eliminación definitiva tras 3 meses
    - En job diario: si `landing_suspended_at` tiene más de 90 días → setear `has_landing_page = false`, `landing_suspended_at = null`, eliminar productos de MinIO si aplica
    - Enviar email de aviso al cliente antes de la eliminación (a los 75 días: aviso, a los 90: eliminación)
    - _Archivos: backend/src/jobs/cleanup.job.ts, backend/src/services/notification.service.ts_

  - [x] 39.4 Lógica de reactivación: restaurar mini-landing al renovar suscripción
    - Al renovar suscripción (`subscription_status → 'active'`): si `landing_suspended_at` tiene menos de 90 días → setear `has_landing_page = true`, `landing_suspended_at = null`
    - _Archivos: backend/src/services/subscription.service.ts_

  - [x] 39.5 Página pública de mini-landing suspendida
    - Si `has_landing_page = false` o `landing_suspended_at` activo → mostrar página de "Esta tienda está temporalmente inactiva" con CTA de contacto
    - _Archivos: frontend/src/app/sitio/[brandSlug]/page.tsx_

  - [x] 39.6 Indicador en dashboard de marca cuando la mini-landing está suspendida
    - Banner de aviso en `/dashboard/mi-pagina` si `landing_suspended_at` está activo
    - Mostrar días restantes antes de eliminación definitiva
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx_

---

- [x] 40. UX, SEO y rendimiento — Landing pública (Lookitry)

  - [x] 40.1 SEO técnico: metadata dinámica y structured data en `layout.tsx` y `page.tsx`
    - Convertir `page.tsx` de `'use client'` a Server Component (mover lógica de precio a `generateMetadata` o un Server Component wrapper)
    - Agregar `openGraph`, `twitter`, `canonical`, `robots` y `keywords` en `metadata` de `layout.tsx`
    - Agregar JSON-LD `Organization` + `WebSite` + `SoftwareApplication` en `page.tsx` via `<script type="application/ld+json">`
    - Agregar `sitemap.xml` estático en `frontend/src/app/sitemap.ts` con las rutas públicas
    - Agregar `robots.txt` en `frontend/src/app/robots.ts`
    - _Archivos: frontend/src/app/layout.tsx, frontend/src/app/page.tsx, frontend/src/app/sitemap.ts, frontend/src/app/robots.ts_

  - [x] 40.2 SEO on-page: copy y estructura semántica del hero (above the fold)
    - El `<h1>` actual responde "qué" pero no "para quién" ni "siguiente paso" en 3 segundos
    - Reescribir el subtítulo del hero para incluir nicho explícito: "Para tiendas de ropa, accesorios y calzado en Latinoamerica"
    - Agregar un párrafo de apoyo con keywords long-tail: "probador virtual IA Latam", "prueba ropa online", "widget probador virtual tienda"
    - Asegurar jerarquía semántica: un solo `<h1>`, secciones con `<h2>`, pasos con `<h3>`
    - Agregar `alt` descriptivos a todas las imágenes y `aria-label` a botones sin texto visible
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 40.3 Optimización de imágenes y assets
    - Reemplazar cualquier `<img>` por `next/image` con `width`, `height` y `priority` en el hero
    - Agregar `loading="lazy"` implícito (Next Image lo hace por defecto fuera del hero)
    - Revisar que el favicon esté en formato `.ico` + `.png` 192×192 y 512×512 en `frontend/public/`
    - Agregar `<link rel="preconnect">` para Google Fonts en `layout.tsx` (ya usa `next/font`, verificar que no haya imports CSS manuales)
    - _Archivos: frontend/src/app/page.tsx, frontend/src/app/layout.tsx, frontend/public/_

  - [x] 40.4 Microinteracciones y transiciones en la landing pública
    - Botones CTA principales: agregar `transition-all duration-200 hover:-translate-y-0.5 active:scale-95` consistente en todos
    - Cards de features y testimonios: agregar `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
    - Cards de pricing: agregar `hover:border-[#FF5C3A]/60 transition-colors duration-200` en el plan Básico
    - Nav links: agregar `transition-colors duration-150` (ya existe en algunos, unificar)
    - Demo mockup: agregar `hover:border-[#FF5C3A]/40 transition-colors duration-300` al contenedor
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 40.5 Responsive y touch targets en la landing
    - Verificar que los botones del nav tengan `min-h-[44px]` en móvil (touch target mínimo recomendado)
    - En la sección de pricing, en móvil las cards deben tener `gap-6` y padding suficiente para no sentirse apretadas
    - La sección de stats (`+120 marcas`, `18K generaciones`) debe usar `grid-cols-3` en móvil con texto más pequeño si es necesario, sin overflow
    - El demo mockup debe tener `max-w-full` y no desbordar en pantallas < 360px
    - Revisar que el footer en móvil no tenga links demasiado juntos (agregar `gap-y-3` en el flex-wrap)
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 40.6 Contraste y accesibilidad básica (WCAG AA)
    - El texto `#888` sobre `#f5f2ee` tiene ratio ~3.5:1 (falla AA para texto normal < 18px) → cambiar a `#666` mínimo
    - El texto `#555` sobre `#0a0a0a` tiene ratio suficiente, verificar el `#444` en el footer
    - Agregar `focus-visible:ring-2 focus-visible:ring-[#FF5C3A]` a todos los botones y links interactivos
    - Asegurar que el badge "Más popular" tenga `aria-label` o sea decorativo con `aria-hidden`
    - Verificar que el `<nav>` tenga `aria-label="Navegación principal"`
    - _Archivos: frontend/src/app/page.tsx_

  - [x] 40.7 Microinteracciones en el panel admin y dashboard de marca
    - En `/admin/brands`, `/admin/mini-landings`: botones de acción con `transition-all duration-150 hover:opacity-80`
    - En `/dashboard/mi-pagina`: botón "Guardar cambios" con feedback visual de éxito (ya existe, verificar que el spinner sea consistente)
    - Modales de confirmación: agregar `transition-opacity duration-150` al overlay y `transition-transform duration-200 scale-95→scale-100` al contenedor
    - _Archivos: frontend/src/app/admin/mini-landings/page.tsx, frontend/src/app/admin/brands/page.tsx_

---

## Notes

- Tasks opcionales (marcados con `*` en el historial) pueden omitirse para mantener velocidad
- Prioridad actual: 37 (rebrand Lookitry) → 38 (FAQ landing) → 39 (suspensión mini-landing) → 35 (marketing CRM) → 36 (cola)
- Variables de entorno n8n pendientes de configurar: `BREVO_API_KEY`, `APIFY_API_TOKEN`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`, `GROQ_API_KEY`, `SUPABASE_SERVICE_KEY`
- El FAQ usa paleta `#FF5C3A` (acento), `#0a0a0a` (fondo oscuro), `#f5f2ee` (fondo claro) — misma paleta corporativa del sitio
- Nombre nuevo del proyecto: **Lookitry** (antes VirtualTryOn)

---

- [-] 41. Layout "Mi página": precio dinámico y ocultar mensaje cuando está activa
  - [x] 41.1 Leer el precio de activación de landing desde configuración del admin (no hardcodeado)
    - El mensaje actual dice "$500.000 COP" hardcodeado en `mi-pagina/page.tsx`
    - Exponer el precio desde el panel admin (ya existe config de precios) vía endpoint o variable de entorno
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx, backend/src/controllers/admin.controller.ts_
  - [x] 41.2 Ocultar el mensaje de activación cuando `has_landing_page = true`
    - El bloque de texto informativo solo debe mostrarse si la landing NO está activa
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx_

---

- [x] 42. Dashboard: estadísticas de mini-landings activas
  - [x] 42.1 Agregar tarjeta/sección en el dashboard principal con contadores de mini-landings
    - Total activas (`has_landing_page = true`)
    - Total suspendidas (`landing_suspended_at != null`)
    - Total sin activar (`has_landing_page = false` y `landing_suspended_at = null`)
    - Endpoint: `GET /api/admin/stats/landings` o extender el endpoint de stats existente
    - _Archivos: frontend/src/app/dashboard/page.tsx, backend/src/controllers/admin.controller.ts_

---

- [x] 43. Ingresos y pagos: reportes de landings
  - [x] 43.1 En `/admin/revenue` incluir ingresos por plan LANDING separados de BASIC/PRO
    - Filtro o columna adicional para pagos de tipo landing
    - _Archivos: frontend/src/app/admin/revenue/page.tsx_
  - [x] 43.2 En `/admin/brands` y `/admin/subscriptions` mostrar correctamente el plan LANDING
    - _Archivos: frontend/src/app/admin/brands/page.tsx, frontend/src/app/admin/subscriptions/page.tsx_
  - [x] 43.3 Historial de pagos: incluir y filtrar pagos de tipo landing
    - _Archivos: frontend/src/app/admin/revenue/page.tsx, backend/src/controllers/admin.controller.ts_

---

- [-] 44. Configuración admin: selector bypass protección por IP en pruebas
  - [x] 44.1 Agregar toggle en la página de configuración/pruebas del admin para desactivar protección por IP en registro
    - Colocarlo debajo del toggle de tarjetas de prueba (mismo estilo visual)
    - Persistir en la misma tabla/config que el toggle de tarjetas
    - _Archivos: frontend/src/app/admin/settings/page.tsx (o equivalente), backend/src/controllers/admin.controller.ts_

---

- [x] 45. Autenticación: recuperar y cambiar contraseña
  - [x] 45.1 Agregar enlace "¿Olvidaste tu contraseña?" en el login de usuarios (`/login`)
    - Flujo: ingresa email → recibe correo con link → página de reset → nueva contraseña
    - _Archivos: frontend/src/components/auth/LoginForm.tsx, frontend/src/app/auth/forgot-password/page.tsx, frontend/src/app/auth/reset-password/page.tsx, backend/src/controllers/auth.controller.ts, backend/src/services/auth.service.ts, backend/src/routes/auth.routes.ts_
  - [x] 45.2 Agregar enlace "¿Olvidaste tu contraseña?" en el login de administrador (`/admin/login`)
    - _Archivos: frontend/src/app/admin/login/page.tsx_
  - [x] 45.3 Agregar opción "Cambiar contraseña" en el perfil de usuario del dashboard
    - Sección en `/dashboard/profile`: contraseña actual + nueva + confirmar
    - _Archivos: frontend/src/app/dashboard/profile/page.tsx_
  - [x] 45.4 Agregar opción "Cambiar contraseña" en el menú de administrador
    - _Archivos: frontend/src/app/admin/perfil/page.tsx (o componente de perfil admin)_
  - [x] 45.5 Corregir bug visual de notificación "Comprueba tu correo electrónico" en cuentas nuevas
    - Investigar dónde se dispara y por qué está bugeada
    - Contexto: la recuperación es para acceder a créditos de generación / herramienta de generación, si no esta aplicada esta logica, creala...
    - _Archivos: frontend/src/components/auth/RegisterForm.tsx, backend/src/services/auth.service.ts_

---

- [x] 46. Tutoriales: onboarding y tutorial de configuración de landing
  - [x] 46.1 Investigar y corregir por qué desapareció el tutorial paso a paso de configuración de cuenta
    - Verificar si fue eliminado en algún commit reciente o si hay condición que lo oculta
    - _Archivos: frontend/src/app/dashboard/ (buscar componente de onboarding/tutorial)_
  - [x] 46.2 Crear tutorial de configuración de mini-landing para usuarios que compran plan LANDING
    - Mostrar tutorial al entrar al dashboard por primera vez después de activar landing
    - Pasos: subir logo, configurar colores, agregar productos, publicar
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx, frontend/src/components/dashboard/_

---

- [-] 4axtiv7. Templates: bugs y mejoras visuales
  - [x] 47.1 Template clásico: mostrar reseñas, ciudad/dirección y otros datos faltantes
    - Verificar qué campos no se están renderizando en `TemplateClassic`
    - _Archivos: frontend/src/components/mini-landing/MiniLanding.tsx_
  - [x] 47.2 Cambiar campo "ciudad" por "dirección completa" en el formulario de mi-pagina
    - Reflejar el campo en todos los templates (clásico, editorial, moderno)
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx, frontend/src/components/mini-landing/MiniLanding.tsx_
  - [x] 47.3 Templates moderno y editorial: corregir carga de imágenes
    - Investigar por qué las imágenes no cargan en esos templates
    - _Archivos: frontend/src/components/mini-landing/MiniLanding.tsx_
  - [x] 47.4 Todos los templates: opción de color de fondo sólido como alternativa a imagen de portada
    - Si no hay imagen de portada, permitir elegir un color sólido de fondo en lugar del gradiente por defecto
    - Agregar campo `cover_bg_color` en el formulario y en la BD
    - _Archivos: frontend/src/app/dashboard/mi-pagina/page.tsx, frontend/src/components/mini-landing/MiniLanding.tsx, backend/src/services/brands.service.ts_

---

- [ ] 48. Suscripciones y marcas: plan trial
  - [x] 48.1 En `/admin/subscriptions`: mostrar plan TRIAL correctamente (no como BASIC)
    - _Archivos: frontend/src/app/admin/subscriptions/page.tsx, backend/src/controllers/admin.controller.ts_
  - [x] 48.2 Corregir flujo de upgrade: desde TRIAL debe poder ir a BASIC o a PRO
    - Actualmente solo permite ir a PRO desde TRIAL
    - _Archivos: frontend/src/app/dashboard/ (componente de upgrade), backend/src/controllers/brands.controller.ts_
  - [x] 48.3 En `/admin/brands`: mostrar TRIAL como plan, no BASIC
    - _Archivos: frontend/src/app/admin/brands/page.tsx_

---

- [-] 49. Footer de templates: URL provisional de Lookitry
  - [x] 49.1 Cambiar el link del footer en todos los templates de `lookitry.com` a `pruebalo.wilkiedevs.com`
    - Afecta `LandingFooter` en `MiniLanding.tsx` y cualquier otro footer de template
    - _Archivos: frontend/src/components/mini-landing/MiniLanding.tsx_
    - agregame una opcion para cambiar la URL actual Pruebalo.wilkiedevs.com por la nueva con toda la logica para que funcione el nuevo enlace y me haga automaticamente todas las redirecciones necesarias para que funcione la nueva URL, esto lo puedes crear en el apartado configuracion del panel de administracion.
 - [-] 49.2 Elimina la seccion pagina inactiva global del layout de configuracion ya que esta repetida en la oagina de mini-lading.

---

- [ ] 50. Base de datos: seguridad y gestión de usuarios
  - [ ] 50.1 Activar RLS (Row Level Security) en tablas críticas de Supabase
    - Tablas: `brands`, `products`, `generations`, `subscriptions`
    - Políticas: cada brand solo puede leer/escribir sus propios registros (por `brand_id` o `id`)
    - El backend usa `service_role` (bypassa RLS) — verificar que ningún endpoint exponga datos cruzados
    - _Archivos: backend/migrations/enable_rls.sql_
  - [ ] 50.2 Auditoría de endpoints: verificar que no haya filtración de datos entre marcas
    - Revisar todos los `GET` que devuelven listas — asegurar que siempre filtren por `brand_id` del token
    - _Archivos: backend/src/controllers/ (todos)_
