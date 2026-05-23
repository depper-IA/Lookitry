# Utilidades y Scripts de Infraestructura - Lookitry

**Última actualización:** Mayo 2026  
**Nota:** Solo los scripts en `scripts/tools/` están activos. El resto está en `scripts/archive/`.

## Scripts Activos (en `scripts/tools/`)

### _deploy_now.py
- **Ruta**: `scripts/tools/_deploy_now.py`
- **Función**: Script central de despliegue al VPS. Commit, push y rebuild de contenedores Docker.
- **Parámetros**: `--force` (rebuild total), `--frontend`, `--backend`, `--no-cache`, `--status`

### sync_project_knowledge.py
- **Ruta**: `scripts/tools/sync_project_knowledge.py`
- **Función**: Sincroniza documentación entre repositorio y el Cerebro (Obsidian).

### generate_image.py
- **Ruta**: `scripts/tools/generate_image.py`
- **Función**: Genera imágenes de marketing con Vertex AI (Nano Banana).

---

## Scripts Archivados (en `scripts/archive/`)

Los siguientes scripts fueron archivados porque están obsoletos o fueron reemplazados:

| Script | Razón de archivado |
|--------|-------------------|
| `check_integrity.py` | No usado, verificado manualmente |
| `stress_test.py` | Herramienta de debugging, no para uso regular |
| `verify_vps.py` | Reemplazado por `_deploy_now.py --status` |
| `Supabase-Lookitry.ps1` | No mantenido |
| `patch_layout.py` / `patch_settings.py` | Obsoletos, no compatibles con Next.js 14+ |
| `sync-knowledge-base.py` | Reemplazado por `sync_project_knowledge.py` |

---

## Scripts de Diagnóstico (para cuando algo falla)

Ver `scripts/archive/` para scripts de debugging como:
- `check_containers.py` — estado de Docker
- `check_redis.py` — conexión Redis
- `check_n8n_*.py` — workflows n8n
- `check_frontend_logs.py` — logs del frontend
- `check_backend_logs.py` — logs del backend

**Nota:** Estos scripts de diagnóstico se usan SOLO cuando hay problemas. No ejecutarlos en producción sin necesidad.

---

## Reglas de Uso de Scripts

1. **SIEMPRE usar** `scripts/tools/_deploy_now.py` para deploys
2. **NUNCA ejecutar** scripts de `scripts/archive/` sin justificación
3. **NUNCA hardcodear** credenciales en scripts — usar variables de entorno