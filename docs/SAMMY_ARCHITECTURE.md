# Arquitectura del Sistema Multi-Agente — Lookitry

> **Última actualización:** 2026-04-09  
> **Propósito:** Referencia técnica completa del orchestrator Sammy y todos sus agentes, sus componentes internos, rutas de archivos, entornos y reglas de operación. Leer este documento antes de hacer cualquier cambio al sistema de agentes.

---

## Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Sammy — El Orquestador](#2-sammy--el-orquestador)
   - [Arquitectura Interna](#21-arquitectura-interna)
   - [Módulos y Archivos](#22-módulos-y-archivos)
   - [LLM Manager — Cadena de Proveedores](#23-llm-manager--cadena-de-proveedores)
   - [Herramientas Disponibles (Tools)](#24-herramientas-disponibles-tools)
   - [Telegram Bot — Comandos y Handlers](#25-telegram-bot--comandos-y-handlers)
   - [Servicios de Sincronización](#26-servicios-de-sincronización)
   - [Puente Local — Listener](#27-puente-local--listener)
   - [Variables de Entorno](#28-variables-de-entorno)
   - [Despliegue en VPS](#29-despliegue-en-vps)
3. [Agentes Especializados](#3-agentes-especializados)
   - [WebWizard — Frontend y UX](#31-webwizard--frontend-y-ux)
   - [DevGuardian — Calidad y Seguridad](#32-devguardian--calidad-y-seguridad)
   - [DataAlchemist — Base de Datos e IA](#33-dataalchemist--base-de-datos-e-ia)
   - [GrowthPilot — CRM y Marketing](#34-growthpilot--crm-y-marketing)
   - [ArchitectAI — Infraestructura y DevOps](#35-architectai--infraestructura-y-devops)
   - [DocsWriter — Documentación](#36-docswriter--documentación)
4. [Protocolo de Delegación](#4-protocolo-de-delegación)
5. [Reglas de Oro del Sistema](#5-reglas-de-oro-del-sistema)
6. [Cómo Agregar un Nuevo Agente](#6-cómo-agregar-un-nuevo-agente)
7. [Comandos Rápidos de Administración](#7-comandos-rápidos-de-administración)

---

## 1. Visión General del Sistema

```
                    ┌──────────────────────────────────────────┐
                    │             USUARIO (tú)                  │
                    └──────────┬────────────────────────────────┘
                               │
                    Via Telegram o via OpenCode IDE
                               │
                    ┌──────────▼────────────────────────────────┐
                    │   SAMMY (Orquestador — VPS + Local)       │
                    │   Modelo: MiniMax-M2.7 → Groq fallback    │
                    └──────┬────────────────────────────────────┘
                           │ delegate_task_to_local via Supabase
          ┌────────────────┼────────────────────────────────────┐
          │                │                │                   │  
    ┌─────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐  ┌───────▼─────┐
    │ WebWizard  │  │ DevGuardian │  │DataAlchemist│  │  ArchitectAI│
    │ (Frontend) │  │ (Seguridad) │  │ (DB + n8n)  │  │  (Infra)    │
    └────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                              │
                    ┌─────────▼────────┐
                    │    GrowthPilot   │
                    │ (CRM + Marketing)│
                    └──────────────────┘
```

**Flujo de operación:**
1. Usuario envía mensaje por Telegram (o directamente invoca agente en OpenCode con `@nombre`).
2. Sammy (corriendo en VPS) recibe el mensaje, razona con MiniMax-M2.7.
3. Si la tarea requiere acceso al PC local (editar archivos, deployar), Sammy inserta un registro en la tabla `agent_delegations` de Supabase.
4. El listener local (`sammy/local-scripts/listener.ts`) escucha cambios en Supabase Realtime y al detectar el registro, lanza el agente correcto en una ventana de OpenCode.

---

## 2. Sammy — El Orquestador

**Definición de agente (para OpenCode):** `.opencode/agents/sammy.md`  
**Código fuente:** `sammy/`  
**Estado:** Corriendo en VPS → `lookitry-backend` container (junto al backend Express)  
**Bot de Telegram:** `@LookitryBot` (token en `.env`)

### 2.1 Arquitectura Interna

```
sammy/
├── src/
│   ├── index.ts              ← Punto de entrada. Orquesta todo el startup.
│   ├── agent/
│   │   └── index.ts          ← Clase Agent: loop de razonamiento + tool calls
│   ├── bot/
│   │   └── index.ts          ← TelegramBot: handlers de mensajes, audio, fotos
│   ├── commands/
│   │   └── agent-commands.ts ← Parser de comandos en español + generador de respuestas
│   ├── config/
│   │   └── env.ts            ← Validación de variables de entorno con Zod
│   ├── llm/
│   │   └── index.ts          ← LLMManager + Proveedores (MiniMax, Groq, OpenRouter)
│   ├── memory/
│   │   └── sqlite.ts         ← Memoria persistente en SQLite (historial por conversación)
│   ├── opencode/
│   │   └── (cliente para OpenCode Server cuando aplica)
│   ├── project/
│   │   └── (contexto del proyecto)
│   ├── sync/
│   │   ├── supabase-sync.ts  ← Sincroniza actividad de agentes con Supabase REST
│   │   └── heartbeat.ts      ← Envía heartbeats cada 30s al backend
│   ├── tools/
│   │   └── index.ts          ← ToolRegistry + todas las herramientas (7 tools)
│   └── types/
│       └── index.ts          ← Definiciones de tipos TypeScript
├── local-scripts/
│   └── listener.ts           ← Escucha tabla agent_delegations via Supabase Realtime
├── Dockerfile                ← Build + runner (node:20-alpine, 2 stages)
├── .env                      ← Variables locales (dev)
├── .env.production           ← Variables de producción (se sube al VPS por deploy script)
└── package.json
```

### 2.2 Módulos y Archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `src/index.ts` | Startup: crea config, inicializa memoria SQLite, LLM providers, ToolRegistry, Agent, TelegramBot, AgentActivitySync y HeartbeatService. |
| `src/agent/index.ts` | Loop de razonamiento: construye system prompt desde `sammy.md` + contexto de proyecto, itera hasta respuesta final o límite de iteraciones (default: 10). |
| `src/bot/index.ts` | Wrapper de [grammY](https://grammy.dev/). Maneja autenticación por user_id, dispatch de texto/audio/fotos/comandos. |
| `src/commands/agent-commands.ts` | Parser NLP en español: reconoce intenciones como "cómo va WebWizard", "actividad de hoy", "dame el reporte", "delegar a ArchitectAI...". |
| `src/config/env.ts` | Schema Zod para validar `.env`. Las keys opcionales tienen default vacío. |
| `src/llm/index.ts` | LLMManager con chain de fallback: MiniMax → Groq. OpenRouter está registrado pero **siempre skipeado** (regla REGLAS_IMPORTANTES.md). Incluye retry con backoff exponencial. |
| `src/memory/sqlite.ts` | SQLite via `better-sqlite3`. Guarda historial por `conversationId`, limita a 15 mensajes por contexto. |
| `src/tools/index.ts` | ToolRegistry con 7 tools: `get_current_time`, `list_files`, `read_file`, `search_code`, `git_status`, `read_project_context`, `delegate_task_to_local`. |
| `src/sync/supabase-sync.ts` | Sincroniza logs de actividad a `api.lookitry.com/api/agent/activity` cada 30 segundos. |
| `src/sync/heartbeat.ts` | Envía heartbeat a `api.lookitry.com/api/agent/heartbeat` cada 30 segundos. Reporta estado `idle` o `working`. |
| `local-scripts/listener.ts` | Corre en la PC LOCAL. Escucha INSERT en `agent_delegations` via websocket Supabase Realtime. Cuando detecta una tarea, abre una ventana cmd.exe con `opencode -a <agente> "<prompt>"`. |

### 2.3 LLM Manager — Cadena de Proveedores

**Orden de prioridad (estricto):**

```
1. MiniMax-M2.7    → endpoint: https://api.minimaxi.chat/v1/text/chatcompletion_v2
                     max_tokens: 4096, temperature: 0.2, retry: 3x con 1.5s backoff
                     
2. Groq (llama-3.3-70b-versatile) → endpoint: https://api.groq.com/openai/v1/chat/completions
                     max_tokens: 1024, temperature: 0.2, retry: 3x con 1s backoff
                     ⚠️ Límite: 100.000 tokens/día (nivel gratuito)
                     
3. OpenRouter      → SIEMPRE SKIPEADO en el loop general.
                     Solo usa llamadas directas al API de n8n para generación de imágenes del widget.
```

**Implementación de skip de OpenRouter:**
```typescript
// src/llm/index.ts — LLMManager.complete()
for (const provider of this.providers) {
  if (provider.name === 'openrouter') continue; // ← REGLAS_IMPORTANTES.md
  try {
    return await provider.complete(messages, tools);
  } catch (err) {
    // log y continuar al siguiente
  }
}
```

### 2.4 Herramientas Disponibles (Tools)

Sammy puede llamar estas funciones durante el razonamiento:

| Tool | Descripción | Parámetros |
|------|-------------|-----------|
| `get_current_time` | Hora actual en zona horaria local (Colombia) | ninguno |
| `list_files` | Lista archivos de una carpeta del proyecto | `path` (relativo, default: `.`) |
| `read_file` | Lee contenido de un archivo del proyecto | `path` (requerido) |
| `search_code` | Busca texto en el proyecto (usa ripgrep si existe, sino recursivo) | `query`, `path` (opcional) |
| `git_status` | Git status corto del proyecto | ninguno |
| `read_project_context` | Retorna el contexto del proyecto (root + env) | ninguno |
| `delegate_task_to_local` | Inserta registro en `agent_delegations` de Supabase para que el listener local lance el agente | `target_agent`, `prompt` |

**Seguridad:** Todos los paths se validan con `toSafeProjectPath()` — si la ruta cae fuera del `PROJECT_ROOT`, se lanza error. Sammy nunca puede leer archivos fuera del repo.

### 2.5 Telegram Bot — Comandos y Handlers

**Autenticación:** Solo los user IDs en `TELEGRAM_ALLOWED_USER_IDS` pueden interactuar. Cualquier otro recibe "You are not authorized".

| Trigger | Tipo | Comportamiento |
|---------|------|----------------|
| Cualquier texto no `/comando` | `message:text` | Se pasa al Agent para razonamiento completo |
| `/start` | Comando | Saludo inicial en español |
| `/status` | Comando | Confirma que Sammy está activo + hora |
| `/help` | Comando | Lista funcionalidades y comandos |
| Mensaje de voz / audio | `message:voice`, `message:audio` | Handler preparado (`onAudio`), actualmente no conectado en `index.ts` — leer bot para habilitarlo |
| Foto | `message:photo` | Handler preparado (`onPhoto`), actualmente no conectado en `index.ts` |

**Comandos en español reconocidos (NLP):**

| Patrón | Comando interno | Ejemplo |
|--------|----------------|---------|
| "cómo va WebWizard" | `stats` | Stats del agente |
| "actividad de WebWizard hoy" | `activity` | Actividad reciente |
| "qué están haciendo los agentes" | `overview` | Estado global |
| "muéstrame los errores de hoy" | `errors` | Errores recientes |
| "dame el reporte de esta semana" / "cómo vamos" | `report` | Reporte de métricas |
| "dashboard" | `dashboard` | (en desarrollo) |
| "delegar a ArchitectAI [tarea]" | `delegate` | Delegación manual |

### 2.6 Servicios de Sincronización

#### AgentActivitySync (`src/sync/supabase-sync.ts`)
- **Qué hace:** Acumula logs de actividad en una cola en memoria y cada 30 segundos los sincroniza vía `POST /api/agent/activity` y `PUT /api/agent/activity/:id`.
- **Requiere:** `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` + `API_BASE_URL`
- **Si faltan:** Se deshabilita automáticamente (no crashea).

#### HeartbeatService (`src/sync/heartbeat.ts`)
- **Qué hace:** Envía `POST /api/agent/heartbeat` cada 30 segundos.
- **Endpoint:** `https://api.lookitry.com/api/agent/heartbeat`
- **Payload:** `{ agentName: "sammy", status: "idle"|"working", taskId?, taskDescription? }`
- **Propósito:** El dashboard admin muestra agentes activos en tiempo real.

### 2.7 Puente Local — Listener

**Archivo:** `sammy/local-scripts/listener.ts`  
**Corre en:** Tu PC (Windows), no en el VPS.  
**Cómo iniciarlo:**
```bash
cd sammy
npx ts-node local-scripts/listener.ts
# O si ya está compilado:
node dist/local-scripts/listener.js
```

**Cómo funciona:**
1. Se conecta a Supabase Realtime usando `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` del `sammy/.env`.
2. Suscribe a INSERT en `agent_delegations` tabla.
3. Cuando Sammy (desde el VPS) delega una tarea, inserta un registro con `target_agent` y `prompt`.
4. El listener detecta el INSERT, abre una nueva ventana de `cmd.exe` con:
   ```
   opencode -a WebWizard "la tarea delegada"
   ```
5. Actualiza el registro a `status: 'completed'` o `status: 'failed'`.

**Tabla Supabase:** `agent_delegations`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `target_agent` | text | Nombre del agente (ej: "WebWizard") |
| `prompt` | text | Tarea a ejecutar |
| `status` | text | `pending` → `completed` / `failed` |
| `error_message` | text | Error si falló |

**Para que funcione:** El listener debe estar corriendo en tu PC cuando Sammy intente delegar. Si el PC está apagado, la tarea queda en `pending` y se ejecutará cuando el listener vuelva a conectarse (o no — no hay cola persistente implementada aún).

### 2.8 Variables de Entorno

#### `.env` (local dev) y `.env.production` (subido al VPS automáticamente al deployar)

| Variable | Requirida | Descripción |
|----------|-----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token del bot de Telegram |
| `TELEGRAM_ALLOWED_USER_IDS` | Opcional | IDs autorizados, separados por comas |
| `MINIMAX_API_KEY` | ✅ Principal | Key de MiniMax (formato: `sk-cp-...`) |
| `MINIMAX_MODEL` | Opcional | Default: `MiniMax-M2.7` |
| `GROQ_API_KEY` | ✅ Fallback | Key de Groq para Llama-3.3-70b |
| `OPENROUTER_API_KEY` | Ignorado | Registrado pero nunca usado por Sammy |
| `OPENROUTER_MODEL` | Ignorado | Ignorado |
| `SUPABASE_URL` | Opcional | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Opcional | Service role key de Supabase |
| `SUPABASE_SYNC_INTERVAL_MS` | Opcional | Default: 30000 |
| `API_BASE_URL` | Opcional | Default: `https://api.lookitry.com` |
| `DB_PATH` | Opcional | Ruta SQLite. Local: `./memory.db`, VPS: `/data/memory.db` |
| `PROJECT_ROOT` | Opcional | Raíz del proyecto. Local: `C:/Users/Matt/Lookitry`, VPS: `/app/project` |
| `MAX_AGENT_ITERATIONS` | Opcional | Default: 10 |
| `NODE_ENV` | Opcional | `development` / `production` |

> **¡CRÍTICO!** El archivo `.env.production` se sube automáticamente al VPS cada vez que corres `python scripts/_deploy_now.py --backend`. Si cambias una key, actualiza ese archivo **primero** antes de deployar.

### 2.9 Despliegue en VPS

**Ruta en VPS:** `/root/virtual-tryon/sammy/`  
**Contenedor:** Sammy corre **dentro del mismo contenedor que el backend Express** (`lookitry-backend`).

**Para deployar cambios en Sammy:**
```bash
# Desde tu PC en c:\Users\Matt\Lookitry
python scripts/_deploy_now.py --backend
```
El script:
1. Se conecta via SSH al VPS (`31.220.18.39`).
2. Sube `sammy/.env.production` al VPS.
3. Hace `git pull` del repo.
4. Rebuild del container `lookitry-backend`.
5. Restart del container.

**Para ver logs de Sammy en producción:**
```bash
ssh root@31.220.18.39
docker logs -f lookitry-backend --tail=100
```

---

## 3. Agentes Especializados

Todos los agentes están definidos en `.opencode/agents/` y se invocan con `@nombre` en OpenCode o via delegación de Sammy.

### 3.1 WebWizard — Frontend y UX

**Archivo:** `.opencode/agents/webwizard.md`  
**Modo:** `subagent` (trabaja en el IDE, no en VPS)  
**Modelo:** MiniMax-M2.7 → DeepSeek Coder (fallback)

**Responsabilidades:**
- Widget de try-on (`/pruebalo/[slug]`, `/embed/[slug]`)
- Dashboard del cliente (`/dashboard/*`)
- Mini-landings (`/marca/[slug]`, `/sitio/[slug]`)
- Checkout y pagos del frontend
- Landing principal y registro

**Stack que maneja:** Next.js 14, Tailwind CSS, TypeScript, Framer Motion, @supabase/supabase-js

**MCPs:** Supabase (datos de marcas/productos), n8n (status de workflows)

**Archivos clave:**
```
frontend/src/app/              — Rutas App Router
frontend/src/components/       — Componentes
frontend/src/app/pruebalo/     — Widget try-on
frontend/src/app/sitio/        — Mini-landing
```

**Design system obligatorio:**
```css
--bg-base: #0a0a0a;
--bg-card: #141414;
--accent: #FF5C3A;
--text-primary: #ffffff;
--text-secondary: #999999;
/* PROHIBIDO: #333, #444, #555 para texto */
```

---

### 3.2 DevGuardian — Calidad y Seguridad

**Archivo:** `.opencode/agents/devguardian.md`  
**Modo:** `subagent`  
**Modelo:** MiniMax-M2.7 → DeepSeek Coder (fallback), Groq para reviews rápidos

**Responsabilidades:**
- Validación de firmas Wompi/PayPal en webhooks
- Seguridad de autenticación JWT
- Rate limiting y Turnstile
- Idempotencia en pagos
- Tests unitarios

**Checklist de pago (obligatorio antes de cualquier merge):**
```
[ ] Firma del webhook validada ANTES de lógica
[ ] Monto verificado contra BD
[ ] Status verificado con API del proveedor
[ ] Idempotencia implementada
[ ] Sin datos sensibles en logs
```

**MCPs:** Supabase (RLS audits, logs de pago), Context7 (docs de seguridad)

**Archivos clave:**
```
backend/src/services/wompi.service.ts
backend/src/services/paypal.service.ts
backend/src/services/subscription.service.ts
backend/src/middleware/auth.middleware.ts
```

---

### 3.3 DataAlchemist — Base de Datos e IA

**Archivo:** `.opencode/agents/dataalchemist.md`  
**Modo:** `subagent`  
**Modelo:** MiniMax-M2.7 → DeepSeek Coder (fallback)

**Responsabilidades:**
- Schemas y migraciones Supabase/PostgreSQL
- Queries y optimización de índices
- Sistema RAG con pgvector (embeddings de feedback)
- Flujos n8n (try-on, descriptor, blog, enterprise-sync)
- Cache Redis (`brandConfigCache`)

**n8n Webhooks que gestiona:**

| Función | Webhook Path | Workflow ID |
|---------|-------------|-------------|
| Try-On principal | `/webhook/tryon` | `wPLypk7KhBcFLicX` |
| Descriptor IA | `/webhook/descriptor` | `ZjVTV3QxoPEi60GX` |
| Error handling | automático | `PNri7NdZYkZhpPnm` |
| Blog | `/api/blog/webhook` | `fZxYlA62msyJM8Nx` |

**Regla crítica n8n:** NUNCA crear workflows nuevos sin autorización. SIEMPRE hacer backup (exportar JSON) antes de modificar un workflow activo.

**MCPs:** Supabase (pleno acceso), n8n (CRUD completo de workflows), Context7 (docs PostgreSQL/pgvector)

---

### 3.4 GrowthPilot — CRM y Marketing

**Archivo:** `.opencode/agents/growthpilot.md`  
**Modo:** `subagent`  
**Modelo:** MiniMax-M2.7 → DeepSeek Coder (fallback), Groq para prospección

**Responsabilidades:**
- Pipeline de leads (con Google Places API)
- Campañas de email via Brevo (300/día, batch de 50 cada 10 min)
- Programa de referidos
- Métricas de conversión

**Pipeline de lead:**
```
NEW → CONTACTED → QUALIFIED → INTERESTED → CONVERTED → LOST
```

**Score de lead (0-100):**
- +20 website propio, +15 Instagram activo, +10 Facebook página
- +10 TikTok, +10 rating Google >=4.0, +10 >50 reviews
- Score >=60: alta prioridad, 40-59: media, <40: baja

**MCPs:** Supabase (leads, campaigns, referidos), Hostinger (métricas VPS)

---

### 3.5 ArchitectAI — Infraestructura y DevOps

**Archivo:** `.opencode/agents/architectai.md`  
**Modo:** `subagent`  
**Modelo:** MiniMax-M2.7 → DeepSeek Coder (fallback), Groq para configs simples

**Responsabilidades:**
- Docker, VPS, reverse proxy (Traefik)
- Deployments y rollbacks
- Cron jobs del sistema
- **Creación de nuevos agentes** (cuando Sammy lo delega → crea `.md` en `.opencode/agents/`)
- Escalabilidad y ADRs

**Infraestructura actual:**

| Contenedor | Puerto |
|-----------|--------|
| `lookitry-frontend` | 3000 |
| `lookitry-backend` | 3001 |
| `root-n8n-1` | interno |
| `minio` | interno |

**Cron jobs del sistema:**
```
08:00 diario   — Subscription check (suscripciones expiradas)
cada 6h        — Usage alerts (80%/100% de generaciones)
03:00 diario   — Temp cleanup (selfies temporales)
cada 5min      — Email campaigns (procesar campañas programadas)
```

**MCPs:** Hostinger (VPS ID: 1004711), Supabase (DB configs)

---

### 3.6 DocsWriter — Documentación

**Archivo:** `.opencode/agents/docs-writter.md`  
**Modo:** `subagent`  
**Modelo:** Groq (llama-3.3-70b-versatile)

**Responsabilidades:**
- Actualizar `PRD.md`, `TECH_STACK.md`, `CHANGELOG.md` tras cada cambio
- Archivar CHANGELOG cuando supere 500 líneas o 30 días (`CHANGELOG_ARCHIVE_YYYY_MM.md`)
- Mantener `REGLAS_IMPORTANTES.md` al día

---

## 4. Protocolo de Delegación

### Desde Sammy (vía tool `delegate_task_to_local`)

```
DELEGAR → [NombreAgente]
TAREA: descripción clara y específica
CONTEXTO: archivos relevantes, ambiente, brandId si aplica
URGENCIA: crítico | normal | mejora futura
DEPENDENCIA: si esta tarea bloquea otra
```

Sammy inserta en `agent_delegations`:
```json
{
  "target_agent": "WebWizard",
  "prompt": "Corregir el color del botón en /pruebalo/[slug] para que use primary_color de la marca"
}
```

El **listener local** detecta el registro → lanza:
```bash
opencode -a webwizard "Corregir el color del botón en /pruebalo/[slug]..."
```

### Desde OpenCode directamente

```bash
# En el terminal de OpenCode:
@WebWizard [tarea directa]
@DevGuardian revisa el módulo de pagos
@DataAlchemist optimiza la query de generations
```

### Matriz de delegación entre agentes

| Quien delega → | WebWizard | DevGuardian | DataAlchemist | ArchitectAI | GrowthPilot |
|----------------|-----------|-------------|---------------|-------------|-------------|
| **WebWizard** | — | Si toca pagos/auth | Si necesita datos de API | Si cambia estructura | — |
| **DevGuardian** | — | — | Queries DB / performance | Cambios infra | — |
| **DataAlchemist** | — | Vulnerabilidades SQL | — | Cambios infra DB | — |
| **GrowthPilot** | Landings campañas | Datos sensibles | Analytics/embeddings | — | — |
| **ArchitectAI** | — | Seguridad infra | Schemas/índices | — | — |

---

## 5. Reglas de Oro del Sistema

1. **MiniMax Primero:** Sammy y todos los agentes deben intentar MiniMax-M2.7 antes que cualquier otro modelo.

2. **OpenRouter = Solo Imágenes:** OpenRouter se usa EXCLUSIVAMENTE para el flujo de try-on de imágenes en n8n. **Prohibido** usarlo para razonamiento, chat o tareas de agentes.

3. **Groq como Emergencia:** Groq tiene límite de 100.000 tokens/día (plan gratuito). Si Sammy agota el cupo, las respuestas fallarán hasta que reinicie el contador (al día siguiente). Si ves error 429, verificar que MiniMax esté respondiendo.

4. **Sin Deploy sin Autorización:** Ningún agente hace `git push` ni `python scripts/_deploy_now.py` sin confirmación explícita del usuario.

5. **Programación Defensiva:** Optional chaining (`?.`) en todos los accesos a datos de API. `maybeSingle()` en lugar de `.single()` en Supabase.

6. **REGLAS_IMPORTANTES.md es la ley:** Si hay conflicto entre este documento y `REGLAS_IMPORTANTES.md`, gana `REGLAS_IMPORTANTES.md`.

---

## 6. Cómo Agregar un Nuevo Agente

1. **Identificar la necesidad:** Consultar con Sammy ("el equipo necesita un agente de X?").
2. **Sammy delega a ArchitectAI:** ArchitectAI crea el `.md` en `.opencode/agents/`.
3. **Estructura del archivo:**

```markdown
---
name: nombreagente
mode: subagent
description: "Descripción concisa del rol"
tools:
  read_file: true
  edit_file: true
  write_file: true
  grep_search: true
  list_dir: true
  bash: true
---

# NombreAgente — Agente de [Área]

## Identidad
## Modelos de Lenguaje
## MCPs Disponibles
## Responsabilidades
## Optimización de Tokens (máx 150 líneas/respuesta)
## Cuándo Delegar
## Archivos Clave
## Prompt de Activación
```

4. **Documentar aquí:** Agregar sección en este archivo bajo `## 3. Agentes Especializados`.
5. **Actualizar `AGENTS.md`:** Agregar a la tabla de agentes.
6. **Actualizar `TECH_STACK.md`:** Si el agente usa MCPs o herramientas nuevas.

---

## 7. Comandos Rápidos de Administración

### Ver logs de Sammy en producción
```bash
ssh root@31.220.18.39
docker logs -f lookitry-backend --tail=100
```

### Reiniciar Sammy sin deployar
```bash
ssh root@31.220.18.39
docker restart lookitry-backend
```

### Iniciar el listener local (puente local)
```bash
# En PowerShell, desde c:\Users\Matt\Lookitry\sammy
npx ts-node local-scripts/listener.ts
```

### Deployar cambios en Sammy al VPS
```bash
# Desde c:\Users\Matt\Lookitry
python scripts/_deploy_now.py --backend
```

### Verificar la MINIMAX_API_KEY en producción
```bash
ssh root@31.220.18.39
cat /root/virtual-tryon/sammy/.env.production | grep MINIMAX
```

### Verificar que MiniMax está siendo usado (en logs)
Buscar en los logs:
- ✅ `📡 Llamando a MiniMax (MiniMax-M2.7)...` → MiniMax está activo
- ⚠️ `⚠️ Provider minimax falló: ...` → Cayó al fallback Groq
- ⚠️ `🔄 Intentando con proveedor: groq` → Usando Groq como fallback

### Actualizar la MINIMAX_API_KEY
1. Editar `sammy/.env.production` en local con la nueva key.
2. Editar `sammy/.env` en local (para desarrollo).
3. Correr `python scripts/_deploy_now.py --backend` para subir al VPS.

---

*Documento mantenido por DocsWriter. Actualizar cada vez que se agregue un agente, se cambie el LLM manager, o se modifiquen las variables de entorno.*
