# Changelog - Lookitry

---

## 2026-05-15

### refactor(ai): Removido código muerto de Imagen 3

**Resumen:** Eliminada función `generateTryOn()` y código relacionado con Imagen 3 ya que nunca se usaba activamente. El pipeline actual usa Nano Banana (Gemini 2.5 Flash) para generación.

**Cambios:**
1. Removida función `generateTryOn()` de `vertex-ai.service.ts` (~90 líneas de código muerto)
2. Removida del export `vertexAIService` la referencia a `generateTryOn`
3. Actualizado docstring del archivo para reflejar el motor real (Nano Banana, no Imagen 3)
4. Actualizado `Motor_IA_TryOn.md` con modelos activos y costos reales

**Costo por generación actualizado:** ~$0.02-0.07 USD (antes $0.22-0.37 con Imagen 3)

---

## 2026-05-02

### refactor(ai): Reemplazo de n8n por Vertex AI directo para el Descriptor IA

**Resumen:** Se refactorizó la arquitectura del descriptor de productos, eliminando la dependencia del webhook de n8n e integrando directamente Vertex AI.

**Cambios clave:**
1. Nuevo endpoint `/api/ai/describe-product` que reemplaza el webhook `/webhook/descriptor` de n8n.
2. Implementación de **Strategy Pattern** usando `BaseFormatter` y clases concretas (`ClothingFormatter`, `AccessoryFormatter`, `FootwearFormatter`).
3. Uso de **Zod discriminated union** (`product_type` = CLOTHING | ACCESSORY | FOOTWEAR) para validar el output de la IA de forma estricta.
4. El controlador de productos (`products.controller.ts`) ahora llama directamente a `ai-descriptor.service.ts` en lugar de usar n8n.

---

## 2026-04-28

### fix(landing): Replace megamenu promo image with rebeca.webp

**Archivo modificado:** `frontend/src/components/landing/LandingNav.tsx`

---

## 2026-04-27

### fix(try-on): Prevent body shape alteration in generated images

**Problema reportado:** La IA estaba alterando la forma del cuerpo del usuario (ej: cintura más delgada, cuerpo más curvado) — especialmente en personas con cuerpo más grande.

**Solución:** Actualizadas las reglas de `prompt-rules.ts` para incluir `CRITICAL — DO NOT ALTER BODY SHAPE` en todas las categorías que afectan el cuerpo completo:

| Categoría | Cambio |
|-----------|--------|
| VESTIDO | Añadido `body SHAPE, waist size, hip size, shoulder width, arm thickness, leg thickness, overall silhouette` |
| DRESS | Mismo cambio |
| CONJUNTO | Mismo cambio |
| SET | Mismo cambio |
| OUTFIT | Mismo cambio |

**Regla aplicada:**
> "ONLY change the clothing — do NOT slim, thicken, curve, waist-train, or reshape the body in any way"

---

### feat(n8n): Workflow de Feedback Embedding RAG `j5EG0OcxMMSpzxVu`

**Resumen:** Workflow de n8n para generar embeddings de feedback de usuarios y almacenarlos en Supabase pgvector para el motor RAG de mejora de prompts.

#### Detalles

| Componente | Descripción |
|------------|-------------|
| **Workflow ID** | `j5EG0OcxMMSpzxVu` |
| **Webhook** | `/webhook/feedback-embedding` |
| **Modelo** | OpenAI `text-embedding-3-small` (1536 dims) via OpenRouter |
| **Trigger** | Async desde `feedback.service.ts` → `triggerEmbeddingAsync()` |

#### Flujo

1. `feedback.service.createFeedback()` inserta registro en `generation_feedback`
2. `triggerEmbeddingAsync()` hace fire-and-forget POST a `/webhook/feedback-embedding`
3. n8n prepara texto del error (tipo, categoría, descripción) — máximo 1000 chars
4. OpenRouter genera embedding de 1536 dimensiones
5. n8n actualiza `generation_feedback.embedding` con el vector
6. `prompt-rag.service` usa el embedding para buscar feedbacks similares y enriquecer prompts futuros

#### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `Lookitry_Brain_Vault/Cerebro/Docs/Guias/Integracion_n8n.md` | Actualizado con webhook #8 (Feedback Embedding RAG) |
| `Lookitry_Brain_Vault/Cerebro/TECH_STACK.md` | Actualizada sección 6.3 RAG con workflow ID y dims 1536 |

---

## 2026-04-26

### docs(brain-vault): Actualización completa de documentación del Cerebro

**Resumen:** Se actualizaron los documentos principales del Cerebro para reflejar la arquitectura actual del sistema.

#### Archivos Actualizados

| Archivo | Cambios Principales |
|---------|---------------------|
| **PRD.md** | Añadido sistema de Blog Automation (3 workflows), Email Marketing (Brevo), Social OS, Sistema de Agentes v3.0, Account Lockout, estados de leads/outreach |
| **DESIGN.md** | Nuevos componentes (Mission Control, AgentDetailModal, LoginAuditTable, EmailCampaignManager), 6 templates de widget, estados de agentes/outreach/blog |
| **TECH_STACK.md** | Sistema de Agentes v3.0, Lookitry Social OS, Account Lockout, Seguridad reforzada con campos `failed_login_attempts` y `locked_until` |
| **REGLAS_IMPORTANTES.md** | Nueva sección 14 (Account Lockout, Login Audit, Session Security, Cookie Security) |
| **Esquema_Base_Datos.md** | Añadidas tablas `email_campaigns`, `email_campaign_recipients`, campos de seguridad en brands |
| **Integracion_n8n.md** | Actualizados webhooks de blog (Topic Generator, Article Producer, Image Generator), añadido problema de n8n Task Runner |

#### Nueva Arquitectura Documentada

- **Blog Automation**: 3 workflows n8n independientes (Topic Generator → Article Producer → Image Generator)
- **Email Marketing**: Brevo SMTP con batching (50 emails/10 min), límite 300/día
- **Sistema de Agentes v3.0**: Sammantha orquestadora, 10 agentes especializados, tracking automático
- **Seguridad**: Account lockout (5 intentos = 15 min), login audit, session TTL 7 días

---

## 2026-04-22

### refactor(brain-vault): Auditoría de integridad + limpieza de archivos obsoletos

**Resumen:** Auditoría completa de base de datos y archivos del Brain Vault. Se actualizó documentación y eliminaron archivos que ya no reflejan la realidad del proyecto.

#### Base de Datos — Verificación de Integridad

**Tablas verificadas y OK:** `brands`, `products`, `generations`, `coupons`, `leads`, `promotions`, `trial_campaigns`, `admin_notifications`, `pending_registrations`, `plugin_telemetry_events`, `enterprise_sync_configs`, `google_places_quota`, `lead_searches`

**Discrepancias corregidas en `Esquema_Base_Datos.md`:**
- Eliminada tabla inexistente `api_keys`
- Eliminada tabla inexistente `payment_logs`
- Corregido `landing_template` de enum a varchar(20)
- Agregados campos faltantes: `google_id`, `auth_provider`, `needs_onboarding`, `internal_notes`, `logo_light`, `logo_dark` (brands)
- Agregados campos faltantes: `badge` (products)
- Agregado campo `prompt_used` (generations)
- Actualizado esquema completo con todas las tablas reales

#### Archivos Eliminados (Obsoletos)

| Archivo | Razón |
|---------|-------|
| `Docs/design/RUNPOD_SETUP.md` | RunPod ya no se usa (n8n + OpenRouter) |
| `Docs/design/RUNPOD_IDM_VTON_WORKFLOW_DESIGN.md` | RunPod ya no se usa |
| `PITCH_DECK_LOOKITRY.md` | Pitch deck obsoleto |
| `PITCH_DECK_LOOKITRY_ES.md` | Pitch deck obsoleto |
| `Docs/SHOPIFY_INTEGRATION.md` | WooCommerce es el plugin actual |
| `Docs/WOOCOMMERCE_QA_E2E.md` | Testing E2E desactualizado |
| `Docs/research/social-verification-api-research.md` | Research desactualizado |

---

## 2026-04-20

### fix(products): Auditoría completa + fixes P0/P1/P2 en sección describe-ai

**Problemas identificados:**
- **P0 SSRF Block**: `ALLOWED_IMAGE_PROXY_DOMAINS` no incluía `minio.wilkiedevs.com`, causando errores 500 en imágenes de productos de MinIO
- **P1 Field Mismatch**: `describeProductWithAI` re-enviaba campos en camelCase (`imageUrl`, `productName`) pero n8n esperaba snake_case (`image_url`, `product_name`, `category`)
- **P2 Error Genérico**: El catch lanzaba 500 sin distinguir tipo de error (timeout, 404, rate limit)

**Archivos modificados:**
- `backend/src/controllers/pruebalo.controller.ts` — Agregado `minio.wilkiedevs.com` y `cdn.minio.wilkiedevs.com` a la allowlist SSRF
- `backend/src/controllers/products.controller.ts` — Corregido mapping de campos + mejorado error handling con códigos específicos (400, 404, 408, 429, 5xx)

**Commits:** `c297ce2`

---

### feat(widget): conversion UX improvements on result step

**Problema:** El paso de resultado del widget no mostraba precio ni tenía CTA de compra — el usuario terminaba la prueba virtual y no sabía qué hacer después.

**Cambios implementados:**
- **P0**: `ResultDisplay` ahora muestra `productPrice` con formato COP (Intl.NumberFormat) cuando existe y no es pluginView
- **P1**: Botón WhatsApp con icono cuando `whatsappContact` está configurado (abre wa.me con número limpio)
- **P1**: "Probar otro" reducido de botón con borde a texto plano con icono — baja jerarquía visual para no competir con conversión

**Archivos modificados:**
- `ResultDisplay.tsx` — Props `productPrice` + `whatsappContact`, reordenamiento de botones
- 5 templates actualizados para pasar los nuevos props: `TemplateBare`, `TemplateLandingEmbed`, `TemplateBoldProStudio`, `TemplateModernSidebar`, `TemplateShowcase`

**Commit:** `0ad853ef`

---

### fix(csp): agregar minio.wilkiedevs.com a connect-src CSP directive

**Problema:** Error CSP "Connecting to 'https://minio.wilkiedevs.com/...' violates... connect-src directive" en el editor de productos al subir imágenes.

**Fix:** Agregado `https://minio.wilkiedevs.com` a la directive `connect-src` en:
- `src/middleware.ts` (línea 207)
- `next.config.js` (línea 36)

**Commit:** `21e0328`

---

### fix(n8n): SyntaxError en nodo "Validar Input" del workflow Try-On (`wPLypk7KhBcFLicX`)

**Problema:** El workflow de Try-On fallaba al ejecutar el nodo Code "Validar Input" con:
```
"names": ["brand_id", "product_id", "selfie_url", "product_image_url", "prompt"],
         ^
SyntaxError: Unexpected token ':'
```

**Causa raíz:** El campo `jsCode` del nodo contenía un **JSON stringificado anidado** en lugar del código JavaScript directo. La estructura real era:
```json
jsCode = "{ \"names\": [...], \"constantValues\": [], \"jsCode\": \"// código real...\" }"
```
Cuando n8n intentaba ejecutar ese string como JavaScript, el engine veía `"names": [...]` — sintaxis JSON, no JS válido — y lanzaba `SyntaxError: Unexpected token ':'`.

**Fix aplicado (vía n8n API):**
- Parseado el JSON wrapper del campo `jsCode`
- Extraído el código JavaScript real anidado en `.jsCode`
- Reemplazado `parameters.jsCode` con el código JS limpio (1999 chars)
- Verificado que el workflow quedó `active: true` y sin wrapper

**Nodo afectado:** "Validar Input" — `n8n-nodes-base.code`
**Workflow:** Virtual Try-On - Flujo Completo (`wPLypk7KhBcFLicX`)
**Estado:** Workflow activo y funcional

---

## 2026-04-19 (4:11 PM)


### Diagnóstico VPS — Steal Time 88.5%

**Problema:** n8n muy lento, Code nodes dando timeout (60s)

**Causa raíz:** Steal Time del hipervisor de Hostinger al 88.5% — el servidor físico está saturado con otras VMs ("noisy neighbor problem")

**Síntomas:**
- CPU disponible real: ~9.8%
- Steal: 88.5%
- n8n task runner timeout

**Solución pendiente:** Evaluar upgrade a KVM 4 (4 vCPUs) o migrar datacenter

**Comandos de diagnóstico ejecutados:**
```bash
# Ver CPU real (incluyendo steal)
top -c -b -n 1
# Ver steal time
grep cpu /proc/stat
# Docker stats
docker stats --no-stream
# Reiniciar n8n (no resuelve el steal)
docker restart root-n8n-1
```

---

## 2026-04-19 (12:45 PM)

### Sistema de Pool de Agentes con Dashboard — v3.0

**Descripción:**
Sammantha ahora spawnea agentes bajo demanda. Nunca hace trabajo de otros agentes. Siempre delega al especializado.

**Regla de Oro:**
```
❌ SAMMANTHA: "Voy a revisar el código del frontend..."
✅ SAMMANTHA: "Spawneo a Pixel para que revise el frontend"
```

**Archivos creados:**
- `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md` - Dashboard en tiempo real del estado de agentes
- `Cerebro/Protocolos/DELEGATION_PROTOCOL.md` - Protocolo completo de cómo delegar tareas

**Tabla de Delegación Completa:**
| Problema Descrito | Tipo | Agente |
|-------------------|------|--------|
| "El checkout falla en mobile" | Frontend/UI/Responsive | Pixel |
| "El widget de try-on no carga" | Frontend/Componente | Pixel |
| "Hay errores en el build" | Frontend/Debug | Pixel |
| "Los webhooks de Wompi no funcionan" | Pagos/Backend | Kira |
| "El login está fallando" | Auth/Seguridad | Kira |
| "Hay errores de TypeScript" | Code Review | Kira |
| "Las búsquedas están lentas" | DB/Queries | Nadia |
| "El RAG no responde bien" | IA/Embeddings | Nadia |
| "El workflow de n8n está caído" | Automatización/n8n | Nadia |
| "Quiero un reporte de leads" | Marketing/CRM | Marlo |
| "La campaña de email no envía" | Email/Marketing | Marlo |
| "El servidor está caído" | Infraestructura/VPS | Zephyr |
| "Necesito hacer deploy" | DevOps/Deploy | Zephyr |
| "Docker no arranca" | Docker/Infra | Zephyr |
| "Hay vulnerabilidades en el código" | Seguridad/Auditoría | Cipher |
| "Quiero hacer pentesting" | Seguridad | Cipher |
| "El CHANGELOG está desactualizado" | Documentación | Lina |
| "Necesito documentar X" | Documentación | Lina |

**Modelo:**
- Pool de agentes bajo control de Sammantha
- Spawneo bajo demanda cuando Sam lo pide o cuando hay tareas de su departamento
- Cada agente reporta a Sammantha, Sammantha reporta a Sam
- Dashboard actualizado después de cada spawn y completación

**Dashboard accesible en:**
- OpenClaw Control UI → Sessions (buscar labels `pixel:`, `kira:`, etc.)
- Preguntar a Sammantha: "Estado de los agentes"
- Archivo: `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md`

---

## 2026-04-19 (12:35 PM)

### Tracking de Agentes - Estado Automático

**Archivos creados:**
- `Cerebro/Estado/active_agents.json` - Estado en tiempo real de todos los agentes
- `Cerebro/Scripts/update_agent_status.sh` - Script para actualizar estado

**Funcionalidad:**
- API detecta agentes activos por labels de sesión (`pixel:`, `kira:`, etc.)
- Sammantha aparece como `busy` cuando trabaja con Sam
- Agentes delegados se marcan `busy` con `sessionKey`
- Se actualiza automáticamente al completar tareas

**Flujo:**
```
Sammantha recibe tarea → Marca agente como busy → Spawnea agente
→ Agente completa → Marca agente como offline → Sammantha notifica a Sam
```

---

## 2026-04-19 (12:30 PM)

### AgentDetailModal - Modal de Detalle de Agente

**Archivos creados:**
- `components/agents/AgentDetailModal.tsx` - Modal con información detallada del agente

**Funcionalidad:**
- Muestra estado, última actividad, herramientas disponibles
- Centrado correctamente en pantalla
- Datos reales de OpenClaw sessions

---

## 2026-04-19 (12:27 PM)

### Pixel Skills Actualizadas

**Archivo modificado:** `Cerebro/Agentes/webwizard.md`

**Skills añadidas:**
- brainstorming
- frontend-design
- ui-ux-pro-max
- verification-loop
- bug-hunter

**Stack técnico añadido:**
- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS 4
- Framer Motion 12
- Lucide React
- shadcn/ui components
- Zustand (state management)
- React Query / SWR

**Equipo de colaboración:**
- Melissa Urbano (Junior Front-End Developer)

---

## 2026-04-19 (12:07 PM)

### Mission Control Agents - Datos Reales de OpenClaw

**Trabajo completado:**
- [x] API Route: `/api/agents/status` - Consulta sesiones reales de OpenClaw
- [x] OpenClaw Client: `/lib/openclaw/client.ts` - Cliente para Gateway API
- [x] OpenClaw Sessions wrapper: `/lib/openclaw/sessions.ts`
- [x] AgentsPage actualizado: `/app/mission-control/agents/page.tsx` con polling de 30s
- [x] Verificación con Pixel: Backend corriendo, API responde con 10 agentes

**Ruta:** `/mission-control/agents`
**Polling:** 30 segundos
**Endpoints:** `http://localhost:4002` con token `fca2235a378d3882993e733b5b15b729`

---

## 2026-04-19 (Mediodía)

### Sistema de Pool de Agentes con Dashboard

**Descripción:**
Sammantha ahora spawnea agentes bajo demanda. Nunca hace trabajo de otros agentes. Siempre delega al especializado.

**Archivos creados:**
- `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md` - Dashboard en tiempo real del estado de agentes
- `Cerebro/Protocolos/DELEGATION_PROTOCOL.md` - Protocolo completo de cómo delegar tareas

**Tabla de Delegación:**
| Tarea | Agente |
|-------|--------|
| UI / Frontend | Pixel |
| Code Review / Testing | Kira |
| DB / Queries / IA / n8n | Nadia |
| Marketing / CRM / Leads | Marlo |
| Infra / VPS / Docker | Zephyr |
| Documentación | Lina |
| Seguridad / Pentesting | Cipher |
| Pagos / Auth / Webhooks | Kira |

**Modelo:**
- Pool de agentes bajo control de Sammantha
- Spawneo bajo demanda cuando Sam lo pide o cuando hay tareas de su departamento
- Cada agente reporta a Sammantha, Sammantha reporta a Sam
- Dashboard actualizado después de cada spawn y completación

**Dashboard accesible en:**
- OpenClaw Control UI → Sessions (buscar labels `pixel:`, `kira:`, etc.)
- Preguntar a Sammantha: "Estado de los agentes"
- Archivo: `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md`

**Cron Jobs:**
- Pixel: cada 30 min (deshabilitado por ahora, requiere config OpenClaw)

---

## 2026-04-18 (Mañana)

### Nuevas Funcionalidades

---

## 2026-04-14

### Sistema de Agentes v2.0

**Cambios principales:**
- 10 agentes con nombres nuevos
- Modelo default: MiniMax-M2.7 (Groq/DeepSeek removidos)
- Melissa como colaboradora de Pixel
- Regla 6: Notificación obligatoria de tareas

**Archivos actualizados:**
- REGLAS_IMPORTANTES.md
- AGENTS.md

---

## 2026-04-12

### Fix CRÍTICO - Secretos en docker-compose

**Archivos modificados:**
- `docker-compose.yml` - Secretos removidos, ahora usa .env

---

## 2026-04-11

### Fix CRÍTICO - Precios Inconsistentes

**Problema:** Precios diferentes entre /terminos y /planes

**Solución:**
- Unificados precios en Supabase `pricing_config`
- Creada función `getPricingConfig()` en `@/lib/pricing`
- Removidos precios hardcodeados del frontend

---

## 2026-04-10

### Fix URLs 404 en Sitemap

**Problema:** Google indexando URLs obsoletas que causan 404

**Solución:**
- Implementadas redirecciones 301 en `next.config.js`
- Actualizado sitemap dinâmico

---

## 2026-04-09

### Fix Trial Confundidor

**Problema:** Usuarios confundían trial gratis vs trial de $20.000 COP

**Solución:**
- Clarificado messaging: "Trial de $20.000 COP" no "gratis"
- Actualizado copy en landing y checkout
- Agregado tooltip explicativo

---

## 2026-04-22

### docs(brain-vault): Limpieza de archivos obsoletos

**Archivos ELIMINADOS (duplicados o claramente obsoletos):**
- `Cerebro/Config/openclaw_MASTER_*.json` (17 archivos) — Backups temporales de configuración openclaw
- `Cerebro/Logs/CHANGELOG.md` — Duplicado de `Cerebro/CHANGELOG.md`
- `Cerebro/Logs/CHANGELOG_ARCHIVE_2026_Q1.md` — Histórico antiguo, info cubierta en CHANGELOG principal
- `Cerebro/Logs/CHANGELOG_ARCHIVE_2026_04_06.md` — Histórico antiguo duplicado
- `Cerebro/Logs/gcp_usage_log.md` — Pricing antiguo de GCP (ya no se usa imagen-3.0)
- `Cerebro/Docs/n8n_guide.md` — Duplicado de `Cerebro/Docs/Guias/n8n_guide.md`
- `Cerebro/Docs/PENDING_uptime_monitoring.md` — Configuración completada, sin valor actual
- `Cerebro/Docs/PENDING_whatsapp_bot.md` — Solo planning, nunca implementado
- `Cerebro/PARRILLA_REDES_SOCIALES.md` — Parrilla antigua de contenido (reemplazada por procesos actuales de Rebecca)

**Archivos MANTENIDOS (Sam los leerá después):**
- `Cerebro/Docs/design/RUNPOD_*.md` — Documentación RunPod para lectura posterior
- `Cerebro/Docs/SHOPIFY_INTEGRATION.md` — Integración Shopify para lectura posterior
- `Cerebro/Archive/` — Carpeta con archivos archive (sin cambios)

---

_Last updated: 2026-04-22 12:00 UTC-5_