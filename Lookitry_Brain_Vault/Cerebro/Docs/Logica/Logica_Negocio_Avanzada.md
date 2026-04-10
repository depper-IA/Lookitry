# Auditoría de Lógica de Negocio Avanzada - Lookitry

Este documento detalla los motores lógicos complejos que operan en el backend y que son fundamentales para la operación del SaaS, el crecimiento (growth) y la escalabilidad Enterprise.

---

## 1. Motor de Prospección (Lead Enrichment)
Ubicación: `backend/src/services/lead-enrichment.service.ts`

Sistema responsable de alimentar el pipeline de ventas de Lookitry mediante la captura y calificación automática de marcas de moda.

### Funcionalidades Clave:
- **Importación CRM**: Procesamiento de archivos Excel con leads crudos, detectando país por ciudad y validando nicho.
- **Clasificación Automática**: Filtro bi-modal mediante `FASHION_KEYWORDS` y `NO_FASHION_KEYWORDS`. Si el lead no es de moda, se marca para eliminación automática o descarte.
- **Verificación Social (Social OSINT)**:
  - **Website Scraper**: Analiza el contenido HTML de la URL del lead buscando keywords de moda para confirmar relevancia (Score: 80).
  - **Extractor de Handles**: Extrae automáticamente usuarios de Instagram y TikTok del código fuente del sitio web.
  - **Social Head Check**: Realiza peticiones `HEAD` a perfiles sociales para verificar que las URLs existen y son válidas.
- **Sistema de Scoring**: Cada lead tiene un `enrichment_score` basado en la confianza de los datos (Keyword: 50, Web: 80, Social: 100).

---

## 2. Motor de Referidos (Growth Engine)
Ubicación: `backend/src/services/referral.service.ts`

Sistema de incentivos para la adquisición viral de usuarios.

### Lógica de Recompensa:
- **Flujo de Conversión**: El referido se marca como `converted` únicamente cuando realiza su **primer pago** de un plan (BASIC, PRO o ENTERPRISE).
- **Créditos Automáticos**: 
  - **Referente**: Recibe por defecto **500 créditos** extra de generación.
  - **Referido**: Recibe **100 créditos** extra como bono de bienvenida.
- **Seguridad**: Control de `referrer_claimed` para evitar doble abono y validación de estado `pending` antes de la conversión.

---

## 3. The Sync (Sincronización Enterprise)
Ubicación: `backend/src/controllers/enterprise.controller.ts`

Integración de alto nivel para clientes corporativos con catálogos masivos (WooCommerce, API, CSV).

### Arquitectura:
- **Webhook Bridge**: El backend actúa como puente hacia n8n (`enterprise-sync`), enviando la configuración de mapeo de campos (`field_map`) y credenciales de la fuente.
- **Deduplicación**: Al recibir productos desde n8n, el sistema utiliza `external_id` (ID de la tienda origen) para decidir si crear (`INSERT`) o actualizar (`UPDATE`) el producto en la tabla `products`.
- **Atomicidad**: Cada producto sincronizado dispara una RPC en Supabase (`increment_sync_count`) para mantener el contador de la sincronización en tiempo real.

---

## 4. Ciclo de Vida de Marca (Brand Lifecycle)
Ubicación: `backend/src/utils/brandLifecycle.ts`

Gestión de estados legales y de eventos comerciales almacenados en `social_links` (JSONB).

### Eventos de Auditoría:
- **Trace de Trial**: Registro de hitos (`trial_started`, `first_product_created`, etc.) para análisis de conversión.
- **Comercial Scoring**: Algoritmo que recomienda el plan ideal (BASIC vs PRO) basado en métricas de uso (productos activos, generaciones usadas, vistas al checkout).
- **Derecho al Olvido (Legal)**: Implementación de solicitudes `customers/data_request` y `shop/redact` para cumplimiento normativo (GDPR/Compliance Latam).

---

## 5. Auditoría de Seguridad y TRM
- **TRM Dinámica**: `backend/src/utils/trm.ts` gestiona la conversión de moneda si se habilitan pagos internacionales.
- **Saneamiento**: `backend/src/utils/sanitizeError.ts` centraliza la limpieza de errores de base de datos para no exponer la estructura interna al frontend.
