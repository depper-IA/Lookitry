# Sincronización y Mirroring de Rama Juli (2026-04-21)

## Resumen
La rama `Juli` ha sido reseteada para ser una copia exacta de la rama `main`. Esto asegura que el entorno de desarrollo tenga los últimos 92+ commits de la arquitectura estable.

---

## Cambios Realizados
- **Reset Hard**: `Juli` local y remota sincronizadas exactamente con `origin/main`.
- **Limpieza de Divergencias**: Se eliminaron configuraciones de agentes locales para priorizar la estructura oficial del repositorio.
- **Estructura Brain Vault**: Integración completa de la nueva organización del Cerebro.

---

# Sammy 24/7 + Segundo Cerebro RAG (2026-04-09)


## Resumen
Implementación de dos sistemas críticos de infraestructura: Sammy como agente 24/7 en Docker y el "Segundo Cerebro" para conocimiento del proyecto con RAG.

---

## Fase 1: Sammy 24/7 en Docker Production

### Arquitectura Implementada
- **Opción elegida**: Microservicio Sammy integrado en `docker-compose.backend.yml`
- **Contenedor**: `lookitry-sammy` (Node 20 Alpine custom build)
- **RAM**: Target &lt;200MB (límite 300MB, reserva 100MB)
- **Restart**: `restart: always` para uptime continuo
- **Volumen**: `sammy_data` persistente para SQLite

### Archivos Creados/Modificados
- `sammy/` — Directorio completo del agente (Dockerfile, src/, config/)
- `docker-compose.backend.yml` — Servicio Sammy agregado
- `scripts/_deploy_now.py` — Detecta cambios en `sammy/` para rebuild

### Variables de Entorno Requeridas (Producción)
| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `TELEGRAM_BOT_TOKEN` | **SÍ** | Token del bot de Telegram |
| `TELEGRAM_ALLOWED_USER_IDS` | Opcional | IDs autorizados |
| `GROQ_API_KEY` | Al menos uno | API para LLM |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Opcional | Sync actividad |

### Compatibilidad con `_deploy_now.py`
- Detecta cambios en `sammy/` → rebuild backend completo
- No requiere cambios en el flujo de deploy existente

---

## Fase 2: Segundo Cerebro — RAG + NotebookLM Bridge

### 2A: RAG para Agentes (Embeddings de Documentación)

#### Tabla `project_knowledge`
```sql
CREATE TABLE project_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  version TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índice IVFFlat para búsqueda vectorial
-- RPC: upsert_project_knowledge, search_project_knowledge
```

#### Workflows n8n Creados
| Workflow | Archivo | Función |
|----------|---------|---------|
| Project Knowledge RAG | `project-knowledge-rag-workflow.json` | Indexa docs con embeddings |
| NotebookLM Drive Sync | `notebooklm-drive-sync-workflow.json` | Sincroniza a Google Drive |

#### Archivos Indexados
1. PRD.md
2. DESIGN.md
3. TECH_STACK.md
4. REGLAS_IMPORTANTES.md
5. CHANGELOG.md (recientes)

#### Endpoints Backend (`agent.routes.ts`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/agent/rag/search` | POST | Búsqueda semántica |
| `/api/agent/rag/stats` | GET | Estadísticas RAG |
| `/api/agent/rag/list` | GET | Documentos indexados |
| `/api/agent/rag/index` | POST | Indexación manual |

### 2B: Puente NotebookLM (Google Drive Sync)

#### Script: `sync_project_knowledge.py`
- Detecta cambios en commits recientes
- Sincroniza archivos .md a carpeta Google Drive
- Soporta modo hook (`--git-hook`) y manual (`--files`)

#### Git Hook: `scripts/git-hooks/post-receive`
- Automatiza sync en cada push a main
- Ejecuta `sync_project_knowledge.py --git-hook`

---

## Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `sammy/` (directorio) | Agente Sammy completo |
| `supabase/migrations/20260409_create_project_knowledge.sql` | Schema + RPC |
| `docs/n8n/workflows/project-knowledge-rag-workflow.json` | Workflow RAG |
| `docs/n8n/workflows/notebooklm-drive-sync-workflow.json` | Workflow Drive |
| `scripts/sync_project_knowledge.py` | Script sync |
| `scripts/git-hooks/post-receive` | Git hook |
| `docs/PROJECT_KNOWLEDGE_RAG.md` | Documentación |
| `backend/src/routes/agent.routes.ts` | Endpoints RAG |

---

## Actualización TECH_STACK.md

### Sección 4.2 (Contenedores Docker)
Agregado `lookitry-sammy` a la tabla de contenedores.

### Sección 5.29 (Nueva tabla `project_knowledge`)
Documentación completa del schema RAG.

### Sección 6.1 (Flujos n8n)
Agregados:
- `Project Knowledge RAG` → `/webhook/project-knowledge-rag`
- `NotebookLM Drive Sync` → `/webhook/notebooklm-sync`

### Sección 6.3 (RAG)
Ampliado para incluir Project Knowledge + flujo NotebookLM.

---

# Actualización Documentación Widget (2026-04-06)

## Resumen
Aclaración de la arquitectura del widget: **script (`widget.js`) es el método principal**, iframe (`/embed/[brandSlug]`) es **legacy** y solo para fallback/integraciones específicas.

## Archivos Modificados
- `PRD.md` — Actualizado descripción de Widget Embebido
- `README.md` — Corregido método de integración a widget script
- `docs/SHOPIFY_INTEGRATION.md` — Método 3 marcado como legacy
- `docs/WIDGET_GUIDE.md` — **NUEVO** documento con guía técnica completa del widget

## Detalle de Cambios
- Widget script (`/widget.js`) es el método principal y recomendado
- Embed iframe (`/embed/[brandSlug]`) es legacy: fallback cuando script falla + integraciones específicas de cliente
- Plugin WooCommerce usa script primero, iframe como fallback

---

# Lookitry System Stability & Admin Stats Emergency Fix (2026-03-31)

This entry documents the successful resolution of a critical Error 500 in the administrative statistics panel and the subsequent emergency recovery from file corruption ("mojibake") that occurred during automated code editing.

## Critical Fixes: Admin Stats (Error 500)
- **Backend (`AdminService.ts`)**:
  - Implemented **Defensive Coding** in `getConversionStats` to safely handle missing or null `social_links`.
  - Added robust checks for `payment.brands` in the `getPayments` query to prevent runtime crashes from orphan payment records.
  - Temporarily removed the `reference` column from conversion statistics query to prevent a 500 error if the database migration wasn't fully propagated.
- **Frontend (`AdminConversionPage`, `AdminDashboard`)**:
  - Added **Frontend Hardening** via optional chaining (`?.`) and fallback default objects (e.g., empty arrays `[]`) for all statistical charts and lists.
  - Ensured the dashboard remains operational even if specific segments of the statistics API return null or malformed data.

## Emergency Restoration
- **Hard Reset**: Reverted the Lookitry repository (local and remote) to the last stable state (`fee8e63`) to purge structural code corruption from the previous session.
- **System Synchronization**: Executed a full `--no-cache` deployment to ensure the production VPS is clean and free of leftover mojibake fragments.

## Code Integrity & Blindage
- **Encoding Management**: Enforced UTF-8 encoding for all terminal operations to prevent future character corruption.
- **Atomic Edits**: Transitioned to synchronous, verified file editing to ensure buffer cleanliness during automated code modifications.
