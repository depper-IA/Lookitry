# Project Knowledge RAG System

Sistema bidireccional de conocimiento para indexar documentación del proyecto y hacerla accesible a los agentes de IA.

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Git Push/Commit │────▶│  post-receive    │────▶│  sync_project_knowledge.py  │
└─────────────────┘     │     hook         │     └──────────┬──────────┘
                        └──────────────────┘                │
                                                            │
                        ┌───────────────────────────────────┼───────────────────┐
                        │                                   │                   │
                        ▼                                   ▼                   ▼
              ┌─────────────────┐              ┌─────────────────┐    ┌─────────────────┐
              │  n8n RAG        │              │  Google Drive   │    │  Log file       │
              │  Webhook        │              │  (NotebookLM)   │    │  logs/          │
              └────────┬────────┘              └─────────────────┘    └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Supabase       │
              │  project_knowledge │
              │  + pgvector     │
              └─────────────────┘
                       ▲
                       │
              ┌─────────────────┐
              │  Agentes IA     │
              │  POST /api/agent/rag/search │
              └─────────────────┘
```

## Componentes

### 1. Base de Datos (`project_knowledge`)

**Tabla:** `project_knowledge`
- `id` (UUID): Identificador único
- `file_name` (TEXT): Nombre del archivo
- `file_path` (TEXT): Ruta relativa en el repo
- `content` (TEXT): Contenido completo
- `content_hash` (TEXT): SHA256 para detectar cambios
- `embedding` (vector(768)): Embedding de Gemini
- `version` (TEXT): Commit SHA o fecha
- `doc_type` (TEXT): Tipo de documento (PRD, DESIGN, TECH_STACK, etc.)

**Índices:**
- `idx_project_knowledge_file_path`: Unique index
- `idx_project_knowledge_embedding`: IVFFlat para búsqueda vectorial
- `idx_project_knowledge_doc_type`: Filtrado por tipo

### 2. Workflow n8n - RAG Indexing

**Archivo:** `docs/n8n/workflows/project-knowledge-rag-workflow.json`

**Webhook:** `POST /webhook/project-knowledge-rag`

**Flujo:**
1. Recibe archivo (file_name, content, version)
2. Valida campos requeridos
3. Verifica si el contenido cambió (usando content_hash)
4. Si cambió: genera embedding con Gemini
5. Upsert en Supabase

### 3. Workflow n8n - NotebookLM Sync

**Archivo:** `docs/n8n/workflows/notebooklm-drive-sync-workflow.json`

**Webhook:** `POST /webhook/notebooklm-sync`

**Flujo:**
1. Detecta cambios en commits
2. Filtra solo archivos .md relevantes
3. Decodifica contenido de GitHub API
4. Sube a Google Drive folder

### 4. API Endpoints (Backend)

**`POST /api/agent/rag/search`** - Búsqueda semántica
```json
{
  "query": "¿Cómo funciona el sistema de pagos?",
  "match_count": 5,
  "doc_type_filter": "PRD",
  "use_semantic": true
}
```

**`GET /api/agent/rag/stats`** - Estadísticas
```json
{
  "total_documents": 6,
  "by_type": { "PRD": 1, "DESIGN": 1, "TECH_STACK": 1, "REGLAS": 1, "CHANGELOG": 2 }
}
```

**`GET /api/agent/rag/list`** - Listar documentos
```json
{
  "documents": [...],
  "total": 6,
  "limit": 50,
  "offset": 0
}
```

**`POST /api/agent/rag/index`** - Indexar manualmente

### 5. Script de Sincronización

**Archivo:** `scripts/sync_project_knowledge.py`

**Uso:**
```bash
# Modo hook (automático en git push)
python scripts/sync_project_knowledge.py --git-hook

# Indexar archivos específicos
python scripts/sync_project_knowledge.py --files "PRD.md,TECH_STACK.md" --commit "abc123"

# Full sync (todos los archivos core)
python scripts/sync_project_knowledge.py --no-drive

# Help
python scripts/sync_project_knowledge.py --help
```

## Instalación

### 1. Aplicar Migración SQL

```bash
npx supabase db push
```

O ejecutar manualmente:
```bash
psql $DATABASE_URL -f supabase/migrations/20260409_create_project_knowledge.sql
```

### 2. Importar Workflows n8n

1. Abrir n8n (https://n8n.wilkiedevs.com)
2. Importar `docs/n8n/workflows/project-knowledge-rag-workflow.json`
3. Importar `docs/n8n/workflows/notebooklm-drive-sync-workflow.json`
4. Activar ambos workflows

### 3. Configurar Git Hook

```bash
# Copiar el hook
cp scripts/git-hooks/post-receive .git/hooks/post-receive
chmod +x .git/hooks/post-receive
```

### 4. Configurar Variables de Entorno

```bash
# .env del servidor
N8N_PROJECT_KNOWLEDGE_URL=https://n8n.wilkiedevs.com/webhook/project-knowledge-rag
N8N_NOTEBOOKLM_SYNC_URL=https://n8n.wilkiedevs.com/webhook/notebooklm-sync
GDRIVE_CREDENTIALS_FILE=/root/.credentials/google_drive_lookitry.json
GDRIVE_NOTEBOOKLM_FOLDER_ID=tu_folder_id_de_gdrive
```

### 5. Configurar Google Drive (Opcional)

1. Crear carpeta `Lookitry_Project_Knowledge` en Google Drive
2. Crear cuenta de servicio en Google Cloud Console
3. Descargar JSON de credenciales
4. Compartir la carpeta con la cuenta de servicio
5. Guardar credenciales en el servidor

## Uso por Agentes

### Búsqueda Semántica (Recomendado)

```typescript
// Desde cualquier agente
const response = await fetch('https://api.lookitry.com/api/agent/rag/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "¿Cuáles son los planes de suscripción disponibles?",
    match_count: 3,
    use_semantic: true
  })
});

const { results } = await response.json();
// results[0].content contiene el documento más relevante
```

### Búsqueda por Tipo

```typescript
// Filtrar por tipo de documento
const response = await fetch('https://api.lookitry.com/api/agent/rag/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "reglas de diseño",
    doc_type_filter: "DESIGN",
    match_count: 5
  })
});
```

## Monitoreo

### Verificar Workflows Activos

```bash
# En n8n
curl -s "https://n8n.wilkiedevs.com/api/v1/workflows?active=true" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | jq '.data[] | select(.tags[].name == \"SaaS\")'
```

### Logs de Sincronización

```bash
tail -f logs/knowledge_sync.log
```

### Estadísticas RAG

```bash
curl -s "https://api.lookitry.com/api/agent/rag/stats"
```

## Troubleshooting

### El embedding no se genera
1. Verificar credenciales de Google Palm API en n8n
2. Revisar logs del workflow en n8n
3. Verificar que la tabla existe y tiene la extensión vector

### Google Drive no sincroniza
1. Verificar que las credenciales existen
2. Verificar que la carpeta está compartida
3. Revisar logs del workflow de NotebookLM

### Búsqueda no devuelve resultados
1. Verificar que hay documentos indexados: `GET /api/agent/rag/stats`
2. Verificar que los embeddings existen: buscar NULLs en la columna embedding
3. Probar con búsqueda por palabras clave: `use_semantic: false`

## Archivos Core Indexados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| PRD.md | PRD | Product Requirements Document |
| DESIGN.md | DESIGN | Sistema de diseño y convenciones UI/UX |
| TECH_STACK.md | TECH_STACK | Arquitectura técnica completa |
| REGLAS_IMPORTANTES.md | REGLAS | Reglas operativas |
| CHANGELOG.md | CHANGELOG | Registro de cambios recientes |
| AGENTS.md | AGENTS | Sistema de agentes IA |

## Créditos

- Embedding: Gemini text-embedding-001 (768 dims)
- Base de datos vectorial: pgvector en Supabase
- Orquestación: n8n
- Drive sync: Google Drive API v3
