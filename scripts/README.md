# Scripts de Lookitry

## Scripts Mantenidos (`scripts/tools/`)

Estos son los únicos scripts con valor de mantenimiento continuo. Son los que se usan en el flujo de trabajo diario del proyecto.

| Script | Propósito | Uso |
|--------|-----------|-----|
| `_deploy_now.py` | Deploy inteligente al VPS — detecta qué cambió (frontend/backend) y reconstruye solo lo necesario | `python3 scripts/tools/_deploy_now.py [--frontend\|--backend\|--force\|--no-cache]` |
| `generate_image.py` | Genera imágenes con Vertex AI Imagen 3 y las guarda como WebP optimizado | `python3 scripts/tools/generate_image.py "descripción" --out path/imagen.webp --aspect 16:9` |
| `sync_project_knowledge.py` | Sincroniza la base de conocimiento del proyecto a Supabase (tabla `project_knowledge`) | `python3 scripts/tools/sync_project_knowledge.py` |
| `sync-knowledge-base.py` | Sincronización alternativa de la knowledge base | `python3 scripts/tools/sync-knowledge-base.py` |

### Flags de `_deploy_now.py`

| Flag | Efecto |
|------|--------|
| (sin flags) | Deploy inteligente: detecta qué cambió |
| `--force` | Fuerza rebuild aunque no haya cambios detectados |
| `--frontend` | Solo rebuild y deploy del frontend |
| `--backend` | Solo rebuild y deploy del backend |
| `--no-cache` | Build Docker sin cache (útil cuando cambia `package.json`) |

### Flags de `generate_image.py`

| Flag | Default | Descripción |
|------|---------|-------------|
| `--aspect` | `1:1` | Relación de aspecto: `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| `--count` | `1` | Variantes a generar (1–4) |
| `--quality` | `90` | Calidad de compresión WebP (1–100) |
| `--no-brand` | — | Omite el sufijo de estilo de marca del prompt |

---

## Archive (`scripts/archive/`)

Contiene ~252 scripts de diagnóstico creados durante sesiones de debugging a lo largo del desarrollo del proyecto. Incluye:

- Scripts de diagnóstico de VPS, Docker, Traefik, Redis, n8n
- Scripts de verificación de endpoints y servicios
- Logs y outputs de diagnóstico históricos
- Configuraciones temporales de Docker Compose y Traefik
- Scripts de enriquecimiento de leads y operaciones puntuales

**No tienen valor de mantenimiento** pero se conservan como referencia histórica.
No ejecutar en producción sin revisar su contenido primero — pueden contener configuraciones desactualizadas.

---

## Subdirectorios Existentes

| Directorio | Contenido |
|------------|-----------|
| `tools/` | Scripts mantenidos con uso activo |
| `archive/` | Scripts históricos de diagnóstico |
| `backup/` | Backups de configuración |
| `git-hooks/` | Hooks de git del proyecto |
| `migrations/` | Migraciones de base de datos |
| `n8n/` | Configuraciones y workflows de n8n |
| `sql/` | Queries SQL de referencia |
