# Plan de Implementación: project-organization-cerebro-sync

## Overview

Reorganización de la infraestructura de conocimiento y configuración de Lookitry en cuatro fases ordenadas por prioridad: limpieza de credenciales expuestas, organización de `scripts/` y `docs/`, formalización del contrato Cerebro-Obsidian, y protocolo universal de arranque para todas las IAs.

**Importante**: Todos los cambios son de configuración y documentación — no hay modificaciones al código de la aplicación (frontend/backend). La rotación de credenciales y la ejecución de `git rm --cached` son tareas MANUALES del usuario (Travis) documentadas en el checklist, no ejecutadas por la IA.

---

## Tasks

- [x] 1. Fase 1 — Seguridad: Actualizar `.gitignore` maestro
  - Agregar sección `# CREDENCIALES — NUNCA TRACKEAR` con entradas explícitas: `opencode.json`, `scripts/n8n_api_key.txt`, `scripts/id_rsa_lookitry`, `bedrock-long-term-api-key.csv`, `*-api-key*.csv`, `*-credentials*.csv`, `*-api-key*`, `*.pem`
  - Agregar sección `# SCRIPTS — ARTEFACTOS DE DIAGNÓSTICO` con patrones: `scripts/*.log`, `scripts/*.txt`, `scripts/vps_*.txt`, `scripts/backend_logs*.txt`, `scripts/docker_build_*.log`, `scripts/telegram_msg.json`, `scripts/descriptor_workflow.json`, `scripts/traefik-api.yml`, `scripts/traefik-backend-api.yml`, `scripts/traefik-compose-fixed.yml`, `scripts/n8n-docker-compose.yml`
  - Agregar sección `# ARCHIVOS TEMPORALES DE TEST` con: `test_proxy.py`, `*.test.output`, `vps_diag.txt`
  - Preservar todas las entradas existentes — solo agregar, nunca eliminar
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.5_

- [x] 2. Fase 1 — Seguridad: Crear `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md`
  - [x] 2.1 Crear estructura de directorios `docs/security/`, `docs/architecture/`, `docs/runbooks/`
    - Crear los tres directorios con un `.gitkeep` en `docs/architecture/` y `docs/runbooks/` para que git los trackee
    - _Requirements: 2.5_

  - [x] 2.2 Crear `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md`
    - Incluir tabla de credenciales a rotar con columnas: Servicio, Archivo Comprometido, Variable/Campo, Prioridad
    - Cubrir todos los archivos identificados: `scripts/id_rsa_lookitry` (CRÍTICA), `REGLAS_IMPORTANTES.md` contraseña VPS (CRÍTICA), `scripts/n8n_api_key.txt` (ALTA), `opencode.json` tokens Telegram/Hostinger/MiniMax/Groq/n8n (ALTA), `bedrock-long-term-api-key.csv` (ALTA)
    - Incluir sección "Comandos git rm --cached" con los comandos exactos para cada archivo
    - Incluir advertencia sobre `git filter-repo` para purga del historial, con instrucción explícita de que requiere autorización de Travis
    - _Requirements: 1.3, 1.5, 1.6, 1.7_

- [x] 3. Fase 1 — Seguridad: Limpiar credenciales de archivos trackeados
  - [x] 3.1 Limpiar `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md`
    - Localizar la sección VPS PRODUCCIÓN que contiene la contraseña en texto plano
    - Reemplazar el valor real de la contraseña por la referencia: `[ver backend/.env — variable VPS_PASSWORD o equivalente]`
    - Mantener el resto del contenido intacto — solo reemplazar el valor sensible
    - _Requirements: 1.4_

  - [x] 3.2 Limpiar `.kiro/steering/LOOKITRY_ARCH.md` — tabla "Credenciales MCP"
    - Reemplazar el valor real de `TELEGRAM_BOT_TOKEN` por `[ver backend/.env o opencode.json local]`
    - Reemplazar el valor real de `N8N_API_KEY` (JWT completo) por `[ver backend/.env o opencode.json local]`
    - Reemplazar el valor real de `API_TOKEN` de Hostinger por `[ver backend/.env o opencode.json local]`
    - Reemplazar el valor real de `CONTEXT7_API_KEY` por `[ver backend/.env o opencode.json local]`
    - Mantener las columnas MCP, Variable y la estructura de la tabla — solo reemplazar los valores en la columna "Valor"
    - _Requirements: 1.4_

- [x] 3.3 Crear `opencode.example.json` — template de credenciales para nuevo PC
    - Copiar la estructura completa de `opencode.json` manteniendo todos los campos, modelos, agentes, MCPs y permisos
    - Reemplazar TODOS los valores reales de credenciales por placeholders descriptivos:
      - MiniMax `apiKey` → `"TU_MINIMAX_API_KEY"`
      - Groq `apiKey` → `"TU_GROQ_API_KEY"`
      - Telegram `TELEGRAM_BOT_TOKEN` → `"TU_TELEGRAM_BOT_TOKEN"`
      - Telegram `TELEGRAM_CHAT_ID` → `"TU_TELEGRAM_CHAT_ID"`
      - n8n `N8N_API_KEY` → `"TU_N8N_API_KEY"`
      - Hostinger `API_TOKEN` → `"TU_HOSTINGER_API_TOKEN"`
      - Context7 `CONTEXT7_API_KEY` → `"TU_CONTEXT7_API_KEY"`
    - Agregar comentario al inicio del JSON explicando: "Copiar como opencode.json y completar con credenciales reales"
    - Este archivo SÍ se trackea en git — es el template de onboarding para nuevo PC
    - _Requirements: 1.1, 1.2_

- [x] 4. Checkpoint — Fase 1 completa
  - Verificar que `.gitignore` tiene las nuevas secciones de credenciales y diagnósticos
  - Verificar que `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md` existe y lista todos los archivos comprometidos
  - Verificar que `opencode.example.json` existe con todos los placeholders y sin credenciales reales
  - Verificar que `REGLAS_IMPORTANTES.md` no contiene contraseñas en texto plano
  - Verificar que `LOOKITRY_ARCH.md` no contiene tokens reales en la tabla de credenciales
  - Preguntar al usuario si tiene dudas antes de continuar con la Fase 2

- [x] 5. Fase 2 — Organización: Crear estructura de `scripts/`
  - [x] 5.1 Crear `scripts/tools/` y mover los cuatro scripts mantenidos
    - Mover `scripts/_deploy_now.py` → `scripts/tools/_deploy_now.py`
    - Mover `scripts/generate_image.py` → `scripts/tools/generate_image.py`
    - Mover `scripts/sync_project_knowledge.py` → `scripts/tools/sync_project_knowledge.py`
    - Mover `scripts/sync-knowledge-base.py` → `scripts/tools/sync-knowledge-base.py`
    - _Requirements: 2.2, 2.8_

  - [x] 5.2 Actualizar referencias a scripts movidos en el mismo commit
    - En `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` sección 1.1: actualizar ruta de `scripts/_deploy_now.py` → `scripts/tools/_deploy_now.py` (incluyendo la ruta absoluta del VPS si aparece)
    - En `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` sección 1.3: actualizar ruta de `scripts/generate_image.py` → `scripts/tools/generate_image.py`
    - Verificar si `LOOKITRY_ARCH.md` también referencia estas rutas y actualizarlas
    - _Requirements: 2.8_

  - [x] 5.3 Crear `scripts/archive/` y mover scripts de diagnóstico
    - Crear el directorio `scripts/archive/`
    - Mover todos los scripts cuyo nombre cumple alguno de estos patrones: `check_*`, `test_*`, `debug_*`, `fix_*`, `verify_*`, `tail_*`, `get_*`, `fast_deploy_*`, `_*` (excepto `_deploy_now.py` ya movido)
    - Mover archivos `.txt`, `.log`, `.json` de diagnóstico (ej: `backend_logs.txt`, `telegram_msg.json`, `descriptor_workflow.json`)
    - Mover archivos `.yml` de configuración temporal (ej: `traefik-api.yml`, `n8n-docker-compose.yml`)
    - _Requirements: 2.1, 2.3_

  - [x] 5.4 Crear `scripts/README.md`
    - Incluir tabla "Scripts Mantenidos (scripts/tools/)" con columnas: Script, Propósito, Uso — cubriendo los cuatro scripts de `tools/`
    - Incluir sección "Archive (scripts/archive/)" explicando que contiene scripts históricos de diagnóstico sin valor de mantenimiento
    - _Requirements: 2.7_

- [x] 6. Checkpoint — Fase 2 completa
  - Verificar que `scripts/tools/` contiene exactamente los cuatro scripts mantenidos
  - Verificar que las referencias en `REGLAS_IMPORTANTES.md` apuntan a `scripts/tools/`
  - Verificar que `scripts/README.md` existe con la tabla de scripts
  - Preguntar al usuario si tiene dudas antes de continuar con la Fase 3

- [x] 7. Fase 3 — Cerebro-Obsidian: Crear documentos del vault
  - [x] 7.1 Crear `Lookitry_Brain_Vault/Cerebro/Docs/OBSIDIAN_SYNC.md`
    - Incluir sección "Vault" con ruta del vault y del Cerebro
    - Incluir sección "Jerarquía de Verdad" (Cerebro > Obsidian)
    - Incluir tabla "Archivos Always-Load" con `REGLAS_IMPORTANTES.md` y su razón
    - Incluir tabla "Archivos On-Demand" con los cinco documentos y cuándo leerlos
    - Incluir sección "Convención de Links Internos" con la regla `[[NombreArchivo]]`
    - Incluir sección "Regla de Actualización del MAPA_MAESTRO"
    - Incluir sección "Links Rotos" con la instrucción de documentarlos en MAPA_MAESTRO
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 7.2 Crear `Lookitry_Brain_Vault/README.md`
    - Incluir sección "Estructura" explicando `Cerebro/` y `.obsidian/`
    - Incluir sección "Cómo abrir en Obsidian" con los tres pasos
    - Incluir "Regla de Oro": el Cerebro es la fuente de verdad, Obsidian es el visor
    - _Requirements: 3.6_

  - [x] 7.3 Actualizar `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md`
    - Agregar sección "Protocolos" con link `[[ARRANQUE_UNIVERSAL]]` (nota: el archivo se crea en la Fase 4, documentar como link pendiente si aún no existe)
    - Agregar sección "Docs" con link `[[OBSIDIAN_SYNC]]`
    - Verificar que el frontmatter `inclusion: always` de `REGLAS_IMPORTANTES.md` no fue alterado
    - _Requirements: 3.2, 3.3_

- [x] 8. Checkpoint — Fase 3 completa
  - Verificar que `Lookitry_Brain_Vault/Cerebro/Docs/OBSIDIAN_SYNC.md` existe con todas las secciones
  - Verificar que `Lookitry_Brain_Vault/README.md` existe
  - Verificar que `MAPA_MAESTRO.md` tiene links a los nuevos documentos
  - Preguntar al usuario si tiene dudas antes de continuar con la Fase 4

- [x] 9. Fase 4 — Protocolo Universal: Crear `ARRANQUE_UNIVERSAL.md`
  - Crear `Lookitry_Brain_Vault/Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md`
  - Incluir sección "Secuencia Obligatoria" con los cuatro pasos en orden: REGLAS_IMPORTANTES → MAPA_MAESTRO → memory reciente → MEMORY.md (solo sesión principal)
  - Incluir tabla "Configuración por Herramienta" con las cuatro herramientas: Claude/Kiro, Kiro steering, OpenCode agentes, Pi/Gentle AI
  - Incluir sección "Verificación de Cumplimiento" con las cuatro preguntas de control (modelo default, script de deploy, gestor de paquetes, colores del sistema de diseño)
  - Incluir sección "Actualización de Este Documento" con los tres pasos para agregar una nueva IA
  - _Requirements: 4.1, 4.2, 4.7, 4.8_

- [x] 10. Fase 4 — Protocolo Universal: Actualizar archivos de configuración de IAs
  - [x] 10.1 Actualizar `CLAUDE.md` — sección PROTOCOLO DE ARRANQUE
    - Localizar la sección actual "PROTOCOLO DE ARRANQUE"
    - Reemplazar los pasos duplicados por una referencia directa a `ARRANQUE_UNIVERSAL.md`
    - Mantener un resumen de una línea: "Leer REGLAS_IMPORTANTES.md → MAPA_MAESTRO.md → memory reciente → MEMORY.md (solo sesión principal)"
    - _Requirements: 4.3_

  - [x] 10.2 Actualizar `opencode.json` — campo `instructions` de cada agente
    - Agregar al inicio del campo `instructions` de los agentes: `sammy`, `webwizard`, `devguardian`, `dataalchemist`, `growthpilot`, `architectai`, `docs-writter`
    - Texto a agregar: `PRIMERA ACCIÓN OBLIGATORIA: Leer Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md antes de cualquier otra acción. Ver protocolo completo en: Lookitry_Brain_Vault/Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md`
    - No modificar ningún otro campo del JSON (modelos, MCPs, permisos)
    - _Requirements: 4.4_

  - [x] 10.3 Actualizar `.kiro/steering/LOOKITRY_ARCH.md` — agregar sección Protocolo de Arranque
    - Agregar al inicio del documento (después del título y antes de "Stack Técnico") una nueva sección `## Protocolo de Arranque`
    - La sección debe referenciar `ARRANQUE_UNIVERSAL.md` y listar la secuencia de cuatro pasos
    - _Requirements: 4.5_

  - [x] 10.4 Actualizar `AGENTS.md` — sección Session Startup
    - Localizar la sección "Session Startup"
    - Agregar referencia al protocolo canónico antes de los pasos actuales: `Protocolo canónico: Lookitry_Brain_Vault/Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md`
    - Agregar la secuencia de cuatro pasos del Cerebro-first protocol
    - Mantener los pasos existentes de SOUL.md/USER.md como complemento, no reemplazarlos
    - _Requirements: 4.6_

- [x] 11. Checkpoint final — Verificación completa
  - Verificar que `ARRANQUE_UNIVERSAL.md` existe con todas las secciones requeridas
  - Verificar que `CLAUDE.md` referencia `ARRANQUE_UNIVERSAL.md` sin duplicar pasos
  - Verificar que `opencode.json` tiene la instrucción de arranque en los siete agentes
  - Verificar que `LOOKITRY_ARCH.md` tiene la sección "Protocolo de Arranque" al inicio
  - Verificar que `AGENTS.md` tiene la referencia al protocolo canónico en "Session Startup"
  - Asegurarse de que todos los tests pasan, preguntar al usuario si tiene dudas antes de cerrar

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- No hay property-based tests en este feature — todos los cambios son documentación y configuración
- La ejecución de `git rm --cached` y la rotación de credenciales son tareas MANUALES de Travis — están documentadas en el checklist pero NO deben ser ejecutadas por la IA
- Al mover `_deploy_now.py` y `generate_image.py`, las referencias en `REGLAS_IMPORTANTES.md` DEBEN actualizarse en el mismo commit (tarea 5.1 + 5.2 van juntas)
- `opencode.json` se agrega al `.gitignore` pero NO se elimina del disco — el archivo sigue funcionando localmente
- `opencode.example.json` SÍ se trackea en git — es el template para clonar el repo en otro PC. Flujo: `cp opencode.example.json opencode.json` → completar con credenciales reales
- Usar conventional commits: `chore:`, `docs:`, `fix:` según corresponda a cada tarea
- El orden de las fases es deliberado: Seguridad primero (máxima prioridad), luego organización, luego documentación del vault, luego protocolo de arranque
