# AUDITORÍA ADMIN PANEL - Lookitry
Fecha: 2026-04-06

---

## RESUMEN EJECUTIVO

El panel de administración de Lookitry es una aplicación Next.js completa con backend Express que gestiona un ecosistema SaaS de probador virtual (try-on) para marcas de moda. La auditoría revela un panel **maduro y bien estructurado** con funcionalidad extensa, pero con gaps críticos en áreas de observabilidad y gestión operativa.

**Fortalezas detectadas:**
- Arquitectura modular con permisos granulares por rol (8 permisos diferenciados)
- Cobertura completa de gestión de marcas, suscripciones y pagos
- Sistema de métricas en tiempo real (Agent Activity, Mission Control)
- Panel de auditoría completo con logging de acciones
- CRM integrado para leads con pipeline de estados
- Módulo de riesgo y retención (churn prevention)
- Funnel SaaS visual para tracking de conversiones

**Gaps críticos:**
- No existe historial de try-ons por marca (solo stats agregados)
- No hay endpoint para reintentar try-ons fallidos
- Sin panel de logs de n8n ni configuración directa de webhooks
- No hay gestión de API keys visibles en el admin
- Sin herramienta de búsqueda de transacciones por ID
- Falta módulo de soporte/tickets para marcas

---

## ENDPOINTS DETECTADOS (Backend)

### Sistema de Autenticación y Admins

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| POST | /api/admin/auth/login | Login admin | No |
| POST | /api/admin/auth/logout | Logout admin | No |
| POST | /api/admin/auth/forgot-password | Solicitar reset password | No |
| POST | /api/admin/auth/reset-password | Resetear contraseña | No |
| POST | /api/admin/auth/google | Login Google | No |
| GET | /api/admin/verify | Verificar token admin | Sí |
| GET | /api/admin/admins | Listar admins | Sí (admins) |
| POST | /api/admin/admins | Crear admin | Sí (admins) |
| PATCH | /api/admin/admins/:id/permissions | Actualizar permisos | Sí (admins) |
| PUT | /api/admin/admins/:id/password | Cambiar password admin | Sí (admins) |
| POST | /api/admin/admins/:id/send-credentials | Enviar credenciales | Sí (admins) |
| DELETE | /api/admin/admins/:id | Eliminar admin | Sí (admins) |
| PUT | /api/admin/admins/me/password | Cambiar propia password | Sí (cualquiera) |

### Gestión de Marcas (Brands)

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/brands | Listar todas las marcas | Sí (brands) |
| POST | /api/admin/brands | Crear marca | Sí (brands) |
| DELETE | /api/admin/brands/:id | Eliminar marca | Sí (brands) |
| GET | /api/admin/brands/:id/products | Ver productos de marca | Sí (brands) |
| DELETE | /api/admin/brands/:id/products/:productId | Eliminar producto inactivo | Sí (brands) |
| PATCH | /api/admin/brands/:id/plan | Cambiar plan | Sí (subscriptions) |
| PATCH | /api/admin/brands/:id/activate-plan | Activar plan | Sí (subscriptions) |
| PATCH | /api/admin/brands/:id/landing-page | Toggle mini-landing | Sí (brands) |
| PATCH | /api/admin/brands/:id/notes | Actualizar notas internas | Sí (brands) |
| PATCH | /api/admin/brands/:id/modal-config | Configurar modal activación | Sí (brands) |
| POST | /api/admin/brands/:id/send-reset-email | Enviar email reset | Sí (brands) |
| GET | /api/admin/brands/:id/full | Ficha completa 360° | Sí (brands) |
| GET | /api/admin/mini-landings | Listar mini-landings | Sí (brands) |
| PATCH | /api/admin/mini-landings/:id/suspend | Suspender mini-landing | Sí (brands) |
| PATCH | /api/admin/mini-landings/:id/restore | Restaurar mini-landing | Sí (brands) |

### Suscripciones y Pagos

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/subscriptions | Listar suscripciones | Sí (subscriptions) |
| POST | /api/admin/subscriptions/:id/payment | Registrar pago manual | Sí (subscriptions) |
| PATCH | /api/admin/subscriptions/:id/suspend | Suspender suscripción | Sí (subscriptions) |
| PATCH | /api/admin/subscriptions/:id/reactivate | Reactivar suscripción | Sí (subscriptions) |
| GET | /api/admin/revenue/payments | Historial de pagos | Sí (subscriptions) |

### Estadísticas y Analytics

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/stats | Stats globales | Sí (conversion) |
| GET | /api/admin/stats/conversion | Stats de conversión | Sí (conversion) |
| GET | /api/admin/stats/top-brands | Top marcas | Sí (conversion) |
| GET | /api/admin/alerts | Alertas del sistema | Sí (conversion) |
| GET | /api/admin/stats/mission-control | Mission control data | Sí (conversion) |
| GET | /api/admin/risk | Datos de riesgo | Sí (brands) |
| GET | /api/admin/economics | Unidad económica | Sí (settings) |
| GET | /api/admin/audit-log | Log de auditoría | Sí (admins) |
| GET | /api/admin/health | Estado del sistema | Sí (health) |

### Configuración y Settings

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/payment-settings | Ver settings de pago | Sí (settings) |
| PUT | /api/admin/payment-settings | Actualizar settings pago | Sí (settings) |
| GET | /api/admin/notifications | Notificaciones admin | Sí (notifications) |
| GET | /api/admin/notification-preferences | Preferencias notificación | Sí (notifications) |
| PATCH | /api/admin/notification-preferences/:type | Actualizar preferencia | Sí (notifications) |
| GET | /api/admin/openrouter-credits | Créditos OpenRouter | Sí (settings) |
| GET | /api/admin/replicate-credits | Créditos Replicate | Sí (settings) |
| GET | /api/admin/pricing | Configuración de precios | Sí (settings) |
| PUT | /api/admin/pricing | Actualizar precios | Sí (settings) |

### Promociones y Marketing

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/promotions | Listar promociones | Sí (settings) |
| POST | /api/admin/promotions | Crear promoción | Sí (settings) |
| PUT | /api/admin/promotions/:id | Actualizar promoción | Sí (settings) |
| DELETE | /api/admin/promotions/:id | Eliminar promoción | Sí (settings) |
| GET | /api/admin/trial-campaign | Ver campañas trial | Sí (settings) |
| POST | /api/admin/trial-campaign | Crear campaña trial | Sí (settings) |
| PATCH | /api/admin/trial-campaign/:id | Actualizar campaña trial | Sí (settings) |

### Email Campaigns (Brevo)

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/email-campaigns/quota | Cuota Brevo | Sí (marketing) |
| GET | /api/admin/email-campaigns/brevo-status | Estado conexión Brevo | Sí (marketing) |
| GET | /api/admin/email-campaigns | Listar campañas | Sí (marketing) |
| GET | /api/admin/email-campaigns/:id | Ver campaña | Sí (marketing) |
| POST | /api/admin/email-campaigns | Crear campaña | Sí (marketing) |
| POST | /api/admin/email-campaigns/:id/preview | Preview campaña | Sí (marketing) |
| POST | /api/admin/email-campaigns/:id/launch | Lanzar campaña | Sí (marketing) |
| POST | /api/admin/email-campaigns/:id/schedule | Programar campaña | Sí (marketing) |
| POST | /api/admin/email-campaigns/:id/cancel | Cancelar campaña | Sí (marketing) |
| DELETE | /api/admin/email-campaigns/:id | Eliminar campaña | Sí (marketing) |

### Leads y CRM

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/leads/stats | Stats de leads | Sí (brands) |
| GET | /api/admin/leads/by-city | Leads por ciudad | Sí (brands) |
| GET | /api/admin/leads | Listar leads | Sí (brands) |
| GET | /api/admin/leads/:id | Ver lead | Sí (brands) |
| POST | /api/admin/leads | Crear lead | Sí (brands) |
| PATCH | /api/admin/leads/:id | Actualizar lead | Sí (brands) |
| DELETE | /api/admin/leads/:id | Eliminar lead | Sí (brands) |
| POST | /api/admin/leads/:id/outreach | Añadir log outreach | Sí (brands) |

### Lead Searches

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/lead-searches | Listar búsquedas | Sí (brands) |
| POST | /api/admin/lead-searches | Crear búsqueda | Sí (brands) |
| POST | /api/admin/lead-searches/:id/run | Ejecutar búsqueda | Sí (brands) |
| DELETE | /api/admin/lead-searches/:id | Eliminar búsqueda | Sí (brands) |
| GET | /api/admin/lead-searches/quota | Cuota Google Places | Sí (brands) |

### Social API Configuration

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/social-api-configs | Ver configs | Sí (settings) |
| POST | /api/admin/social-api-configs | Crear/actualizar config | Sí (settings) |
| POST | /api/admin/social-api-configs/:platform/test | Probar config | Sí (settings) |
| PATCH | /api/admin/social-api-configs/:platform/active | Activar/desactivar | Sí (settings) |
| DELETE | /api/admin/social-api-configs/:platform | Eliminar config | Sí (settings) |

### WooCommerce Integration

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/woocommerce/brands-summary | Resumen Woo brands | Sí (brands) |
| GET | /api/admin/woocommerce/brands/:id/products | Productos Woo brand | Sí (brands) |
| PATCH | /api/admin/woocommerce/brands/:id/products/:productId/active | Activar/desactivar producto | Sí (brands) |

### Feedback y Reviews

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/feedback/count-unresolved | Count feedback sin resolver | Sí (brands) |
| GET | /api/admin/feedback/stats | Stats de feedback | Sí (brands) |
| GET | /api/admin/feedback | Listar feedback | Sí (brands) |
| PATCH | /api/admin/feedback/:id/resolve | Resolver feedback | Sí (brands) |
| DELETE | /api/admin/feedback/:id | Eliminar feedback | Sí (brands) |

### Referidos

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/referrals | Listar referidos | Sí (brands) |
| POST | /api/admin/referrals/:referralId/credit | Acreditar bonus | Sí (brands) |

### Sistema

| Método | Path | Descripción | Admin Only |
|--------|------|-------------|------------|
| GET | /api/admin/system/stats | Stats del sistema | Sí (settings) |

---

## PÁGINAS DEL ADMIN

| Ruta | Componente/Archivo | Estado | Funcionalidades |
|------|-------------------|--------|------------------|
| /admin/dashboard | dashboard/page.tsx | ✅ Implementada | Mission Control: stats globales, alerts, conversión, brands recientes, mini-landings |
| /admin/brands | brands/page.tsx | ✅ Implementada | CRUD marcas, filtros plan/estado, vista grid/tabla, panel lateral, toggle landing, notas, modal config |
| /admin/brands/[id] | brands/[id]/page.tsx | ✅ Implementada | Ficha completa 360° de marca |
| /admin/subscriptions | subscriptions/page.tsx | ✅ Implementada | Grid/tabla suscripciones, renew, change plan, suspend/reactivate, stats MRR |
| /admin/payments | payments/page.tsx | ✅ Implementada | Historial pagos, filtros método/estado/fecha, exportación CSV, resumen por método |
| /admin/revenue | revenue/page.tsx | ✅ Implementada | Revenue overview |
| /admin/analytics | analytics/page.tsx | ✅ Implementada | Uso IA por mes, distribución planes, mini-landings stats |
| /admin/agents | agents/page.tsx | ✅ Implementada | Agent Activity con polling 30s, timeline, distribución tasks, detalle por agente |
| /admin/funnel | funnel/page.tsx | ✅ Implementada | Embudo SaaS completo, tasas clave, fricción, detalle por etapa |
| /admin/risk | risk/page.tsx | ✅ Implementada | Riesgo y retención, risk score por marca, factores de riesgo, playbook integrado |
| /admin/health | health/page.tsx | ✅ Implementada | Estado sistema, servicios, memoria, uptime, DB pool connections |
| /admin/audit-log | audit-log/page.tsx | ✅ Implementada | Log acciones admin, filtros por email/acción, paginación |
| /admin/ia-costs | ia-costs/page.tsx | ✅ Implementada | Créditos OpenRouter/Replicate, prompts maestros IA, alertas balance |
| /admin/admins | admins/page.tsx | ✅ Implementada | CRUD admins, permisos granulares, superadmin vs personalizado |
| /admin/leads | leads/page.tsx | ✅ Implementada | CRM leads, estados (new/qualified/contacted/interested/client), crear/editar/eliminar |
| /admin/lead-searches | lead-searches/page.tsx | ✅ Implementada | Búsquedas Google Places, ejecutar/eliminar |
| /admin/reviews | reviews/page.tsx | ✅ Implementada | Moderación reviews, aprobar/rechazar, destacar, eliminar |
| /admin/social-api-config | social-api-config/page.tsx | ✅ Implementada | Configurar APIs sociales, probar conexión, activar/desactivar |
| /admin/marketing/promotions | marketing/promotions/page.tsx | ✅ Implementada | Gestionar promociones |
| /admin/trial-campaigns | trial-campaigns/page.tsx | ✅ Implementada | Campañas trial |
| /admin/email-campaigns | email-campaigns/page.tsx | ✅ Implementada | Email campaigns vía Brevo, crear/lanzar/programar/cancelar |
| /admin/feedback | feedback/page.tsx | ✅ Implementada | Feedback de generaciones |
| /admin/notifications | notifications/page.tsx | ✅ Implementada | Notificaciones admin |
| /admin/enterprise | enterprise/page.tsx | ✅ Implementada | Enterprise sync |
| /admin/woocommerce | woocommerce/page.tsx | ✅ Implementada | Integración WooCommerce |
| /admin/mini-landings | mini-landings/page.tsx | ✅ Implementada | Gestión mini-landings |
| /admin/playbooks | playbooks/page.tsx | ✅ Implementada | Playbooks operativos |
| /admin/referrals | referrals/page.tsx | ✅ Implementada | Programa de referidos |
| /admin/pricing | pricing/page.tsx | ✅ Implementada | Configuración de precios |
| /admin/unit-economics | unit-economics/page.tsx | ✅ Implementada | Economía unitaria |
| /admin/conversion | conversion/page.tsx | ✅ Implementada | Métricas de conversión |
| /admin/security | security/page.tsx | ✅ Implementada | Seguridad |
| /admin/configuracion | configuracion/page.tsx | ✅ Implementada | Configuración general |
| /admin/payment-settings | payment-settings/page.tsx | ✅ Implementada | Medios de pago |
| /admin/profile | profile/page.tsx | ✅ Implementada | Perfil propio admin |
| /admin/soporte | soporte/page.tsx | ✅ Implementada | Soporte |
| /admin/blog | blog/page.tsx | ✅ Implementada | Gestión blog |
| /admin/blog/new | blog/new/page.tsx | ✅ Implementada | Crear post blog |
| /admin/blog/[id] | blog/[id]/page.tsx | ✅ Implementada | Editar post blog |
| /admin/login | login/page.tsx | ✅ Implementada | Login admin |

---

## FUNCIONALIDADES - CHECKLIST DE IMPLEMENTACIÓN

### Gestión de Usuarios/Cuentas

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Listar usuarios/cuentas (marcas) | ✅ Implementada | /admin/brands con filtros |
| Crear marcas | ✅ Implementada | Modal crear en brands |
| Editar marcas | ✅ Implementada | Side panel + /brands/[id] |
| Suspender/eliminar cuentas | ✅ Implementada | Suspend via subscriptions, delete via brands |
| Ver historial de uso | ⚠️ Parcial | Stats agregados en brand详情, sin timeline de uso |
| Gestionar planes | ✅ Implementada | Change plan, activate, suspend |
| Notas internas por marca | ✅ Implementada | Campo internal_notes en brands |

### Gestión de Marcas

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Listar marcas | ✅ Implementada | Grid + tabla, múltiples filtros |
| Crear/editar marcas | ✅ Implementada | CRUD completo |
| Configurar planes por marca | ✅ Implementada | Trial/Basic/Pro/Landing |
| Ver métricas por marca | ⚠️ Parcial | Stats del mes, generaciones totals, sin drill-down |
| Mini-landings | ✅ Implementada | Toggle, suspend, restore |
| Modal de activación personalizado | ✅ Implementada | Configurable por marca |

### Gestión de Pagos

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Ver transacciones | ✅ Implementada | /admin/payments completo |
| Gestionar suscripciones | ✅ Implementada | Renew, suspend, reactivate |
| Ver pagos fallidos | ✅ Implementada | Filtro por estado failed |
| Integración con Wompi | ⚠️ Parcial | Solo como método de pago, sin panel de gestión Wompi |
| Exportar CSV | ✅ Implementada | En payments |
| Registro de pago manual | ✅ Implementada | POST /subscriptions/:id/payment |

### Gestión de Try-Ons

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Ver historial de try-ons | ❌ No implementada | Stats agregados, sin historial individual |
| Ver estados (pending/completed/failed) | ❌ No implementada | Solo successRate global |
| Re-intentar fallidos | ❌ No implementada | No existe endpoint ni UI |
| Métricas de uso | ⚠️ Parcial | generationsThisMonth y totalGenerations |
| Ver errores por marca | ❌ No implementada | Risk muestra failed_generations_30d |

### Gestión de IA/Descriptor

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Ver solicitudes al descriptor IA | ❌ No implementada | Solo stats agregados |
| Ver costos de IA | ✅ Implementada | /admin/ia-costs con OpenRouter y Replicate |
| Configuraciones de IA | ✅ Implementada | AI prompts master configurable |
| Logs de n8n | ❌ No implementada | Sin acceso a logs de workflows |
| Monitor de créditos IA | ✅ Implementada | Balance, uso, alertas |

### Configuraciones

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Webhooks (ver endpoints) | ❌ No visible | Solo se disparan, no hay gestión en admin |
| API keys | ❌ No visible | No hay sección de API keys en admin |
| Settings generales | ✅ Implementada | /admin/configuracion |
| Pricing config | ✅ Implementada | /admin/pricing |
| Payment settings | ✅ Implementada | /admin/payment-settings |
| Social API configs | ✅ Implementada | /admin/social-api-config |
| Trial campaigns | ✅ Implementada | /admin/trial-campaigns |
| Promociones | ✅ Implementada | /admin/marketing/promotions |

### Sistema y Monitoreo

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Health check | ✅ Implementada | /admin/health completo |
| Audit log | ✅ Implementada | Logging de todas las acciones admin |
| Agent Activity | ✅ Implementada | Monitoreo real-time con polling |
| Sistema de permisos granular | ✅ Implementada | 8 permisos + superadmin |
| Notificaciones admin | ✅ Implementada | Badge con count no leídas |

### CRM y Marketing

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Gestión de leads | ✅ Implementada | Pipeline completo |
| Email campaigns (Brevo) | ✅ Implementada | CRUD completo |
| Moderación de reviews | ✅ Implementada | Aprobar/rechazar/destacar |
| Programa de referidos | ✅ Implementada | Ver y acreditar bonus |
| Promociones/cupones | ✅ Implementada | CRUD promociones |

---

## GAPS CRÍTICOS

### 1. Sin historial de Try-Ons individuales (CRÍTICO)
**Problema:** No existe forma de ver el historial de generaciones de una marca individual ni de reintentar una generación fallida.
**Impacto:** 无法 hacer troubleshooting de problemas específicos de una marca.
**Recomendación:** Crear endpoint GET /api/admin/brands/:id/generations con paginación y filtros (status), y PATCH /api/admin/generations/:id/retry para reintentar.

### 2. Sin panel de gestión de webhooks n8n (CRÍTICO)
**Problema:** Los webhooks están configurados por variables de entorno y no hay forma de ver el estado de las ejecuciones desde el admin.
**Impacto:** Impossible detectar problemas en el flujo de try-on sin acceder a n8n directamente.
**Recomendación:** Crear tabla en admin para mostrar últimos webhooks ejecutados con status, o integrar logs de n8n.

### 3. Sin logs visibles de workflows n8n (CRÍTICO)
**Problema:** Los logs de ejecución de workflows n8n no son accesibles desde el panel admin.
**Impacto:** Debugging de problemas de IA requiere acceso directo a n8n.
**Recomendación:** Implementar logging de webhooks en tabla admin_webhook_logs.

### 4. Sin gestión de API keys visible (ALTO)
**Problema:** Las API keys de OpenRouter, Replicate, Wompi, etc. solo existen como variables de entorno.
**Impacto:** Rotación de keys requiere restart del servidor.
**Recomendación:** Crear sección /admin/api-keys para gestionar credenciales de forma segura (encriptadas en DB).

### 5. Sin herramienta de búsqueda por ID de transacción (ALTO)
**Problema:** Para buscar una transacción específica hay que usar filtros que pueden ser lentos.
**Impacto:** Soporte lento para marcas con problemas de pago.
**Recomendación:** Agregar searchbox con autocompletado por transaction ID o payment ID.

### 6. Sin módulo de soporte/tickets (ALTO)
**Problema:** No existe sistema de tickets para que las marcas reporten problemas.
**Impacto:** comunicación ad-hoc por fuera del sistema.
**Recomendación:** Crear tabla admin_support_tickets con CRUD y notificaciones.

### 7. Sin visibilidad de uso por producto individual (MEDIO)
**Problema:** Solo hay stats agregados por marca, no por producto individual.
**Impacto:** 无法 identificar qué productos generan más uso o errores.
**Recomendación:** drill-down a nivel producto en la ficha de marca.

### 8. Sin paginación en audit-log (MEDIO)
**Problema:** El audit log usa offset/limit simple, podría crecer mucho.
**Impacto:** Performance eventually.
**Recomendación:** Implementar cursor-based pagination para audit log.

---

## SISTEMA DE PERMISOS - MAPA

| Permiso | Descripción | RutAS que protege |
|---------|-------------|-------------------|
| brands | Ver y gestionar marcas | /brands, /mini-landings, /brands/:id/full, /woocommerce/*, /feedback, /risk, /referrals |
| subscriptions | Gestionar suscripciones y pagos | /subscriptions, /brands/:id/plan, /brands/:id/activate-plan, /revenue/payments |
| revenue | Ver ingresos | /revenue/* |
| conversion | Ver métricas de conversión | /stats, /stats/conversion, /stats/top-brands, /alerts, /stats/mission-control |
| health | Ver estado del sistema | /health |
| notifications | Ver notificaciones | /notifications, /notification-preferences, /feedback/count-unresolved |
| settings | Configuración general | /payment-settings, /pricing, /economics, /openrouter-credits, /replicate-credits, /system/stats, /trial-campaign, /social-api-configs, /promotions |
| admins | Gestionar administradores | /admins, /audit-log |

---

## COMPONENTES UI REUTILIZABLES DETECTADOS

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| BrandTable | components/admin/brands/BrandTable.tsx | Tabla de marcas con sort/paginación |
| BrandDetailsModal | components/admin/brands/BrandDetailsModal.tsx | Modal de detalles de marca |
| BrandFilters | components/admin/brands/BrandFilters.tsx | Filtros de búsqueda brands |
| SubscriptionModals | components/admin/subscriptions/SubscriptionModals.tsx | Modales renew/change plan/confirm |
| AgentStatsCards | components/admin/agents/AgentStatsCards.tsx | Cards stats agentes |
| AgentActivityTimeline | components/admin/agents/AgentActivityTimeline.tsx | Timeline actividad agentes |
| AgentTaskDistribution | components/admin/agents/AgentTaskDistribution.tsx | Distribución por tipo task |
| AgentTrendChart | components/admin/agents/AgentTrendChart.tsx | Gráfico tendencia 7 días |
| AgentFilterBar | components/admin/agents/AgentFilterBar.tsx | Filtros de agente |
| ActiveAgentsPanel | components/admin/agents/ActiveAgentsPanel.tsx | Panel agentes activos |
| EmbeddedPlaybook | components/admin/EmbeddedPlaybook.tsx | Playbook condicional |
| CreditComponents | components/admin/config/CreditComponents.tsx | Componentes créditos IA |
| EnterpriseCalculator | components/admin/EnterpriseCalculator.tsx | Calculadora enterprise |
| ConfirmDialog | components/admin/ConfirmDialog.tsx | Provider de confirmación |
| AdminNotifications | components/admin/AdminNotifications.tsx | Notificaciones admin |

---

## CONEXIONES A TERCEROS

| Servicio | Integración | Estado |
|----------|-------------|--------|
| Supabase | Base de datos principal | ✅ Conectado |
| OpenRouter | IA try-on (modelos) | ✅ Configurado, credits visibles |
| Replicate | IA try-on (alternativo) | ✅ Configurado, credits visibles |
| Brevo | Email campaigns | ✅ Conectado, quota visible |
| Wompi | Procesamiento pagos COP | ✅ Solo como método (no gestión) |
| Google Places API | Lead searches | ✅ Configurable |
| Instagram API | Social leads | ✅ Configurable |
| WooCommerce | sync productos | ✅ Integrate |

---

## RECOMENDACIONES DE MEJORA

### Prioridad Alta
1. **Agregar historial de try-ons** - tabla brand_generations con paginación
2. **Crear módulo de tickets de soporte** - tabla support_tickets con CRUD
3. **Agregar búsqueda por ID de transacción** - endpoint específico + UI
4. **Implementar logging de webhooks** - admin_webhook_logs table

### Prioridad Media
5. **Gestión de API keys** - UI para rotar credenciales (encriptadas)
6. **Drill-down por producto** - stats a nivel producto en brand detail
7. **Mejora audit-log pagination** - cursor-based para mejor performance

### Prioridad Baja
8. **Dashboard personalizable** - permitir rearrange widgets
9. **Reports programados** - email weekly stats a admins
10. **Exportación avanzada** - PDF reports para revenue

---

*Reporte generado: 2026-04-06*
*Modelo usado: minimax-coding-plan/MiniMax-M2.7*
