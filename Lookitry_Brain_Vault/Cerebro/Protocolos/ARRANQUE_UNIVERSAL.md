# Protocolo Universal de Arranque — Lookitry

> Todo agente e IA debe ejecutar esta secuencia antes de cualquier acción significativa.

## Secuencia Obligatoria (todas las IAs y agentes)

### Paso 1 — REGLAS_IMPORTANTES (siempre)
**Archivo**: `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md`

**Por qué**: Contiene reglas de implementación, modelo default, sistema de agentes, reglas de diseño, seguridad y deploy. Es la fuente de verdad operativa.

---

### Paso 2 — MAPA_MAESTRO (siempre)
**Archivo**: `Lookitry_Brain_Vault/Cerebro/MAPA_MAESTRO.md`

**Por qué**: Índice de navegación del Cerebro. Permite encontrar cualquier documento sin búsqueda exhaustiva.

---

### Paso 3 — Memoria Reciente (cuando disponible)
**Archivos**: `memory/YYYY-MM-DD.md` (hoy + ayer)

**Por qué**: Contexto de sesiones recientes. Evita repetir trabajo ya hecho.

---

### Paso 4 — Memoria de Largo Plazo (solo sesión principal)
**Archivo**: `MEMORY.md`

**Cuándo**: Solo en sesiones directas con Travis. **NO** en group chats ni contextos compartidos.

**Por qué**: Contiene contexto personal que no debe filtrarse a terceros.

---

## Configuración por Herramienta

| Herramienta | Archivo de Config | Mecanismo de Arranque |
|-------------|------------------|----------------------|
| Claude/Kiro | `CLAUDE.md` | Sección "PROTOCOLO DE ARRANQUE" |
| Kiro (steering) | `.kiro/steering/LOOKITRY_ARCH.md` | Sección "Protocolo de Arranque" |
| OpenCode (agentes) | `opencode.json` | Campo `instructions` de cada agente |
| Pi / Gentle AI | `AGENTS.md` | Sección "Session Startup" |

## Verificación de Cumplimiento

Una IA que ha leído correctamente `REGLAS_IMPORTANTES.md` puede responder sin ser informada:

- **Modelo default**: `minimax/MiniMax-M2.7`
- **Script de deploy**: `scripts/tools/_deploy_now.py`
- **Gestor de paquetes**: `pnpm` (NO `npm`)
- **Colores primarios del sistema**: `#FF5C3A` (naranja), `#0a0a0a` (negro base)

Si una IA no puede responder estas preguntas, no ha completado el arranque.

## Actualización de Este Documento

Cuando se agrega una nueva IA_Tool o Agente_Interno al proyecto:

1. Agregar una fila a la tabla "Configuración por Herramienta"
2. Documentar el archivo de config y el mecanismo de arranque
3. Verificar que el archivo de config referencia este documento