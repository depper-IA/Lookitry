# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma y Tono (OBLIGATORIO)

**SIEMPRE español neutro (tuteo, "tú")**. PROHIBIDO voseo rioplatense ("subí", "andá", "elegí", "mirá", etc.).
PROHIBIDO usar emojis en respuestas y en copy de UI.
Aplica a: respuestas del agente Y copy generado para la UI.
Ejemplos correctos: "sube", "elige", "mira", "ve a", "haz clic".

## Protocolo de Arranque

Fuente canónica de reglas del proyecto: `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` (reglas de diseño, IA, seguridad, deploy, Supabase). Léela ante cualquier duda de convención. `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md` es el índice del "Cerebro" (documentación viva).

## Gestión de Paquetes (CRÍTICO)

**SIEMPRE usar `pnpm@9.15.9`. PROHIBIDO `npm install` / `npm update`** (vulnerabilidades activas de supply chain en NPM, ver sección 15 de REGLAS_IMPORTANTES.md). En Docker se instala con `corepack prepare pnpm@9.15.9 --activate`, nunca `npm install -g pnpm`.

Nota: la raíz tiene scripts npm históricos (`package.json`), pero la instalación de dependencias se hace siempre con `pnpm`. Frontend usa Node 20, backend Node 22.

## Comandos

El proyecto es un monorepo manual de dos paquetes: `frontend/` (Next.js 14) y `backend/` (Express). No hay workspace de pnpm unificado; cada paquete se opera por separado.

### Backend (`cd backend`)

```bash
pnpm dev              # nodemon + ts-node (puerto 3001)
pnpm build            # tsc → dist/
pnpm build:prod       # lint + test + tsc
pnpm lint             # eslint . --ext .ts
pnpm test             # jest --runInBand
pnpm test:smoke       # solo tests *smoke*
pnpm test:coverage    # cobertura
npx jest ruta/al/archivo.test.ts          # un solo archivo
npx jest -t "nombre del test"             # por nombre de test
```

### Frontend (`cd frontend`)

```bash
pnpm dev              # next dev
pnpm build            # next build
pnpm lint             # next lint
pnpm test             # vitest --run
pnpm build:analyze    # build con bundle analyzer
npx vitest run ruta/al/archivo.test.ts    # un solo archivo
npx vitest run -t "nombre del test"       # por nombre de test
```

### Deploy (solo con autorización explícita del usuario)

NO se usa GitHub Actions para deploy. Se usa el script Python en el VPS:
`python3 scripts/tools/_deploy_now.py` con flags `--frontend`, `--backend`, `--force`, `--no-cache`.
Usar flags específicos cuando el cambio afecta a un solo servicio.

## Arquitectura

SaaS B2B de probador virtual con IA. El flujo central: una marca integra un widget (`/widget.js`) o mini-landing; el cliente final sube una selfie y la IA genera cómo le quedaría una prenda.

### Separación de responsabilidades

```
Cliente/E-commerce → Frontend (Next.js) → Backend (Express) → Supabase / MinIO / n8n / Vertex AI
```

- **Frontend** es solo capa de presentación. NUNCA accede directamente a IA ni a secretos de DB. Habla con el backend vía REST con JWT.
- **Backend** es el proxy seguro: orquesta auth, pagos, suscripciones y despacha trabajos de IA. Único que usa la `service role` de Supabase (bypass RLS).
- **n8n** y **Vertex AI** ejecutan la generación de imágenes (ver "Pipeline de IA").

### Backend (`backend/src/`)

Patrón clásico Express por capas: `routes/` → `controllers/` → `services/` → `config/`.

- `app.ts` arma la app Express. Punto clave de seguridad: las **rutas públicas** (`/api/pruebalo`, `/api/embed`, `/api/enterprise/sync-product`, `/api/reviews/public`, `/api/leads/public`) se registran con `publicCorsConfig` (CORS permisivo) ANTES del CORS global restrictivo, porque las consumen dominios externos (plugin WooCommerce, widgets, iframes). Su seguridad se valida internamente con API Key + dominio, no con CORS.
- `routes/index.ts` monta el router principal bajo `/api`. Incluye endpoints de sync de la base de conocimiento (`/admin/embed`, `/admin/sync-kb`) protegidos por header `x-admin-key` (`KB_SYNC_KEY`), usados por n8n/scripts sin JWT.
- `index.ts` arranca el servidor (puerto 3001), schedulers, jobs (cleanup, blog, cpu-monitor) y handlers de excepciones no capturadas. En producción NO mata el proceso ante `unhandledRejection`.
- `config/supabase.ts` exporta `supabase` (anon, lectura pública) y `supabaseAdmin` (service role, escritura/admin). También centraliza tipos `Database` y enums (`PlanType`, `SubscriptionStatus`, etc.).
- `middleware/`: `auth.ts` (JWT propio, NO Supabase Auth), `adminAuth.ts`, `apiKeyAuth.ts`, `checkSubscription.ts`, `rateLimiter.ts` (con `rate-limit-redis`), `widgetSecurity.ts`.
- `auditor/` y `scheduler/`: auditorías periódicas (pagos, seguridad, suscripciones) y procesadores agendados.

### Frontend (`frontend/src/`)

Next.js 14 App Router + TypeScript + Tailwind.

- `app/` rutas. Públicas/widget: `embed/`, `sitio/`, `marca/`, `mini-landing/`, `probador-virtual/`, `demo/`. Privadas: `dashboard/` (panel de marca), `admin/`. Marketing: `blog/`, `planes/`, etc.
- `proxy.ts` contiene la lógica de `middleware` (Edge): protección de rutas (`/dashboard`, `/admin` requieren cookie JWT), resolución de dominios personalizados → `/sitio/[slug]`, modo mantenimiento, y la construcción dinámica de **CSP `frame-ancestors`** para rutas embebibles consultando `/api/pruebalo/allowed-origins`.
- `services/api.ts` es el cliente HTTP central (wrapper sobre `fetch` que imita axios). Credenciales vía cookies HTTP-only + Bearer token. Maneja refresh de token automático ante 401 y redirección a `/login`.
- `services/*.service.ts` encapsulan llamadas por dominio (auth, products, tryon, payments, subscription...).
- `lib/pricing.ts` (`getPricingConfig()`): los precios NUNCA se hardcodean en UI; se leen de Supabase `pricing_config`.

### Pipeline de IA

Orquestado en `backend/src/controllers/pruebalo.controller.ts` (`generateTryOn`). El backend NO genera imágenes directamente: arma el prompt, sube la selfie a almacenamiento temporal y delega la generación a **n8n**, que internamente ejecuta la segmentación (MobileSAM) y la generación (Nano Banana / Gemini 2.5 Flash Image en Vertex AI).

1. **Gate de consentimiento** (Ley 1581, Art. 10-C): se rechaza el request si no hay consentimiento biométrico (`utils/consent.ts` → `isBiometricConsentGiven`); el consentimiento TERMS + BIOMETRIC se registra de forma síncrona antes de procesar.
2. **Generación — n8n**: `pruebalo.controller` llama a `n8nClient.callTryOnWebhook` (`services/n8n.client.ts`, webhooks con Bearer token, retry con backoff, timeout 90s). El workflow de n8n hace SAM + Nano Banana (Vertex).
3. **Máscara — MobileSAM** (`sam-service/`, microservicio Python/FastAPI en Docker, puerto 8000, modelo `mobile_sam.pt`). Consumido por el workflow de n8n. No reemplazar sin autorización.

Tras una generación exitosa o fallida, el dato biométrico (selfie) se elimina inline (cumplimiento Ley 1581 de 2012). Como red de seguridad, `UploadService.cleanupOrphanedTempFiles()` (scheduler diario) borra temporales huérfanos > 24h.

> Nota histórica: existió una integración directa backend→Vertex (`tryon.controller.ts` + `vertex-ai.service.ts`, `executeTryOnPipeline` / `generateWithNanoBanana`) que nunca se cableó al flujo real. Se eliminó. Si a futuro se quiere sacar la dependencia de n8n, hay que reconstruir esa orquestación directa.

### Integraciones externas

- **Supabase** (PostgreSQL) — DB. Tablas principales: `brands`, `subscriptions`, `generations`, `pricing_config`, `lookitry_knowledge` (RAG de "Rebecca"), `rebecca_message_ratings`, `sales_patterns`.
- **MinIO** autohosteado — almacenamiento de imágenes.
- **Pagos**: Wompi (COP, Colombia) y PayPal (USD internacional, conversión por TRM). El webhook de Wompi usa `express.raw` y se parsea aparte.
- **Redis** (`ioredis`) — rate limiting y colas.

## Convenciones del proyecto

- **Auth**: JWT propio (no Supabase Auth). Soporta rotación dual (`JWT_SECRET_PREVIOUS`). Cookies HTTP-only, TTL de sesión 7 días. Account lockout: 5 intentos fallidos = 15 min de bloqueo.
- **Supabase**: usar `supabaseAdmin` para escrituras/analytics, `supabase` para lecturas públicas. Preferir `.maybeSingle()` sobre `.single()`. PROHIBIDAS operaciones destructivas (DELETE/DROP/TRUNCATE) en producción sin autorización explícita.
- **Defensivo (frontend)**: optional chaining obligatorio en accesos a datos de API/Supabase; siempre fallbacks de render.
- **Conversión COP → USD**: usar `Math.ceil((precioCOP + 10000) / trm)`. PROHIBIDO `precioCOP / trm` sin margen.
- **Diseño**: naranja `#FF5C3A`, fondo `#0a0a0a`, cards `#141414`. Tipografías Plus Jakarta Sans (títulos) / DM Sans (cuerpo). Texto secundario mínimo `#999` (prohibido `#333`–`#555`). Íconos solo `lucide-react`, cero emojis en UI. PROHIBIDO usar `border` en componentes (usar sombras/gradientes/contraste) y PROHIBIDAS líneas separadoras entre secciones del landing.
- **Tamaño de archivo**: refactorizar al superar ~600 líneas (excepciones: rutas de API densas, servicios cohesivos, schemas).
- **Anti-duplicación**: buscar implementación existente antes de crear funciones/componentes/endpoints nuevos.
- **Persona Scope**: el español neutro y el tono aplican a las respuestas del agente. El código, identificadores, comentarios y nombres por defecto en inglés salvo que el proyecto ya use español en ese artefacto.

## Git y Documentación

- Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, etc.). NO añadir atribución de IA / "Co-Authored-By".
- NO hacer push automático ni deploy sin autorización del usuario.
- Cambios estructurales deben reflejarse en `CHANGELOG.md` y en el "Cerebro" (REGLAS_IMPORTANTES.md). Regla de oro: no eliminar info técnica válida, solo agregar/actualizar.

## Reglas del Asesor

Este proyecto prioriza la integridad técnica y la eficiencia operativa por encima de cualquier otro criterio. Como asesor, la función es maximizar la efectividad del sistema y evitar errores de diseño.

1. **Prioridad en la Verificación**: Toda instrucción debe ser verificada técnicamente antes de considerarse exitosa. Si una tarea reporta éxito pero no materializa el resultado esperado (archivos, datos, estado), se considera un fallo.
2. **Discrepancia Técnica**: Si una decisión compromete la estabilidad o calidad del proyecto, señalar la falla, explicar por qué es subóptima y proponer la alternativa técnica superior. No se aceptarán atajos.
3. **Cero Introducciones**: Las respuestas irán directo al punto técnico. Se eliminarán introducciones innecesarias o frases que no aporten valor al estado del proyecto.
4. **Veracidad del Estado**: Mantener una contabilidad estricta del estado del repositorio. Si el código no existe o no es ejecutable, reportar inmediatamente para corrección antes de avanzar a la siguiente fase (SDD).
5. **Calidad de Herramientas**: Siempre utilizar las herramientas de diagnóstico y ejecución más adecuadas (bash, git, tests, auditorías de archivos) antes de dar por finalizada cualquier implementación.
6. **Integridad del Pipeline**: Cualquier error en tiempo de ejecución (runtime) o de configuración debe ser resuelto antes de proceder con nuevas funcionalidades. No documentar ni probar un sistema que no sea funcional en su base.
