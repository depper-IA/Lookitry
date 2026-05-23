# Requirements Document

## Introducción

Lookitry es un SaaS de virtual try-on construido sobre Next.js 14, Express/Node.js, Supabase, Docker y n8n. El proyecto tiene múltiples IAs configuradas (Pi, Claude/Kiro, OpenCode, Gentle AI y agentes internos como Sammantha, Pixel, Kira, Nadia, etc.) y un "Cerebro" en `Lookitry_Brain_Vault/Cerebro/` que actúa como fuente de verdad del proyecto, conectado a Obsidian como vault.

Este feature aborda cuatro problemas estructurales críticos:

1. **Credenciales expuestas en el historial de git** — archivos con API keys, tokens JWT, claves SSH y contraseñas en texto plano están trackeados en el repositorio.
2. **Desorden en el directorio raíz** — cientos de scripts de diagnóstico, logs, archivos de test y JSONs sueltos sin estructura clara.
3. **Conexión Cerebro-Obsidian no formalizada** — el vault existe pero la sincronización y la jerarquía de verdad no están documentadas ni garantizadas.
4. **Protocolo de arranque de IAs no unificado** — cada herramienta tiene su propia configuración pero no hay un protocolo único que obligue a todas las IAs a leer el Cerebro antes de actuar.

---

## Glosario

- **Cerebro**: Directorio `Lookitry_Brain_Vault/Cerebro/` que contiene la documentación maestra del proyecto. Es la fuente de verdad única para todas las IAs y agentes.
- **Vault**: El directorio `Lookitry_Brain_Vault/` configurado como vault de Obsidian.
- **IA_Tool**: Cualquier herramienta de IA que opera sobre el repositorio: Pi, Claude/Kiro, OpenCode, Gentle AI.
- **Agente_Interno**: Cualquier agente definido en `opencode.json` o `.opencode/agents/`: Sammantha, Pixel, Kira, Nadia, Marlo, Zephyr, Lina, Cipher.
- **Protocolo_Arranque**: Secuencia de pasos que toda IA_Tool y Agente_Interno DEBE ejecutar al iniciar una sesión antes de realizar cualquier acción significativa.
- **Credencial_Expuesta**: Cualquier API key, token JWT, clave SSH, contraseña o secreto almacenado en texto plano en un archivo trackeado por git.
- **Script_Diagnóstico**: Archivo Python, JavaScript o shell en `scripts/` creado para depurar un problema puntual, sin valor de mantenimiento a largo plazo.
- **Archivo_Temporal**: Archivo de log, output de test, JSON de workflow temporal o imagen de prueba que no pertenece al código fuente del proyecto.
- **Gitignore_Maestro**: El archivo `.gitignore` en la raíz del repositorio que define qué archivos no deben ser trackeados.
- **Steering_File**: Archivo Markdown en `.kiro/steering/` que Kiro carga automáticamente como contexto persistente en cada conversación.
- **REGLAS_IMPORTANTES**: Archivo `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md`, documento maestro con `inclusion: always` en su frontmatter.
- **MAPA_MAESTRO**: Archivo `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md`, índice de navegación del Cerebro.
- **Rotación_de_Credenciales**: Proceso manual ejecutado por el usuario (Travis) para invalidar y reemplazar credenciales comprometidas. Las IAs NO pueden ejecutar este proceso.

---

## Requisitos

### Requisito 1: Limpieza de Credenciales del Historial de Git

**User Story:** Como founder de Lookitry, quiero eliminar todas las credenciales reales del historial de git y del árbol de trabajo actual, para que el repositorio no contenga secretos aunque sea privado, reduciendo el riesgo de exposición ante un cambio de visibilidad o acceso no autorizado.

#### Criterios de Aceptación

1. THE Git_Repository SHALL have a `.gitignore` that explicitly excludes all files known to contain credentials: `opencode.json`, `scripts/n8n_api_key.txt`, `scripts/id_rsa_lookitry`, `bedrock-long-term-api-key.csv`, and any file matching `*.csv` with "api-key" or "credentials" in the name.

2. WHEN a file containing a Credencial_Expuesta is detected in the git staging area, THE Gitignore_Maestro SHALL prevent that file from being committed by listing it explicitly or via pattern.

3. THE Git_Repository SHALL contain a `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md` file that lists every Credencial_Expuesta found, the file it was in, and the service it belongs to, so the user can rotate each one manually.

4. THE `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` file SHALL NOT contain any plaintext password, SSH credential, or API key in its content — sensitive values must be replaced with references to `backend/.env` or equivalent secret stores.

5. WHEN the `.gitignore` is updated to exclude a previously-tracked file, THE Git_Repository SHALL include instructions in `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md` explaining that `git rm --cached <file>` must be run to untrack the file without deleting it locally.

6. IF a file listed in `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md` is still present in the git index after the `.gitignore` update, THEN THE Gitignore_Maestro SHALL document the exact `git rm --cached` command needed to remove it from tracking.

7. THE `docs/security/CREDENTIALS_ROTATION_CHECKLIST.md` SHALL include a warning that git history rewrite (e.g., `git filter-repo`) is required to fully purge credentials from past commits, and that this step MUST be authorized and executed by the user.

---

### Requisito 2: Organización del Directorio Raíz y `scripts/`

**User Story:** Como desarrollador que trabaja en Lookitry, quiero que el directorio raíz y la carpeta `scripts/` tengan una estructura clara y predecible, para poder encontrar herramientas útiles rápidamente y distinguirlas de archivos temporales o de diagnóstico.

#### Criterios de Aceptación

1. THE Project_Structure SHALL define a `scripts/archive/` subdirectory as the destination for all Script_Diagnóstico files that have no ongoing maintenance value.

2. THE Project_Structure SHALL define a `scripts/tools/` subdirectory for scripts with ongoing utility (deploy, image generation, knowledge sync, etc.).

3. WHEN a Script_Diagnóstico file in `scripts/` has a name matching the pattern `check_*`, `test_*`, `debug_*`, `fix_*`, `verify_*`, `tail_*`, `get_*`, `fast_deploy_*`, or `_*` (underscore prefix), THE Project_Structure SHALL classify it as a candidate for `scripts/archive/` unless it is explicitly listed as a maintained tool.

4. THE Gitignore_Maestro SHALL include patterns to exclude log files (`*.log`, `*.txt` in scripts), temporary Python outputs, and diagnostic artifacts from git tracking.

5. THE Project_Structure SHALL define a `docs/` directory at the root level with subdirectories: `docs/security/`, `docs/architecture/`, and `docs/runbooks/` for project documentation that is not part of the Cerebro vault.

6. WHEN the root directory contains files that are Archivo_Temporal (logs, test outputs, diagnostic JSONs not part of source code), THE Gitignore_Maestro SHALL include patterns to prevent those file types from being tracked.

7. THE `scripts/` directory SHALL contain a `README.md` that lists all maintained scripts with a one-line description of their purpose, so any developer or IA can understand what each script does without reading its source.

8. THE Project_Structure SHALL NOT move or rename `scripts/_deploy_now.py`, `scripts/generate_image.py`, or any script explicitly referenced in `REGLAS_IMPORTANTES.md` without updating all references in that document simultaneously.

---

### Requisito 3: Formalización de la Conexión Cerebro-Obsidian

**User Story:** Como usuario de Obsidian y founder de Lookitry, quiero que la relación entre el Cerebro y el vault de Obsidian esté documentada y sea predecible, para que los cambios hechos en el Cerebro se reflejen correctamente en Obsidian y viceversa, sin conflictos ni pérdida de información.

#### Criterios de Aceptación

1. THE Cerebro SHALL contain a `Lookitry_Brain_Vault/Cerebro/Docs/OBSIDIAN_SYNC.md` file that documents: the vault path, which files have `inclusion: always` frontmatter, the naming convention for internal links (`[[NombreArchivo]]`), and the rule that the Cerebro is the source of truth over any Obsidian-generated metadata.

2. WHEN a new document is added to `Lookitry_Brain_Vault/Cerebro/`, THE MAPA_MAESTRO SHALL be updated to include a link to that document in the appropriate section.

3. THE `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` file SHALL maintain its `inclusion: always` frontmatter so that Obsidian and any MCP that reads the vault always loads it automatically.

4. THE Cerebro SHALL define in `OBSIDIAN_SYNC.md` which files are "always-load" (frontmatter `inclusion: always`) and which are "on-demand", so IAs know which documents to read proactively versus on request.

5. IF a file in `Lookitry_Brain_Vault/Cerebro/` contains an internal Obsidian link (`[[Target]]`) that points to a non-existent file, THEN THE MAPA_MAESTRO SHALL flag it as a broken link in a dedicated "Broken Links" section until the target file is created.

6. THE `Lookitry_Brain_Vault/` directory SHALL contain a `README.md` at its root that explains the vault structure, the role of the Cerebro, and how to open it in Obsidian, so any new collaborator or IA can orient itself without prior context.

---

### Requisito 4: Protocolo Universal de Arranque para Todas las IAs

**User Story:** Como founder de Lookitry, quiero que todas las IAs y agentes (Pi, Claude/Kiro, OpenCode, Gentle AI, Sammantha, Pixel, Kira, Nadia, Marlo, Zephyr, Lina, Cipher) lean el Cerebro al inicio de cada sesión antes de ejecutar cualquier acción significativa, para que ninguna IA opere con contexto desactualizado o incompleto.

#### Criterios de Aceptación

1. THE Protocolo_Arranque SHALL be defined in a single canonical document: `Lookitry_Brain_Vault/Cerebro/Protocolos/ARRANQUE_UNIVERSAL.md`, which lists the exact files to read in order and the conditions under which each applies.

2. THE `ARRANQUE_UNIVERSAL.md` SHALL specify the following mandatory read sequence for all IAs and Agentes_Internos:
   - Step 1: `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` (always)
   - Step 2: `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md` (always)
   - Step 3: `memory/YYYY-MM-DD.md` for today and yesterday (when available)
   - Step 4: `MEMORY.md` (only in main/direct sessions, not group chats or shared contexts)

3. THE `CLAUDE.md` file SHALL reference `ARRANQUE_UNIVERSAL.md` as the canonical startup protocol and update its "PROTOCOLO DE ARRANQUE" section to point to that document instead of duplicating the steps.

4. THE `opencode.json` agent prompts for `sammy`, `webwizard`, `devguardian`, `dataalchemist`, `growthpilot`, `architectai`, and `docs-writter` SHALL each include an explicit instruction to read `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` as the first action of every session.

5. THE `.kiro/steering/LOOKITRY_ARCH.md` Steering_File SHALL include a section titled "Protocolo de Arranque" that references `ARRANQUE_UNIVERSAL.md` and lists the mandatory read sequence, so Kiro loads this context automatically in every conversation.

6. THE `AGENTS.md` file at the root SHALL include a reference to `ARRANQUE_UNIVERSAL.md` in its "Session Startup" section, replacing or augmenting the current SOUL.md/USER.md sequence with the Cerebro-first protocol.

7. WHEN a new IA_Tool or Agente_Interno is added to the project, THE `ARRANQUE_UNIVERSAL.md` SHALL be updated to include that tool's configuration file path and the mechanism by which the startup protocol is enforced for it.

8. THE `ARRANQUE_UNIVERSAL.md` SHALL include a "Verification" section that describes how to confirm a given IA has read the Cerebro: the IA should be able to answer questions about the current model default, the deploy script location, and the color palette without being told, as evidence of having read `REGLAS_IMPORTANTES.md`.

---

### Requisito 5: Actualización del `.gitignore` Maestro

**User Story:** Como desarrollador, quiero que el `.gitignore` cubra todos los patrones de archivos que no deben ser trackeados (credenciales, logs, scripts temporales, archivos de diagnóstico), para que `git status` muestre solo cambios relevantes al código fuente.

#### Criterios de Aceptación

1. THE Gitignore_Maestro SHALL include explicit entries for: `opencode.json`, `scripts/n8n_api_key.txt`, `scripts/id_rsa_lookitry`, `bedrock-long-term-api-key.csv`, and `*.pem`.

2. THE Gitignore_Maestro SHALL include pattern-based entries for: `scripts/*.log`, `scripts/*.txt` (excluding `scripts/README.md`), `scripts/vps_*.txt`, `scripts/backend_logs*.txt`, and `scripts/docker_build_*.log`.

3. THE Gitignore_Maestro SHALL include entries for common diagnostic output files: `test_proxy.py` outputs, `*.csv` files containing "key" or "credential" in the filename, and any file matching `*-api-key*`.

4. WHEN a new secret or credential file is created in the project, THE Gitignore_Maestro SHALL be updated in the same commit that creates the file, so the credential is never committed even transiently.

5. THE Gitignore_Maestro SHALL preserve all existing valid entries and SHALL NOT remove any entry that was previously protecting a sensitive file type.
